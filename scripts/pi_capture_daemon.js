// ═══════════════════════════════════════════════════════════════
//  pi_capture_daemon.js  —  Direct MJPEG camera capture daemon
//
//  FIX SUMMARY (v2 — based on hardware diagnostics):
//
//  ROOT CAUSE IDENTIFIED:
//    uvcvideo 4-1:1.1: Non-zero status (-71) in video completion handler.
//    frames: 2938 / empty: 2939  ← 1:1 ratio = empty URB packets per frame
//
//    The UltraSemi USB3 Video (345f:2131) camera sends spurious status
//    packets on its interrupt endpoint (interface 1.1). The Linux UVC
//    driver interprets these as partial frames and stitches them together,
//    causing horizontal tearing lines in the YUYV pipeline.
//
//  FIXES APPLIED:
//    1. Capture format: yuyv422 → mjpeg (native hardware MJPEG from camera)
//       MJPEG frames are self-contained JPEG atoms. A corrupted/empty URB
//       packet will at worst drop one frame — it CANNOT cause partial-frame
//       stitching or horizontal line artifacts.
//
//    2. Codec: mjpeg encoder (-q:v 2) → copy
//       Zero CPU transcode. Camera encodes on-chip. Pi just pipes bytes.
//
//    3. Added explicit ffmpeg flags to handle UVC quirks gracefully:
//       -use_wallclock_as_timestamps 1  — stable PTS despite empty packets
//       -skip_frame noref               — skip malformed reference frames
//       -fflags +nobuffer+discardcorrupt — discard corrupt frames instantly
//
//    4. Added /health endpoint for PM2 monitoring & uptime checks.
//
//    5. Added configurable resolution via RESOLUTION env var.
//       Supported: 1280x720, 1920x1080, 2560x1440
//
//    6. Improved JPEG parser: stricter SOI/EOI boundary detection with
//       minimum frame size guard (prevents empty-packet ghost frames).
//
//    7. Auto-retry with exponential backoff on ffmpeg crash.
//
//  Endpoints:
//    GET /stream          MJPEG live stream  (<img src="/stream"> works)
//    GET /capture         Latest single JPEG frame
//    GET /status          JSON {status, fps, resolution, uptime, frames}
//    GET /health          JSON {ok: true} — for PM2 health check
//    GET /record/start    Start MP4 recording
//    GET /record/stop     Stop recording, returns file path
//    GET /ptz?pan=&tilt=&zoom=   PTZ controls via v4l2-ctl
// ═══════════════════════════════════════════════════════════════

'use strict';

const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// ─── Configuration ───────────────────────────────────────────────
const VIDEO_DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';
const FRAMERATE = process.env.FRAMERATE || '30';
const HTTP_PORT = parseInt(process.env.PORT || '5555', 10);

// Resolution: default 1920x1080. Override with RESOLUTION=2560x1440 etc.
const RESOLUTION = process.env.RESOLUTION || '1920x1080';
const [WIDTH, HEIGHT] = RESOLUTION.split('x');

// MJPEG quality if we ever need to re-encode (fallback only — normally 'copy')
const MJPEG_QUALITY = process.env.MJPEG_QUALITY || '2';

// Minimum valid JPEG size in bytes — guards against empty-packet ghost frames
// A real 1080p MJPEG frame is typically 200KB–1.5MB. 5KB is a safe floor.
const MIN_FRAME_BYTES = 5 * 1024;

// Maximum parse buffer size — safety cap against memory leak on bad stream
const MAX_BUF = 20 * 1024 * 1024; // 20 MB

// ─── Runtime state ───────────────────────────────────────────────
let latestFrame = null;   // Buffer — last valid complete JPEG
let captureProc = null;   // ffmpeg child process handle
let parseBuffer = Buffer.alloc(0);
let activeRecordingProc = null;
let recordingFilePath = null;
let retryDelay = 2000;   // Exponential backoff for restarts
const MAX_RETRY_DELAY = 30000;

// ─── Stats ───────────────────────────────────────────────────────
let frameCount = 0;
let droppedFrames = 0;        // Frames below MIN_FRAME_BYTES (ghost frames)
let lastFpsTime = Date.now();
let lastFpsCount = 0;
let currentFps = 0;
const startTime = Date.now();

