const net = require('net');
const http = require('http');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let latestFrame = null;
let currentBuffer = Buffer.alloc(0);

// Connect to GStreamer TCP Server (tcpserversink port 5000)
const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB safety cap

function connectToGStreamer() {
    console.log('Attempting to connect to GStreamer on port 5000...');
    const client = new net.Socket();

    client.connect(5000, '127.0.0.1', () => {
        console.log('Connected to GStreamer zero-latency tcp branch!');
        currentBuffer = Buffer.alloc(0); // Reset buffer on reconnect
    });

    client.on('data', (data) => {
        currentBuffer = Buffer.concat([currentBuffer, data]);

        // Safety: cap buffer to prevent memory leak if frames aren't being extracted
        if (currentBuffer.length > MAX_BUFFER_SIZE) {
            // Keep only the last 2MB to preserve any partial frame
            currentBuffer = currentBuffer.subarray(currentBuffer.length - 2 * 1024 * 1024);
        }

        // Extract all complete JPEG frames, keep only the latest
        while (true) {
            const startIdx = currentBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
            if (startIdx === -1) {
                // No JPEG start found — discard everything
                currentBuffer = Buffer.alloc(0);
                break;
            }

            // Discard any garbage before the JPEG start
            if (startIdx > 0) {
                currentBuffer = currentBuffer.subarray(startIdx);
            }

            // Look for end marker AFTER the start (skip the first 2 bytes of SOI)
            const endIdx = currentBuffer.indexOf(Buffer.from([0xFF, 0xD9]), 2);
            if (endIdx === -1) {
                // Incomplete frame — wait for more data
                break;
            }

            // Complete frame found
            latestFrame = currentBuffer.subarray(0, endIdx + 2);
            currentBuffer = currentBuffer.subarray(endIdx + 2);
            // Loop to extract any additional complete frames (keep only latest)
        }
    });

    client.on('close', () => {
        console.log('GStreamer connection closed. Retrying in 2 seconds...');
        setTimeout(connectToGStreamer, 2000);
    });

    client.on('error', (err) => {
        // Suppress connection refused errors if GStreamer is down
        if (err.code !== 'ECONNREFUSED') {
            console.error('Socket error:', err.message);
        }
    });
}

// Start watching the GStreamer pipeline
connectToGStreamer();

// ---------------------------------------------------------
// HTTP API Server (port 5555) for Next.js UI
// ---------------------------------------------------------
const server = http.createServer((req, res) => {
    // Enable CORS for the local Next.js frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/capture' && req.method === 'GET') {
        if (latestFrame) {
            // Instantly serve the JPEG buffer out of RAM (Zero Latency)
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': latestFrame.length
            });
            res.end(latestFrame);
        } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No frame available yet. Is GStreamer running?' }));
        }
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: latestFrame ? 'streaming' : 'waiting' }));
    } else if (req.url.startsWith('/record/start')) {
        if (activeRecordingProcess) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Already recording' }));
            return;
        }

        // Ensure data/media directory exists
        const mediaDir = path.join(process.cwd(), 'data', 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        const filename = `record_${Date.now()}.mp4`;
        recordingFilePath = path.join(mediaDir, filename);

        console.log(`Starting recording to ${recordingFilePath}...`);

        // We use ffmpeg to read the MJPEG stream (port 5000), decode it, and encode to mp4.
        // Reading from port 5000 is safe and won't affect kmssink display due to 'sync=false' and 'leaky' queues in GStreamer.
        // It's crucial we capture the stream without introducing backpressure, so we consume as fast as possible.
        activeRecordingProcess = spawn('ffmpeg', [
            '-f', 'mjpeg',
            '-i', 'tcp://127.0.0.1:5000',
            '-c:v', 'libx264',
            '-preset', 'ultrafast', // Crucial: minimize CPU overhead
            '-crf', '28',           // Reasonable quality/size tradeoff
            '-y',                   // Overwrite output file
            recordingFilePath
        ]);

        activeRecordingProcess.stderr.on('data', (data) => {
            // Uncomment for debugging ffmpeg encoding
            // console.log(`ffmpeg: ${data}`);
        });

        activeRecordingProcess.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
            activeRecordingProcess = null;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recording_started', filePath: `/data/media/${filename}` }));

    } else if (req.url.startsWith('/record/stop')) {
        if (!activeRecordingProcess) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not recording' }));
            return;
        }

        console.log('Stopping recording...');
        // Send graceful quit command to ffmpeg
        activeRecordingProcess.stdin.write('q\n');

        // Return the recorded file path mapped to the relative Next.js accessible path structure
        // /api/capture-serve?path=/data/media/record_123.mp4
        const savedUrl = `/api/capture-serve?path=${encodeURIComponent(recordingFilePath)}`;

        activeRecordingProcess = null;
        recordingFilePath = null;


        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', filename: savedUrl }));

    } else if (req.url.startsWith('/ptz')) {
        // e.g. /ptz?pan=100&tilt=-50&zoom=200
        const urlParams = new URLSearchParams(req.url.split('?')[1] || "");
        let commands = [];

        if (urlParams.has('zoom')) commands.push(`zoom_absolute=${urlParams.get('zoom')}`);
        if (urlParams.has('pan')) commands.push(`pan_absolute=${urlParams.get('pan')}`);
        if (urlParams.has('tilt')) commands.push(`tilt_absolute=${urlParams.get('tilt')}`);

        if (commands.length > 0) {
            exec(`v4l2-ctl -d /dev/video0 -c ${commands.join(',')}`, (err, stdout, stderr) => {
                if (err) console.error("PTZ Command Failed:", err);
            });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));

    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

let activeRecordingProcess = null;
let recordingFilePath = null;

server.listen(5555, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(' PI CAPTURE DAEMON RUNNING ON HTTP://0.0.0.0:5555');
    console.log(' Waiting for GStreamer tcpserversink on port 5000');
    console.log('===================================================');
});
