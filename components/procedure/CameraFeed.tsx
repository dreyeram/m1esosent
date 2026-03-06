"use client";

// =============================================================================
//  CameraFeed — Raw browser camera via getUserMedia (WebRTC)
//
//  No daemon. No ffmpeg. No MJPEG parsing. No WebSocket.
//  Just the browser talking directly to the USB camera — exactly like
//  webcamtests.com does.
//
//  Exposes captureFrame() via React.forwardRef + useImperativeHandle
// =============================================================================

import React, {
    useRef,
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useCallback,
} from "react";

export interface CameraFeedHandle {
    captureFrame(): string | null;
    getVideoElement(): HTMLVideoElement | null;
}

const CameraFeed = forwardRef<CameraFeedHandle, { className?: string }>(
    function CameraFeed({ className = "" }, ref) {
        const videoRef = useRef<HTMLVideoElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const streamRef = useRef<MediaStream | null>(null);
        const [ready, setReady] = useState(false);
        const [error, setError] = useState<string | null>(null);

        // ── Connect to camera ──
        useEffect(() => {
            let active = true;

            async function startCamera() {
                try {
                    // Request camera — browser will show the "USB3 Video (v4l2)" device
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            frameRate: { ideal: 30 },
                        },
                        audio: false,
                    });

                    if (!active) {
                        stream.getTracks().forEach((t) => t.stop());
                        return;
                    }

                    streamRef.current = stream;

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }

                    setReady(true);
                    setError(null);
                } catch (err: any) {
                    if (!active) return;
                    console.error("[CameraFeed] getUserMedia failed:", err);

                    if (err.name === "NotReadableError") {
                        setError("Camera is in use by another application.");
                    } else if (err.name === "NotAllowedError") {
                        setError("Camera permission denied.");
                    } else if (err.name === "NotFoundError") {
                        setError("No camera detected.");
                    } else {
                        setError(`Camera error: ${err.message}`);
                    }
                }
            }

            startCamera();

            return () => {
                active = false;
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }
            };
        }, []);

        // ── Capture a single frame from the live video ──
        const captureFrame = useCallback((): string | null => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.videoWidth === 0) return null;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            ctx.drawImage(video, 0, 0);
            return canvas.toDataURL("image/jpeg", 0.92);
        }, []);

        // ── Expose to parent via ref ──
        useImperativeHandle(
            ref,
            () => ({
                captureFrame,
                getVideoElement: () => videoRef.current,
            }),
            [captureFrame]
        );

        return (
            <div
                className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${className}`}
            >
                {/* Live video — direct from browser camera API */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#000",
                    }}
                />

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span style={{ fontSize: 36, opacity: 0.2 }}>⚠</span>
                        <span className="text-white/30 text-xs font-semibold">
                            {error}
                        </span>
                    </div>
                )}

                {/* Loading spinner */}
                {!ready && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        );
    }
);

CameraFeed.displayName = "CameraFeed";
export default CameraFeed;