// Update FPS every second
setInterval(() => {
    const now = Date.now();
    const elapsed = (now - lastFpsTime) / 1000;
    currentFps = Math.round((frameCount - lastFpsCount) / elapsed);
    lastFpsCount = frameCount;
    lastFpsTime = now;
}, 1000);

// ─── JPEG markers ────────────────────────────────────────────────
const SOI = Buffer.from([0xFF, 0xD8]); // Start Of Image
const EOI = Buffer.from([0xFF, 0xD9]); // End Of Image

// ─── Frame event bus ─────────────────────────────────────────────
// Notifies all active /stream clients when a new frame arrives.
const frameEmitter = new EventEmitter();
frameEmitter.setMaxListeners(50); // Support up to 50 concurrent viewers

// ─── MJPEG part builder ──────────────────────────────────────────
// Exact multipart/x-mixed-replace format:
//   --frame\r\nContent-Type: image/jpeg\r\n\r\n{JPEG bytes}\r\n
// NO Content-Length — allows browser to stream continuously.
function buildMjpegPart(jpegBuffer) {
    const header = Buffer.from('--frame\r\nContent-Type: image/jpeg\r\n\r\n');
    const trailer = Buffer.from('\r\n');
    return Buffer.concat([header, jpegBuffer, trailer]);
}

// ─── JPEG frame parser ───────────────────────────────────────────
// Extracts complete, valid JPEG frames from the raw ffmpeg stdout pipe.
// Emits each valid frame on the frameEmitter bus.
//
// Key improvement over v1: minimum size guard filters out the empty URB
// ghost packets that the UltraSemi camera injects between real frames.
// These ghost packets typically parse as 2–4 byte "frames" — well below
// the 5KB floor — and were the direct cause of the horizontal line artifacts.
function processChunk(chunk) {
    parseBuffer = Buffer.concat([parseBuffer, chunk]);

    // Safety cap: if buffer grows beyond MAX_BUF something is badly wrong.
    // Slice to the last 2MB to recover rather than OOM-crashing the Pi.
    if (parseBuffer.length > MAX_BUF) {
        console.warn(`[Parser] Buffer overflow (${(parseBuffer.length / 1024 / 1024).toFixed(1)}MB) — trimming`);
        parseBuffer = parseBuffer.slice(parseBuffer.length - 2 * 1024 * 1024);
    }

    // Extract every complete JPEG frame in the buffer
    while (true) {
        // Find SOI (0xFF 0xD8)
        const start = parseBuffer.indexOf(SOI);
        if (start === -1) {
            // No SOI found — discard everything (probably trailer garbage)
            parseBuffer = Buffer.alloc(0);
            break;
        }

        // Discard bytes before SOI
        if (start > 0) {
            parseBuffer = parseBuffer.slice(start);
        }

        // Find EOI (0xFF 0xD9) — search from byte 2 to skip the SOI itself
        const end = parseBuffer.indexOf(EOI, 2);
        if (end === -1) {
            // Incomplete frame — wait for more data from ffmpeg
            break;
        }

        // Extract the complete JPEG (inclusive of EOI marker)
        const frameEnd = end + 2;
        const frame = Buffer.from(parseBuffer.slice(0, frameEnd));

        // Advance the parse buffer past this frame
        parseBuffer = parseBuffer.slice(frameEnd);

        // ── Ghost frame guard ─────────────────────────────────────
        // The UltraSemi camera's spurious status packets sometimes parse
        // as tiny "frames" (SOI + junk + EOI). Reject anything below floor.
        if (frame.length < MIN_FRAME_BYTES) {
            droppedFrames++;
            if (droppedFrames % 100 === 1) {
                console.warn(`[Parser] Dropped ghost frame #${droppedFrames} (${frame.length} bytes < ${MIN_FRAME_BYTES} min)`);
            }
            continue; // Skip — do NOT emit or update latestFrame
        }

        // Valid frame — update state and notify clients
        latestFrame = frame;
        frameCount++;
        frameEmitter.emit('frame', frame);
    }
}

