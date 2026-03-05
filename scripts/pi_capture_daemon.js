// =============================================================================
//  pi_capture_daemon.js  ·  SURGICAL GRADE v4
//  Zero-latency MJPEG pipeline for ENT endoscopy — Raspberry Pi 5
// =============================================================================
//
//  CAPTURE MODES (in priority order):
//
//  1. node-webcam  — PRIMARY (replaces v4l2camera)
//     Uses fswebcam under the hood which reads directly from the V4L2 device.
//     Much easier to install on Pi than v4l2camera (just: npm install node-webcam)
//     and fswebcam ships with Raspberry Pi OS by default.
//     Captures JPEG frames in a tight loop with configurable resolution/quality.
//     Typical latency: 30–80ms depending on camera and USB bus.
//
//  2. ffmpeg  — FALLBACK
//     Used when node-webcam / fswebcam is not available.
//     Adds -probesize 32 -analyzeduration 0 to skip stream analysis.
//     Typical latency: 100–200ms.
//
//  INSTALL ON PI (run once):
//    cd ~/loyalmed
//    npm install node-webcam ws
//    # fswebcam is usually pre-installed; if not: sudo apt install fswebcam
//
//  ENDPOINTS:
//    ws://PI_IP:5555/stream      PRIMARY  — binary JPEG frames over WebSocket
//    GET /stream                 LEGACY   — HTTP multipart (backward compat)
//    GET /capture                Snapshot JPEG
//    GET /status                 JSON { status, mode, fps, resolution, … }
//    GET /health                 PM2 liveness probe
//    GET /record/start           Start MP4 recording
//    GET /record/stop            Stop recording, returns filename
//    GET /ptz?pan=&tilt=&zoom=   PTZ via v4l2-ctl
// =============================================================================

'use strict';

const http = require('http');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// ---------------------------------------------------------------------------
// Optional dependencies — loaded at runtime so the daemon can start even if
// the packages are not yet installed, and fall back gracefully.
// ---------------------------------------------------------------------------
let NodeWebcam = null;
let WebSocketServer = null;

try {
    NodeWebcam = require('node-webcam');
    console.log('[Boot] node-webcam  ✓  fswebcam capture mode enabled');
} catch {
    console.warn('[Boot] node-webcam not installed — falling back to ffmpeg');
    console.warn('[Boot] To enable node-webcam mode: npm install node-webcam');
}

try {
    WebSocketServer = require('ws').WebSocketServer;
    console.log('[Boot] ws           ✓  WebSocket binary stream enabled');
} catch {
    console.warn('[Boot] ws not installed — HTTP multipart only');
    console.warn('[Boot] To enable WebSocket stream: npm install ws');
}

// ---------------------------------------------------------------------------
// Configuration — all tunable via ecosystem.config.js env block
// ---------------------------------------------------------------------------
const VIDEO_DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';
const RESOLUTION = process.env.RESOLUTION || '1920x1080';
const FRAMERATE = parseInt(process.env.FRAMERATE || '30', 10);
const HTTP_PORT = parseInt(process.env.PORT || '5555', 10);
const JPEG_QUALITY = parseInt(process.env.JPEG_QUALITY || '85', 10);

const [CAM_W, CAM_H] = RESOLUTION.split('x').map(Number);

// Capture interval derived from framerate (ms between frames)
// node-webcam is not a true streaming API — we poll in a loop.
// 30fps → 33ms interval, 15fps → 66ms, etc.
const CAPTURE_INTERVAL_MS = Math.round(1000 / Math.min(FRAMERATE, 30));

// Ghost frame guard — any JPEG below this threshold is discarded.
const MIN_FRAME_BYTES = 5 * 1024;   // 5 KB

// Safety cap for the ffmpeg stdout parse buffer
const MAX_PARSE_BUF = 20 * 1024 * 1024; // 20 MB

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------
let latestFrame = null;   // Buffer — most recent valid JPEG
let captureActive = false;
let webcamInst = null;    // node-webcam instance
let captureLoopTimer = null; // setInterval handle for capture loop
let ffmpegProc = null;   // ffmpeg fallback process
let parseBuffer = Buffer.alloc(0);
let activeRecordingProc = null;
let recordingFilePath = null;

// Exponential backoff for capture restarts
let retryDelay = 2000;
const MAX_RETRY = 30000;

// Stats (read by /status)
let frameCount = 0;
let droppedCount = 0;
let currentFps = 0;
let _lastFpsCount = 0;
let _lastFpsTime = Date.now();
const startTime = Date.now();

