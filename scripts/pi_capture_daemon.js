// ═══════════════════════════════════════════════════════════════
//  pi_capture_daemon.js  —  Direct MJPEG camera capture daemon
//
//  Captures MJPEG frames from /dev/video0 using ffmpeg (zero
//  transcode: camera natively outputs MJPEG, passed through as-is).
//
//  Stream format exactly matches the reference Pi Django app:
//    Content-Type: multipart/x-mixed-replace; boundary=frame
//    Each part: --frame\r\nContent-Type: image/jpeg\r\n\r\n{bytes}\r\n
//    NO Content-Length header in parts (matches Django StreamingHttpResponse)
//
//  Endpoints:
//    GET /stream          MJPEG live stream  (<img src="/stream"> works)
//    GET /capture         Latest single JPEG frame
//    GET /status          JSON {status: 'streaming'|'waiting'}
//    GET /record/start    Start MP4 recording
//    GET /record/stop     Stop recording
//    GET /ptz?pan=&tilt=&zoom=   PTZ controls (v4l2-ctl)
// ═══════════════════════════════════════════════════════════════

'use strict';

const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// ─── Configuration (set via PM2 env or process.env) ─────────────
const VIDEO_DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';
const WIDTH = process.env.WIDTH || '1920';
const HEIGHT = process.env.HEIGHT || '1080';
const FRAMERATE = process.env.FRAMERATE || '30';
const HTTP_PORT = 5555;

// ─── Frame state ────────────────────────────────────────────────
let latestFrame = null;          // Buffer — last complete JPEG
let captureProc = null;          // ffmpeg child process
let parseBuffer = Buffer.alloc(0);
let activeRecordingProc = null;
let recordingFilePath = null;

// JPEG markers
const SOI = Buffer.from([0xFF, 0xD8]);
const EOI = Buffer.from([0xFF, 0xD9]);
const MAX_BUF = 10 * 1024 * 1024; // 10 MB safety cap

// Frame event bus — notifies active /stream clients
const frameEmitter = new EventEmitter();
frameEmitter.setMaxListeners(30);

// ─── MJPEG part builder — EXACT match of reference Django app ───
// Reference:
//   yield (b'--frame\r\n'
//          b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
// No Content-Length — lets the browser stream continuously without
// waiting for a declared byte count before swapping the frame.
function buildMjpegPart(jpegBuffer) {
    // Pre-build a single Buffer to write atomically (one syscall)
    const header = Buffer.from('--frame\r\nContent-Type: image/jpeg\r\n\r\n');
    const trailer = Buffer.from('\r\n');
    return Buffer.concat([header, jpegBuffer, trailer]);
}

