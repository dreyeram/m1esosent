#!/bin/bash
###############################################################################
# livefeed_pi.sh - Zero-Latency Endoscopy Live Feed for Pi 5
#
# Physical monitor mode (NOT VNC). Renders the camera feed directly onto
# the display using DRM/KMS (kmssink), AND serves MJPEG frames on TCP
# port 5000 for pi_capture_daemon.js to snapshot.
#
# Camera: HDMI USB capture card (endoscope input) at 1920x1080
# Display: Pi physically connected to monitor (no X11/Wayland needed)
###############################################################################

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
VIDEO_DEVICE="${VIDEO_DEVICE:-/dev/video0}"
WIDTH="${WIDTH:-1920}"
HEIGHT="${HEIGHT:-1080}"
FRAMERATE="${FRAMERATE:-30}"

# Display rectangle for kmssink:
# Left 70% of 1920 = 1344px wide.
# 16:9 inside 1344px: height = 1344 * 9 / 16 = 756px
# Vertical centering in 1080px: (1080 - 756) / 2 = 162px from top
DISP_X=0
DISP_Y=162
DISP_W=1344
DISP_H=756
DISP_RECT="${DISP_X},${DISP_Y},${DISP_W},${DISP_H}"
# ─────────────────────────────────────────────────────────────────────────────

log() { echo "[livefeed] $(date '+%H:%M:%S') $*" >&2; }

# ─── Wait for video device ──────────────────────────────────────────────────
wait_for_device() {
    local retries=0
    while [ ! -e "$VIDEO_DEVICE" ]; do
        retries=$((retries + 1))
        if [ $retries -gt 60 ]; then
            log "ERROR: $VIDEO_DEVICE not found after 60s. Check camera connection."
            exit 1
        fi
        log "Waiting for $VIDEO_DEVICE ... ($retries/60)"
        sleep 1
    done
    log "Device $VIDEO_DEVICE is ready."
}

# ─── Log device capabilities for debugging ──────────────────────────────────
detect_caps() {
    if command -v v4l2-ctl &>/dev/null; then
        log "Device capabilities (MJPEG formats):"
        v4l2-ctl -d "$VIDEO_DEVICE" --list-formats-ext 2>/dev/null | grep -A5 "MJPG\|JPEG" >&2 || true
    fi
}

# ─── Wait for DRM to be ready ───────────────────────────────────────────────
wait_for_drm() {
    local retries=0
    while ! ls /dev/dri/card* &>/dev/null; do
        retries=$((retries + 1))
        if [ $retries -gt 30 ]; then
            log "WARNING: No DRM device after 30s."
            return 1
        fi
        sleep 1
    done
    log "DRM device ready: $(ls /dev/dri/card* 2>/dev/null | head -1)"
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
GST_PID=""
cleanup() {
    log "Shutting down..."
    [ -n "$GST_PID" ] && kill "$GST_PID" 2>/dev/null || true
    [ -n "$GST_PID" ] && wait "$GST_PID" 2>/dev/null || true
    setterm --cursor on 2>/dev/null || true
    log "Done."
}
trap cleanup EXIT INT TERM

# ─── Launch pipeline ─────────────────────────────────────────────────────────
# PIPELINE:
#  v4l2src → MJPEG caps 1920x1080@30fps
#      └→ tee
#           ├─ BRANCH A (Display): jpegdec → videoconvert → videoscale →
#           │   exact 1344x756 → kmssink (DRM overlay, 16:9 in left 70%)
#           │   sync=false async=false = zero latency
#           │   leaky queue = always latest frame, never frozen
#           │
#           └─ BRANCH B (Capture): raw MJPEG → tcpserversink :5000
#               pi_capture_daemon.js reads this for /capture endpoint
#
launch_pipeline() {
    local caps="image/jpeg,width=${WIDTH},height=${HEIGHT},framerate=${FRAMERATE}/1"

    local display_branch="queue name=qdisp leaky=downstream max-size-buffers=1 max-size-bytes=0 max-size-time=0 ! jpegdec ! videoconvert ! videoscale method=linear ! video/x-raw,width=${DISP_W},height=${DISP_H},pixel-aspect-ratio=1/1 ! kmssink name=sink render-rectangle=\"${DISP_RECT}\" sync=false async=false"

    local capture_branch="queue name=qcap leaky=downstream max-size-buffers=2 max-size-bytes=0 max-size-time=0 ! tcpserversink host=127.0.0.1 port=5000 sync=false async=false"

    local pipeline="v4l2src device=${VIDEO_DEVICE} io-mode=mmap do-timestamp=true ! ${caps} ! tee name=t t. ! ${display_branch} t. ! ${capture_branch}"

    log "Pipeline: $pipeline"
    log "Display rect: x=${DISP_X} y=${DISP_Y} w=${DISP_W} h=${DISP_H}"

    # Run GStreamer WITHOUT chrt (requires root not available for lm user)
    # Use GST_DEBUG=1 to get errors but not spam
    GST_DEBUG=1 gst-launch-1.0 -e $pipeline &
    GST_PID=$!
    log "GStreamer running (PID: ${GST_PID}). Waiting..."
    wait "$GST_PID"
    local exit_code=$?
    GST_PID=""
    return $exit_code
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    log "═══════════════════════════════════════════════════════"
    log "  Endoscopy Live Feed — Physical Monitor Mode (Pi 5)"
    log "  Device:   ${VIDEO_DEVICE}"
    log "  Source:   ${WIDTH}x${HEIGHT} @ ${FRAMERATE}fps MJPEG"
    log "  Display:  DRM kmssink rect ${DISP_RECT}"
    log "  Capture:  TCP 127.0.0.1:5000"
    log "═══════════════════════════════════════════════════════"

    wait_for_device
    detect_caps
    wait_for_drm || true
    prepare_console

    local attempt=0
    while true; do
        attempt=$((attempt + 1))
        log "Starting pipeline (attempt #${attempt})..."

        if launch_pipeline; then
            log "Pipeline exited cleanly."
        else
            log "Pipeline exited with code $?. Retrying in 3s..."
        fi

        sleep 3
        wait_for_device
    done
}

main "$@"