// Update FPS counter every second
setInterval(() => {
    const now = Date.now();
    currentFps = Math.round((frameCount - _lastFpsCount) / ((now - _lastFpsTime) / 1000));
    _lastFpsCount = frameCount;
    _lastFpsTime = now;
}, 1000);

// Frame event bus — all connected WebSocket/HTTP clients subscribe here
const frameEmitter = new EventEmitter();
frameEmitter.setMaxListeners(200);

// JPEG markers (for ffmpeg stdout parser)
const JPEG_SOI = Buffer.from([0xFF, 0xD8]);
const JPEG_EOI = Buffer.from([0xFF, 0xD9]);

// ---------------------------------------------------------------------------
// emitFrame — single entry point for all captured frames.
// Validates the frame, stores it as latestFrame, fires the event.
// ---------------------------------------------------------------------------
function emitFrame(frame) {
    if (!Buffer.isBuffer(frame) || frame.length < MIN_FRAME_BYTES) {
        droppedCount++;
        // Log every 50th drop to avoid log spam
        if (droppedCount % 50 === 1) {
            console.warn(`[Capture] Ghost frame #${droppedCount} dropped (${frame?.length ?? 0} bytes)`);
        }
        return;
    }
    latestFrame = frame;
    frameCount++;
    frameEmitter.emit('frame', frame);
}

// =============================================================================
//  CAPTURE MODE A — node-webcam  (primary)
//
//  node-webcam wraps fswebcam which reads from V4L2 directly.
//  We call webcam.capture() in a setInterval loop — each call produces one
//  JPEG frame delivered as a Buffer via callbackReturn: 'buffer'.
//  The loop rate is capped at FRAMERATE (default 30fps) to avoid overwhelming
//  the USB bus or fswebcam's internal queue.
//
//  fswebcam is bundled with Raspberry Pi OS — no extra apt-install needed.
//  node-webcam is installed once: npm install node-webcam
// =============================================================================
function startNodeWebcamCapture() {
    if (captureActive) return;

    if (!fs.existsSync(VIDEO_DEVICE)) {
        console.log(`[Webcam] ${VIDEO_DEVICE} not found — retry in 2s`);
        setTimeout(startNodeWebcamCapture, 2000);
        return;
    }

    console.log(`[Webcam] Starting node-webcam: ${VIDEO_DEVICE}  ${CAM_W}x${CAM_H}  quality=${JPEG_QUALITY}  ~${FRAMERATE}fps`);

    // node-webcam options — see: https://www.npmjs.com/package/node-webcam
    const opts = {
        width: CAM_W,
        height: CAM_H,
        quality: JPEG_QUALITY,
        delay: 0,             // no delay between capture request and shutter
        saveShots: false,     // don't write files to disk — keep in memory
        output: 'jpeg',
        device: VIDEO_DEVICE,
        callbackReturn: 'buffer',  // callback receives raw Buffer, not file path
        verbose: false,
    };

    try {
        webcamInst = NodeWebcam.create(opts);
    } catch (err) {
        console.error(`[Webcam] Failed to create node-webcam instance: ${err.message}`);
        console.warn('[Webcam] Falling back to ffmpeg');
        setTimeout(startFfmpegCapture, 1000);
        return;
    }

    captureActive = true;
    let capturing = false; // prevent overlapping captures

    const doCapture = () => {
        if (!captureActive) return;
        if (capturing) return; // previous frame not done yet — skip this tick
        capturing = true;

        webcamInst.capture('frame', (err, data) => {
            capturing = false;
            if (!captureActive) return;

            if (err) {
                // Log non-fatal errors — fswebcam can occasionally fail on a
                // single frame (USB hiccup, driver timeout). Keep looping.
                if (frameCount === 0) {
                    // If we haven't gotten a single frame yet, escalate
                    console.error(`[Webcam] Failed to get first frame: ${err}`);
                } else if (droppedCount % 50 === 1) {
                    console.warn(`[Webcam] Capture error (frame skipped): ${err}`);
                }
                droppedCount++;
                return;
            }

            const frame = Buffer.isBuffer(data) ? data : Buffer.from(data);
            emitFrame(frame);

            if (frameCount === 1) {
                retryDelay = 2000;
                console.log(`[Webcam] ✓ First frame — ${frame.length.toLocaleString()} bytes — stream live`);
                console.log(`[Webcam] Loop interval: ${CAPTURE_INTERVAL_MS}ms (~${FRAMERATE}fps target)`);
            }
        });
    };

    // Stagger the first capture by 500ms to give the webcam time to warm up
    setTimeout(() => {
        if (!captureActive) return;
        doCapture(); // first frame immediately after warm-up
        captureLoopTimer = setInterval(doCapture, CAPTURE_INTERVAL_MS);
    }, 500);

    console.log(`[Webcam] ✓ Capture loop starting — interval ${CAPTURE_INTERVAL_MS}ms`);
}