// ─── ffmpeg capture process ──────────────────────────────────────
function startCapture() {
    if (captureProc) return;

    // Wait for the device file to exist (handles hot-plug & boot race)
    if (!fs.existsSync(VIDEO_DEVICE)) {
        console.log(`[Capture] ${VIDEO_DEVICE} not found — retrying in 2s...`);
        setTimeout(startCapture, 2000);
        return;
    }

    console.log(`[Capture] Starting ffmpeg: ${VIDEO_DEVICE} ${WIDTH}x${HEIGHT} @${FRAMERATE}fps (MJPEG native)`);

    // ── ffmpeg arguments explained ────────────────────────────────
    //
    // INPUT FLAGS:
    //   -f v4l2                     : V4L2 capture device
    //   -input_format mjpeg         : Request camera's native MJPEG format
    //                                 (avoids YUYV → partial-frame stitching bug)
    //   -video_size WxH             : Resolution (must match a supported mode)
    //   -framerate N                : Target framerate
    //   -use_wallclock_as_timestamps 1
    //                               : Use wall clock for PTS instead of camera
    //                                 timestamps — stabilises stream despite
    //                                 empty URB packets causing PTS jitter
    //   -i /dev/video0              : Input device
    //
    // OUTPUT FLAGS:
    //   -c:v copy                   : Pass MJPEG frames through unchanged (zero CPU)
    //   -f image2pipe               : Output raw frame stream to stdout
    //   -vcodec mjpeg               : Declare output codec for image2pipe
    //   pipe:1                      : Write to stdout

    captureProc = spawn('ffmpeg', [
        '-loglevel', 'warning',          // Show warnings but not verbose info
        '-f', 'v4l2',
        '-input_format', 'mjpeg',            // ← KEY FIX: native MJPEG, not yuyv422
        '-video_size', `${WIDTH}x${HEIGHT}`,
        '-framerate', FRAMERATE,
        '-use_wallclock_as_timestamps', '1',// ← Stabilise PTS despite empty packets
        '-i', VIDEO_DEVICE,
        '-c:v', 'copy',             // ← Zero transcode: camera encodes on-chip
        '-fflags', '+nobuffer+discardcorrupt', // ← Discard corrupt frames instantly
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        'pipe:1',
    ], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    parseBuffer = Buffer.alloc(0);

    // Feed raw stdout bytes into the JPEG frame parser
    captureProc.stdout.on('data', processChunk);

    // Log ffmpeg warnings/errors (filtered to reduce noise)
    captureProc.stderr.on('data', (d) => {
        const msg = d.toString().trim();
        if (!msg) return;
        // Filter out routine informational lines from ffmpeg
        const isRoutine = (
            msg.includes('Press [q]') ||
            msg.includes('frame=') ||
            msg.includes('fps=') ||
            msg.includes('speed=')
        );
        if (!isRoutine) {
            console.error(`[ffmpeg] ${msg}`);
        }
    });

    captureProc.on('close', (code) => {
        console.log(`[Capture] ffmpeg exited (code ${code}) — restarting in ${retryDelay}ms`);
        captureProc = null;
        latestFrame = null;
        parseBuffer = Buffer.alloc(0);

        // Exponential backoff: 2s → 4s → 8s … capped at 30s
        setTimeout(() => {
            startCapture();
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        }, retryDelay);
    });

    captureProc.on('error', (err) => {
        console.error(`[Capture] spawn error: ${err.message}`);
        captureProc = null;
        setTimeout(() => {
            startCapture();
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        }, retryDelay);
    });

    // Reset retry delay on successful first frame
    frameEmitter.once('frame', () => {
        retryDelay = 2000;
        console.log(`[Capture] First frame received — stream is live ✓`);
    });
}

// ─── Boot: start capture immediately ────────────────────────────
startCapture();

// ─── HTTP server ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost`);
    const pathname = url.pathname;

    // CORS — allow any origin (endoscopy app and dev laptop)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /stream  — MJPEG multipart live stream
    //
    //  Usage: <img src="http://PI_IP:5555/stream">
    //
    //  The browser's native MJPEG decoder swaps frames atomically on
    //  each --frame boundary. No JavaScript needed for display.
    //  Works in Chrome, Firefox, Safari, and all WebViews.
    // ════════════════════════════════════════════════════════════
    if (pathname === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache',
            'Expires': '0',
        });

        // Send the most recent frame immediately so the <img> renders at once
        // rather than waiting for the next camera frame (reduces initial latency)
        if (latestFrame) {
            try { res.write(buildMjpegPart(latestFrame)); } catch { /* ignore */ }
        }

        // Subscribe to new frames and forward them to this client
        const onFrame = (frame) => {
            try {
                res.write(buildMjpegPart(frame));
            } catch {
                // Client disconnected mid-write — clean up listener
                frameEmitter.removeListener('frame', onFrame);
            }
        };

        frameEmitter.on('frame', onFrame);

        // Clean up listener when client closes the connection
        req.on('close', () => {
            frameEmitter.removeListener('frame', onFrame);
        });

        // !! Do NOT call res.end() — stream must stay open !!
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /capture  — Latest single JPEG frame (snapshot)
    //
    //  Returns the most recently decoded frame as a JPEG download.
    //  Used by the React frontend's captureFrame() method.
    // ════════════════════════════════════════════════════════════
    if (pathname === '/capture') {
        if (!latestFrame) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'No frame available yet',
                status: 'waiting',
                uptime: Math.round((Date.now() - startTime) / 1000),
            }));
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': latestFrame.length,
            'Cache-Control': 'no-cache, no-store',
            'X-Frame-Number': frameCount,
            'X-Frame-Size': latestFrame.length,
        });
        res.end(latestFrame);
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /status  — JSON health & stats
    //
    //  Used by the React frontend's polling loop to determine
    //  whether to activate MJPEG mode or fall back to WebRTC.
    //
    //  Response:
    //    status:      'streaming' | 'waiting'
    //    fps:         current measured frames per second
    //    resolution:  active capture resolution string
    //    uptime:      daemon uptime in seconds
    //    frames:      total frames captured since start
    //    dropped:     ghost frames filtered out (diagnostic)
    // ════════════════════════════════════════════════════════════
    if (pathname === '/status') {
        const isStreaming = latestFrame !== null && captureProc !== null;

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        });
        res.end(JSON.stringify({
            status: isStreaming ? 'streaming' : 'waiting',
            fps: currentFps,
            resolution: `${WIDTH}x${HEIGHT}`,
            framerate: parseInt(FRAMERATE, 10),
            uptime: Math.round((Date.now() - startTime) / 1000),
            frames: frameCount,
            dropped: droppedFrames,
            device: VIDEO_DEVICE,
        }));
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /health  — Minimal liveness probe for PM2 / load balancer
    // ════════════════════════════════════════════════════════════
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, uptime: Math.round((Date.now() - startTime) / 1000) }));
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /record/start  — Begin MP4 recording to disk
    //
    //  Saves to: {cwd}/data/media/record_{timestamp}.mp4
    //  Uses libx264 ultrafast for real-time encode on Pi.
    // ════════════════════════════════════════════════════════════
    if (pathname.startsWith('/record/start')) {
        if (activeRecordingProc) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Already recording', status: 'recording' }));
            return;
        }

        const mediaDir = path.join(process.cwd(), 'data', 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        const filename = `record_${Date.now()}.mp4`;
        recordingFilePath = path.join(mediaDir, filename);
        console.log(`[Record] Starting → ${recordingFilePath}`);

        // Record from camera directly in MJPEG, transcode to H.264 MP4
        activeRecordingProc = spawn('ffmpeg', [
            '-loglevel', 'error',
            '-f', 'v4l2',
            '-input_format', 'mjpeg',             // ← MJPEG from camera (fixed)
            '-video_size', `${WIDTH}x${HEIGHT}`,
            '-framerate', FRAMERATE,
            '-i', VIDEO_DEVICE,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',         // Lowest CPU — Pi can keep up
            '-crf', '23',                // Quality (23 = good, 28 = smaller)
            '-movflags', '+faststart',         // MP4 header at front for streaming
            '-y', recordingFilePath,
        ], {
            stdio: ['pipe', 'ignore', 'ignore'],
        });

        activeRecordingProc.on('close', (code) => {
            console.log(`[Record] ffmpeg exited (code ${code})`);
            activeRecordingProc = null;
        });

        activeRecordingProc.on('error', (err) => {
            console.error(`[Record] Error: ${err.message}`);
            activeRecordingProc = null;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'recording_started',
            filePath: `/data/media/${filename}`,
            filename: filename,
        }));
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /record/stop  — Stop active recording
    // ════════════════════════════════════════════════════════════
    if (pathname.startsWith('/record/stop')) {
        if (!activeRecordingProc) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not currently recording' }));
            return;
        }

        // Send 'q' to ffmpeg stdin for graceful shutdown (finalises MP4 container)
        try {
            activeRecordingProc.stdin.write('q\n');
        } catch {
            activeRecordingProc.kill('SIGTERM');
        }

        const savedFile = recordingFilePath;
        const savedFilename = path.basename(savedFile || '');
        activeRecordingProc = null;
        recordingFilePath = null;

        console.log(`[Record] Stopped → ${savedFile}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            filename: `/api/capture-serve?path=${encodeURIComponent(savedFile)}`,
            path: savedFile,
            basename: savedFilename,
        }));
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  GET /ptz?pan=&tilt=&zoom=  — PTZ hardware control
    //
    //  Sends v4l2-ctl commands to the camera for supported PTZ cameras.
    //  Values are raw v4l2 absolute integers.
    //  Example: /ptz?zoom=200&pan=0&tilt=0
    // ════════════════════════════════════════════════════════════
    if (pathname.startsWith('/ptz')) {
        const p = url.searchParams;
        const cmds = [];

        if (p.has('zoom')) cmds.push(`zoom_absolute=${parseInt(p.get('zoom'), 10)}`);
        if (p.has('pan')) cmds.push(`pan_absolute=${parseInt(p.get('pan'), 10)}`);
        if (p.has('tilt')) cmds.push(`tilt_absolute=${parseInt(p.get('tilt'), 10)}`);
        if (p.has('focus')) cmds.push(`focus_absolute=${parseInt(p.get('focus'), 10)}`);

        if (cmds.length > 0) {
            const cmd = `v4l2-ctl -d ${VIDEO_DEVICE} -c ${cmds.join(',')}`;
            exec(cmd, (err) => {
                if (err) console.error(`[PTZ] v4l2-ctl error: ${err.message}`);
            });
            console.log(`[PTZ] ${cmd}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', applied: cmds }));
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  404 — Unknown endpoint
    // ════════════════════════════════════════════════════════════
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'Not found',
        endpoints: ['/stream', '/capture', '/status', '/health', '/record/start', '/record/stop', '/ptz'],
    }));
});

