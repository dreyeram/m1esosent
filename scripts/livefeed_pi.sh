#!/bin/bash
###############################################################################
# livefeed_pi.sh - Zero-Latency Endoscopy Live Feed for Pi 5
#
# Ultra-low-latency GStreamer pipeline for HDMI USB capture cards on Pi.
# Console mode — renders exactly to the left 70% of a 1080p display via DRM/KMS.
# Bridges a capture stream to port 5000 for the Next.js `pi_capture_daemon.js`.
# No tearing. Zero proxy buffering.
###############################################################################

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
VIDEO_DEVICE="${VIDEO_DEVICE:-/dev/video0}"
WIDTH="${WIDTH:-1920}"
HEIGHT="${HEIGHT:-1080}"
FRAMERATE="${FRAMERATE:-60}"
# 1344 is 70% of 1920 (Leaves 30% for the floating Right Panel UI)
# To preserve 16:9 aspect ratio inside 1344 width, height must be 1344 * 9 / 16 = 756
# To center vertically in a 1080p display: (1080 - 756) / 2 = 162
DISP_RECT="0,162,1344,756"
# ─────────────────────────────────────────────────────────────────────────────

log() { echo "[livefeed] $(date '+%H:%M:%S') $*" >&2; }

# ─── Wait for video device ──────────────────────────────────────────────────
wait_for_device() {
    local retries=0
    while [ ! -e "$VIDEO_DEVICE" ]; do
        retries=$((retries + 1))
        if [ $retries -gt 60 ]; then
            log "ERROR: $VIDEO_DEVICE not found after 60s."
            exit 1
        fi
        log "Waiting for $VIDEO_DEVICE ... ($retries/60)"
        sleep 1
    done
    log "Device $VIDEO_DEVICE is ready."
}

# ─── Wait for DRM to be ready ───────────────────────────────────────────────
wait_for_drm() {
    local retries=0
    while ! ls /dev/dri/card* &>/dev/null; do
        retries=$((retries + 1))
        if [ $retries -gt 30 ]; then
            log "WARNING: No DRM device after 30s. kmssink might fail."
            return 1
        fi
        sleep 1
    done
    return 0
}

# ─── Prepare console ─────────────────────────────────────────────────────────
prepare_console() {
    echo 0 > /sys/module/kernel/parameters/consoleblank 2>/dev/null || true
    setterm -blank 0 -powerdown 0 2>/dev/null || true
    echo 0 > /sys/class/graphics/fbcon/cursor_blink 2>/dev/null || true
    setterm --cursor off 2>/dev/null || true
}

# ─── Cleanup on exit ────────────────────────────────────────────────────────
cleanup() {
    log "Shutting down live feed..."
    kill "$GST_PID" 2>/dev/null || true
    wait "$GST_PID" 2>/dev/null || true
    setterm --cursor on 2>/dev/null || true
    log "Done."
}
trap cleanup EXIT INT TERM

# ─── Main Pipeline Builder ───────────────────────────────────────────────────
main() {
    log "═══════════════════════════════════════════════════"
    log "  Zero-Latency Endoscopy Live Feed (Dual Branch)"
    log "  Display: DRM kmssink exactly at $DISP_RECT"
    log "  Capture: TCP Server Port 5000"
    log "═══════════════════════════════════════════════════"

    wait_for_device
    wait_for_drm || true
    prepare_console

    # TEE PIPELINE:
    # 1. v4l2src captures MJPEG directly
    # 2. Tee splits it into two branches.
    # BRANCH A (Display): Decodes JPEG into raw video and drops it straight onto the DRM plane via kmssink. 
    #                     sync=false async=false disables all clock-matching limits, pushing 0ms latency.
    #                     render-rectangle locks it under the left 70% of the UI.
    # BRANCH B (Capture): Forwards the untouched MJPEG bytes to localhost:5000 so the Node daemon can snapshot it.
    
    local pipeline="v4l2src device=${VIDEO_DEVICE} io-mode=mmap do-timestamp=true ! image/jpeg ! tee name=t \
        t. ! queue leaky=downstream max-size-buffers=1 ! jpegdec ! videoconvert ! kmssink render-rectangle=\"${DISP_RECT}\" sync=false async=false \
        t. ! queue leaky=downstream max-size-buffers=2 ! tcpserversink host=127.0.0.1 port=5000 sync=false async=false"

    log "Evaluating Display Sink..."
    
    # If kmssink fails (e.g. running on non-Pi Linux), fallback to autovideosink for display branch
    # But usually, it is guaranteed on Pi. We will force kmssink.
    log "Launching pipeline..."
    
    if command -v chrt &>/dev/null; then
        chrt -f 50 gst-launch-1.0 -e $pipeline &
    else
        gst-launch-1.0 -e $pipeline &
    fi
    GST_PID=$!

    log "GStreamer running (PID: $GST_PID)."
    wait "$GST_PID"
}

main "$@"