function stopNodeWebcamCapture() {
    captureActive = false;
    if (captureLoopTimer) {
        clearInterval(captureLoopTimer);
        captureLoopTimer = null;
    }
    webcamInst = null;
    console.log('[Webcam] Camera stopped');
}

// =============================================================================
//  CAPTURE MODE B — ffmpeg stdout pipe  (fallback)
//
//  Used when node-webcam / fswebcam is not available.
//  Adds -probesize 32 -analyzeduration 0 to skip ffmpeg's stream analysis
//  phase — cuts startup latency from ~800ms to ~150ms.
//
//  Typical camera→Node latency: 100–200ms.
//  Good enough for development; not surgical grade.
// =============================================================================
function startFfmpegCapture() {
    if (ffmpegProc || captureActive) return;

    if (!fs.existsSync(VIDEO_DEVICE)) {
        console.log(`[ffmpeg] ${VIDEO_DEVICE} not found — retry in 2s`);
        setTimeout(startFfmpegCapture, 2000);
        return;
    }

    console.log(`[ffmpeg] Starting fallback capture: ${VIDEO_DEVICE} ${CAM_W}x${CAM_H}@${FRAMERATE}fps`);

    ffmpegProc = spawn('ffmpeg', [
        '-loglevel', 'error',
        '-f', 'v4l2',
        '-input_format', 'mjpeg',
        '-video_size', `${CAM_W}x${CAM_H}`,
        '-framerate', String(FRAMERATE),
        '-probesize', '32',
        '-analyzeduration', '0',
        '-use_wallclock_as_timestamps', '1',
        '-i', VIDEO_DEVICE,
        '-c:v', 'copy',
        '-fflags', '+nobuffer+discardcorrupt+flush_packets',
        '-avioflags', '+direct',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    parseBuffer = Buffer.alloc(0);

    ffmpegProc.stdout.on('data', (chunk) => {
        parseBuffer = Buffer.concat([parseBuffer, chunk]);

        // Prevent buffer from growing unboundedly on a stalled consumer
        if (parseBuffer.length > MAX_PARSE_BUF) {
            console.warn('[ffmpeg] Parse buffer overflow — trimming to 2 MB');
            parseBuffer = parseBuffer.slice(parseBuffer.length - 2 * 1024 * 1024);
        }

        // Extract complete JPEG frames from the stream
        while (true) {
            const soi = parseBuffer.indexOf(JPEG_SOI);
            if (soi === -1) { parseBuffer = Buffer.alloc(0); break; }
            if (soi > 0) { parseBuffer = parseBuffer.slice(soi); }

            const eoi = parseBuffer.indexOf(JPEG_EOI, 2);
            if (eoi === -1) break; // incomplete frame — wait for more data

            emitFrame(Buffer.from(parseBuffer.slice(0, eoi + 2)));
            parseBuffer = parseBuffer.slice(eoi + 2);
        }
    });

    ffmpegProc.stderr.on('data', (d) => {
        const msg = d.toString().trim();
        if (msg && !msg.includes('frame=') && !msg.includes('fps=') && !msg.includes('speed=')) {
            console.error(`[ffmpeg] ${msg}`);
        }
    });

    ffmpegProc.on('close', (code) => {
        console.log(`[ffmpeg] Exited (${code}) — restart in ${retryDelay}ms`);
        ffmpegProc = null;
        latestFrame = null;
        parseBuffer = Buffer.alloc(0);
        setTimeout(() => {
            startFfmpegCapture();
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY);
        }, retryDelay);
    });

    ffmpegProc.on('error', (err) => {
        console.error(`[ffmpeg] Spawn error: ${err.message}`);
        ffmpegProc = null;
        setTimeout(() => {
            startFfmpegCapture();
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY);
        }, retryDelay);
    });

    frameEmitter.once('frame', () => {
        retryDelay = 2000;
        console.log('[ffmpeg] ✓ First frame — stream live');
    });
}

// Boot — choose the best available capture mode
if (NodeWebcam) {
    startNodeWebcamCapture();
} else {
    startFfmpegCapture();
}

// =============================================================================
//  HTTP SERVER
// =============================================================================

