module.exports = {
    apps: [
        // ═══════════════════════════════════════════════════════════
        //  Next.js — Endoscopy Suite Frontend + API
        // ═══════════════════════════════════════════════════════════
        {
            name: 'endoscopy-suite',
            script: 'node_modules/.bin/next',
            args: 'start -H 0.0.0.0 -p 3000',
            cwd: '/home/lm/loyalmed',
            env: {
                NODE_ENV: 'production',
                DATABASE_URL: 'file:/home/lm/loyalmed/prisma/dev.db',
                JWT_SECRET: 'endoscopy-suite-jwt-secret-change-in-production-to-random-string',
                JWT_REFRESH_SECRET: 'endoscopy-suite-refresh-secret-change-in-production-to-random-string',
                INTERNAL_STORAGE_PATH: './data',
                PORT: 3000,
            },
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/home/lm/loyalmed/logs/error.log',
            out_file: '/home/lm/loyalmed/logs/output.log',
            merge_logs: true,
        },

        // ═══════════════════════════════════════════════════════════
        //  Pi Capture Daemon — MJPEG camera stream server (Node.js)
        //
        //  FIX v2:
        //    - interpreter changed: python3 → node
        //    - script path updated: .py → .js
        //    - env vars updated to match new Node.js daemon:
        //        VIDEO_DEVICE   : full device path (was VIDEO_DEVICE_INDEX)
        //        RESOLUTION     : WxH string       (was separate WIDTH/HEIGHT)
        //        FRAMERATE      : fps               (unchanged)
        //        PORT           : HTTP port         (was HTTP_PORT)
        //    - max_memory_restart raised: 512M → 256M (daemon is very lean now)
        //    - kill_timeout added: gives ffmpeg time to flush before SIGKILL
        //    - restart_delay added: prevents rapid crash loops hammering /dev/video0
        // ═══════════════════════════════════════════════════════════
        {
            name: 'pi-capture-daemon',
            interpreter: 'node',                                   // ← was python3
            script: './scripts/pi_capture_daemon.js',         // ← was .py
            cwd: '/home/lm/loyalmed',
            env: {
                VIDEO_DEVICE: '/dev/video0',  // Full device path (not index)
                RESOLUTION: '1920x1080',    // WxH — change to 2560x1440 if needed
                FRAMERATE: '30',           // fps — 30 is stable; try 60 if needed
                PORT: '5555',         // HTTP port the daemon listens on
            },
            instances: 1,
            exec_mode: 'fork',       // Must be fork — daemon manages its own child
            autorestart: true,
            watch: false,        // Never watch — ffmpeg stdout would trigger restarts
            max_memory_restart: '256M',       // Daemon is lean — 256M is plenty
            restart_delay: 3000,         // Wait 3s between restarts (prevents /dev/video0 hammering)
            kill_timeout: 5000,         // Give ffmpeg 5s to flush before SIGKILL
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/home/lm/loyalmed/logs/daemon_error.log',
            out_file: '/home/lm/loyalmed/logs/daemon_output.log',
            merge_logs: true,
        },
    ],
};