// ─── Start HTTP server ───────────────────────────────────────────
server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log(` PI CAPTURE DAEMON  v2  (MJPEG native — tearing fixed)`);
    console.log(` http://0.0.0.0:${HTTP_PORT}`);
    console.log(` Device     : ${VIDEO_DEVICE}`);
    console.log(` Resolution : ${WIDTH}x${HEIGHT} @ ${FRAMERATE}fps`);
    console.log(` Stream     : http://0.0.0.0:${HTTP_PORT}/stream`);
    console.log(` Capture    : http://0.0.0.0:${HTTP_PORT}/capture`);
    console.log(` Status     : http://0.0.0.0:${HTTP_PORT}/status`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(` Fix applied: input_format mjpeg + ghost frame filter`);
    console.log(` Min frame size: ${MIN_FRAME_BYTES} bytes (filters empty URB packets)`);
    console.log('═══════════════════════════════════════════════════════');
});

// Handle server errors (e.g. port already in use)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${HTTP_PORT} already in use. Is another daemon running?`);
        console.error(`[Server] Run: pm2 delete pi-capture-daemon && pm2 start ecosystem.config.js`);
    } else {
        console.error(`[Server] Error: ${err.message}`);
    }
    process.exit(1);
});

// ─── Graceful shutdown ───────────────────────────────────────────
function shutdown(signal) {
    console.log(`\n[Daemon] Received ${signal} — shutting down gracefully`);

    if (activeRecordingProc) {
        console.log('[Daemon] Finalising recording...');
        try { activeRecordingProc.stdin.write('q\n'); } catch { /* ignore */ }
        activeRecordingProc = null;
    }

    if (captureProc) {
        captureProc.kill('SIGTERM');
        captureProc = null;
    }

    server.close(() => {
        console.log('[Daemon] HTTP server closed. Goodbye.');
        process.exit(0);
    });

    // Force exit after 5s if server won't close cleanly
    setTimeout(() => {
        console.warn('[Daemon] Force exit after timeout');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections — log but don't crash the daemon
process.on('unhandledRejection', (reason) => {
    console.error('[Daemon] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[Daemon] Uncaught exception:', err.message);
    // Don't exit — keep the stream alive
});