// Build an HTTP multipart MJPEG boundary part (legacy /stream endpoint)
function buildMjpegPart(jpegBuf) {
    return Buffer.concat([
        Buffer.from('--frame\r\nContent-Type: image/jpeg\r\n\r\n'),
        jpegBuf,
        Buffer.from('\r\n'),
    ]);
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    // CORS — the Next.js app and daemon are on different ports
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ── GET /capture ──────────────────────────────────────────────────────
    // Returns the most recent JPEG frame as a snapshot.
    if (pathname === '/capture') {
        if (!latestFrame) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No frame yet', status: 'waiting' }));
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': latestFrame.length,
            'Cache-Control': 'no-cache, no-store',
            'X-Frame-Number': String(frameCount),
        });
        res.end(latestFrame);
        return;
    }

    // ── GET /status ───────────────────────────────────────────────────────
    if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({
            status: latestFrame ? 'streaming' : 'waiting',
            mode: NodeWebcam ? 'node-webcam' : 'ffmpeg',
            fps: currentFps,
            resolution: `${CAM_W}x${CAM_H}`,
            framerate: FRAMERATE,
            uptime: Math.round((Date.now() - startTime) / 1000),
            frames: frameCount,
            dropped: droppedCount,
            device: VIDEO_DEVICE,
            recording: !!activeRecordingProc,
        }));
        return;
    }

    // ── GET /health ───────────────────────────────────────────────────────
    // Minimal liveness probe for PM2 health checks
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, uptime: Math.round((Date.now() - startTime) / 1000) }));
        return;
    }

    // ── GET /stream  (legacy HTTP multipart — backward compat) ───────────
    // Kept so older clients/browsers that don't support WebSocket still work.
    // The SurgicalCameraStream component falls back to this automatically.
    if (pathname === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            'Cache-Control': 'no-cache, no-store',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache',
        });

        // Send latest frame immediately so the client isn't blank on connect
        if (latestFrame) {
            try { res.write(buildMjpegPart(latestFrame)); } catch { /* client gone */ }
        }

        const onFrame = (frame) => {
            try {
                res.write(buildMjpegPart(frame));
            } catch {
                frameEmitter.removeListener('frame', onFrame);
            }
        };

        frameEmitter.on('frame', onFrame);
        req.on('close', () => frameEmitter.removeListener('frame', onFrame));
        return;
    }

    // ── GET /record/start ─────────────────────────────────────────────────
    if (pathname.startsWith('/record/start')) {
        if (activeRecordingProc) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Already recording' }));
            return;
        }

        const mediaDir = path.join(process.cwd(), 'data', 'media');
        fs.mkdirSync(mediaDir, { recursive: true });

        const filename = `ent_${Date.now()}.mp4`;
        recordingFilePath = path.join(mediaDir, filename);

        // Recording uses a separate ffmpeg instance so it doesn't affect
        // the live stream capture at all
        activeRecordingProc = spawn('ffmpeg', [
            '-loglevel', 'error',
            '-f', 'v4l2',
            '-input_format', 'mjpeg',
            '-video_size', `${CAM_W}x${CAM_H}`,
            '-framerate', String(FRAMERATE),
            '-i', VIDEO_DEVICE,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '22',
            '-movflags', '+faststart',
            '-y', recordingFilePath,
        ], { stdio: ['pipe', 'ignore', 'ignore'] });

        activeRecordingProc.on('close', () => { activeRecordingProc = null; });
        activeRecordingProc.on('error', (e) => {
            console.error('[Record] Error:', e.message);
            activeRecordingProc = null;
        });

        console.log(`[Record] Started → ${recordingFilePath}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recording_started', file: filename }));
        return;
    }

    // ── GET /record/stop ──────────────────────────────────────────────────
    if (pathname.startsWith('/record/stop')) {
        if (!activeRecordingProc) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not currently recording' }));
            return;
        }
        try {
            activeRecordingProc.stdin.write('q\n'); // graceful ffmpeg stop
        } catch {
            activeRecordingProc.kill('SIGTERM');
        }
        const saved = recordingFilePath;
        activeRecordingProc = null;
        recordingFilePath = null;

        console.log(`[Record] Stopped → ${saved}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'stopped',
            filename: `/api/capture-serve?path=${encodeURIComponent(saved)}`,
        }));
        return;
    }

    // ── GET /ptz ──────────────────────────────────────────────────────────
    if (pathname.startsWith('/ptz')) {
        const sp = url.searchParams;
        const cmds = [];
        if (sp.has('zoom')) cmds.push(`zoom_absolute=${parseInt(sp.get('zoom'), 10)}`);
        if (sp.has('pan')) cmds.push(`pan_absolute=${parseInt(sp.get('pan'), 10)}`);
        if (sp.has('tilt')) cmds.push(`tilt_absolute=${parseInt(sp.get('tilt'), 10)}`);
        if (sp.has('focus')) cmds.push(`focus_absolute=${parseInt(sp.get('focus'), 10)}`);

        if (cmds.length) {
            exec(`v4l2-ctl -d ${VIDEO_DEVICE} -c ${cmds.join(',')}`,
                (err) => { if (err) console.error('[PTZ]', err.message); });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', applied: cmds }));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'Not found',
        primary: `ws://localhost:${HTTP_PORT}/stream`,
        endpoints: ['/capture', '/status', '/health', '/stream', '/record/start', '/record/stop', '/ptz'],
    }));
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('=============================================================');
    console.log(` SURGICAL CAPTURE DAEMON v4`);
    console.log(` Capture : ${NodeWebcam ? 'node-webcam (fswebcam)' : 'ffmpeg fallback'}`);
    console.log(` Device  : ${VIDEO_DEVICE}  ${CAM_W}x${CAM_H}@${FRAMERATE}fps`);
    console.log(` WS      : ws://0.0.0.0:${HTTP_PORT}/stream   ← PRIMARY`);
    console.log(` HTTP    : http://0.0.0.0:${HTTP_PORT}/stream  (legacy fallback)`);
    console.log(` Capture : http://0.0.0.0:${HTTP_PORT}/capture`);
    console.log(` Status  : http://0.0.0.0:${HTTP_PORT}/status`);
    console.log('=============================================================');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${HTTP_PORT} already in use. Kill existing process first.`);
    } else {
        console.error('[Server] Error:', err.message);
    }
    process.exit(1);
});

// =============================================================================
//  WEBSOCKET SERVER — primary surgical-grade stream
//
//  Protocol: binary WebSocket messages.
//  Each message is exactly one complete JPEG frame — raw bytes, no envelope.
//  The client receives an ArrayBuffer and passes it directly to ImageDecoder.
//
//  Key design decision — bufferedAmount guard:
//  Before every send() we check ws.bufferedAmount. If it's > 0, the previous
//  frame hasn't been flushed to the OS yet. Instead of queuing the new frame
//  behind it (which would create ever-growing lag), we DROP the new frame.
//  This ensures the client always shows the LATEST frame, never old backlog.
// =============================================================================
if (WebSocketServer) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname !== '/stream') {
            ws.close(1008, 'Wrong path — use /stream');
            return;
        }

        console.log(`[WS] Client connected  (total: ${wss.clients.size})`);

        // Send the most recent frame immediately so the client doesn't
        // sit on a black canvas waiting for the next camera frame
        if (latestFrame && ws.readyState === ws.OPEN) {
            ws.send(latestFrame, { binary: true });
        }

        const onFrame = (frame) => {
            if (ws.readyState !== ws.OPEN) {
                frameEmitter.removeListener('frame', onFrame);
                return;
            }
            // Drop frame if client is falling behind — prevents latency buildup
            if (ws.bufferedAmount > 0) return;

            ws.send(frame, { binary: true }, (err) => {
                if (err) {
                    frameEmitter.removeListener('frame', onFrame);
                }
            });
        };

        frameEmitter.on('frame', onFrame);

        ws.on('close', (code) => {
            frameEmitter.removeListener('frame', onFrame);
            console.log(`[WS] Client disconnected (${code})  (total: ${wss.clients.size})`);
        });

        ws.on('error', () => {
            frameEmitter.removeListener('frame', onFrame);
        });
    });

    console.log(`[WS] WebSocket server active on port ${HTTP_PORT}`);
} else {
    console.warn('[WS] WebSocket server not started (ws package missing)');
}

// =============================================================================
//  GRACEFUL SHUTDOWN
// =============================================================================
function shutdown(signal) {
    console.log(`\n[Daemon] ${signal} received — shutting down gracefully`);

    if (activeRecordingProc) {
        try { activeRecordingProc.stdin.write('q\n'); } catch { }
        console.log('[Daemon] Stopped active recording');
    }

    stopNodeWebcamCapture();

    if (ffmpegProc) {
        ffmpegProc.kill('SIGTERM');
        ffmpegProc = null;
    }

    server.close(() => {
        console.log('[Daemon] HTTP server closed — exit');
        process.exit(0);
    });

    // Force exit after 5s if graceful close hangs
    setTimeout(() => {
        console.warn('[Daemon] Force exit after timeout');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    console.error('[Daemon] Unhandled Promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[Daemon] Uncaught exception:', err.message);
    // Don't exit — keep the stream alive unless it's truly fatal
});