// ─── ffmpeg capture ─────────────────────────────────────────────
function startCapture() {
    if (captureProc) return;

    if (!fs.existsSync(VIDEO_DEVICE)) {
        console.log(`[Capture] ${VIDEO_DEVICE} not found — retrying in 2s...`);
        setTimeout(startCapture, 2000);
        return;
    }

    console.log(`[Capture] ffmpeg: ${VIDEO_DEVICE} ${WIDTH}x${HEIGHT} @${FRAMERATE}fps`);

    // -input_format yuyv422 : Capture RAW uncompressed video (bypasses faulty hardware MJPEG encoder)
    // -c:v mjpeg -q:v 2     : Encode clean MJPEG on the Pi's CPU (excellent quality, fixes artifacts)
    captureProc = spawn('ffmpeg', [
        '-loglevel', 'error',
        '-f', 'v4l2',
        '-input_format', 'yuyv422',
        '-video_size', `${WIDTH}x${HEIGHT}`,
        '-framerate', FRAMERATE,
        '-i', VIDEO_DEVICE,
        '-c:v', 'mjpeg',
        '-q:v', '2',
        '-f', 'image2pipe',
        'pipe:1'            // stdout
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    parseBuffer = Buffer.alloc(0);

    captureProc.stdout.on('data', (chunk) => {
        parseBuffer = Buffer.concat([parseBuffer, chunk]);

        // Guard: prevent unbounded growth
        if (parseBuffer.length > MAX_BUF) {
            parseBuffer = parseBuffer.slice(parseBuffer.length - 2 * 1024 * 1024);
        }

        // Extract every complete JPEG frame from the stream
        while (true) {
            const start = parseBuffer.indexOf(SOI);
            if (start === -1) { parseBuffer = Buffer.alloc(0); break; }
            if (start > 0) { parseBuffer = parseBuffer.slice(start); }

            const end = parseBuffer.indexOf(EOI, 2);
            if (end === -1) break;   // Incomplete frame — wait for more data

            const frame = Buffer.from(parseBuffer.slice(0, end + 2));
            parseBuffer = parseBuffer.slice(end + 2);

            latestFrame = frame;
            frameEmitter.emit('frame', frame);
        }
    });

    captureProc.stderr.on('data', (d) => {
        const s = d.toString().trim();
        if (s) console.error(`[ffmpeg] ${s}`);
    });

    captureProc.on('close', (code) => {
        console.log(`[Capture] ffmpeg exited (${code}) — restarting in 3s`);
        captureProc = null;
        latestFrame = null;
        parseBuffer = Buffer.alloc(0);
        setTimeout(startCapture, 3000);
    });

    captureProc.on('error', (err) => {
        console.error(`[Capture] spawn error: ${err.message}`);
        captureProc = null;
        setTimeout(startCapture, 3000);
    });
}

startCapture();

// ─── HTTP server ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost`);
    const pathname = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    // ── /stream  ─────────────────────────────────────────────────
    // Browser points an <img> element here.
    // The browser's native MJPEG decoder atomically swaps frames
    // when it sees the next --frame boundary (no JavaScript needed).
    if (pathname === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache',
        });

        // Send the current frame immediately so the <img> shows up at once
        if (latestFrame) {
            res.write(buildMjpegPart(latestFrame));
        }

        const onFrame = (frame) => {
            try { res.write(buildMjpegPart(frame)); }
            catch { /* client gone */ }
        };

        frameEmitter.on('frame', onFrame);
        req.on('close', () => { frameEmitter.removeListener('frame', onFrame); });
        // Stream stays open — do NOT call res.end()

        // ── /capture  ────────────────────────────────────────────────
    } else if (pathname === '/capture') {
        if (!latestFrame) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No frame yet' }));
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': latestFrame.length,
            'Cache-Control': 'no-cache',
        });
        res.end(latestFrame);

        // ── /status  ─────────────────────────────────────────────────
    } else if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: latestFrame ? 'streaming' : 'waiting' }));

        // ── /record/start  ───────────────────────────────────────────
    } else if (pathname.startsWith('/record/start')) {
        if (activeRecordingProc) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Already recording' }));
            return;
        }

        const mediaDir = path.join(process.cwd(), 'data', 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        const filename = `record_${Date.now()}.mp4`;
        recordingFilePath = path.join(mediaDir, filename);
        console.log(`[Record] → ${recordingFilePath}`);

        activeRecordingProc = spawn('ffmpeg', [
            '-loglevel', 'error',
            '-f', 'v4l2',
            '-input_format', 'mjpeg',
            '-video_size', `${WIDTH}x${HEIGHT}`,
            '-framerate', FRAMERATE,
            '-i', VIDEO_DEVICE,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-y', recordingFilePath
        ], { stdio: ['pipe', 'ignore', 'ignore'] });

        activeRecordingProc.on('close', () => { activeRecordingProc = null; });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recording_started', filePath: `/data/media/${filename}` }));

        // ── /record/stop  ────────────────────────────────────────────
    } else if (pathname.startsWith('/record/stop')) {
        if (!activeRecordingProc) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not recording' }));
            return;
        }
        activeRecordingProc.stdin.write('q\n');
        const savedUrl = `/api/capture-serve?path=${encodeURIComponent(recordingFilePath)}`;
        activeRecordingProc = null;
        recordingFilePath = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', filename: savedUrl }));

        // ── /ptz  ────────────────────────────────────────────────────
    } else if (pathname.startsWith('/ptz')) {
        const p = url.searchParams;
        const cmds = [];
        if (p.has('zoom')) cmds.push(`zoom_absolute=${p.get('zoom')}`);
        if (p.has('pan')) cmds.push(`pan_absolute=${p.get('pan')}`);
        if (p.has('tilt')) cmds.push(`tilt_absolute=${p.get('tilt')}`);
        if (cmds.length)
            exec(`v4l2-ctl -d ${VIDEO_DEVICE} -c ${cmds.join(',')}`,
                (err) => { if (err) console.error('[PTZ]', err.message); });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));

    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════');
    console.log(` CAPTURE DAEMON  http://0.0.0.0:${HTTP_PORT}`);
    console.log(` Device : ${VIDEO_DEVICE}  ${WIDTH}x${HEIGHT}@${FRAMERATE}fps`);
    console.log(` Stream : http://0.0.0.0:${HTTP_PORT}/stream`);
    console.log('═══════════════════════════════════════════════════');
});

// ─── Graceful shutdown ───────────────────────────────────────────
function shutdown() {
    if (captureProc) captureProc.kill('SIGTERM');
    if (activeRecordingProc) activeRecordingProc.kill('SIGTERM');
    server.close();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
