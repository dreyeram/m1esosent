"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

interface LivePreviewCircleProps {
    deviceId?: string;
    className?: string;
    mirrored?: boolean;
    captureArea?: { x: number; y: number; width: number; height: number };
    aspectRatioCorrection?: '16:9' | '4:3 (Stretch Thin)' | '4:3 (Squeeze Wide)' | '1:1';
}

export default function LivePreviewCircle({
    deviceId,
    className = "",
    mirrored = false,
    captureArea,
    aspectRatioCorrection = '16:9',
}: LivePreviewCircleProps) {
    const [imgUrl, setImgUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let active = true;

        const startLocalStream = async () => {
            try {
                const constraints = {
                    video: {
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        aspectRatio: { ideal: 1.7777777778 }
                    }
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (active && videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsLoading(false);
                } else {
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                if (!active) return;
                pollDaemon();
            }
        };

        const pollDaemon = async () => {
            const hostname = window.location.hostname || 'localhost';
            setIsLoading(false);
            while (active) {
                try {
                    const res = await fetch(`http://${hostname}:5555/capture`, { cache: 'no-store' });
                    if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        setImgUrl(prev => {
                            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                            return url;
                        });
                    }
                } catch (e) {
                    await new Promise(r => setTimeout(r, 1000));
                }
                await new Promise(r => setTimeout(r, 100)); // 10 fps
            }
        };

        startLocalStream();

        return () => {
            active = false;
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, [deviceId]);

    // Compute the scope transform so PIP shows only the capture area
    // Uses object-cover to fill the circular PIP completely (no black bars)
    const scopeStyle = useMemo((): React.CSSProperties => {
        if (!captureArea || captureArea.width === 0) {
            return {
                width: "100%",
                height: "100%",
                objectFit: "cover" as const,
                transform: mirrored ? 'scaleX(-1)' : 'none',
            };
        }

        // Scale up: 1/captureArea.width makes the capture region fill the container
        const scale = 1 / captureArea.width;

        // Shift so the capture area center lands in the middle of the PIP
        // captureArea.x/y are normalized (0-1). At 0.5 = center = no shift needed.
        const shiftX = (0.5 - captureArea.x) * 100;
        const shiftY = (0.5 - captureArea.y) * 100;

        let correctionScaleX = 1;
        if (aspectRatioCorrection === '4:3 (Stretch Thin)') {
            correctionScaleX = 1.333;
        } else if (aspectRatioCorrection === '4:3 (Squeeze Wide)') {
            correctionScaleX = 0.75;
        } else if (aspectRatioCorrection === '1:1') {
            correctionScaleX = 0.5625;
        }

        return {
            width: "100%",
            height: "100%",
            objectFit: "cover" as const,
            transformOrigin: "center center",
            transform: `scale(${scale}) scaleX(${correctionScaleX}) translate(${shiftX}%, ${shiftY}%)${mirrored ? ' scaleX(-1)' : ''}`,
        };
    }, [captureArea, aspectRatioCorrection, mirrored]);

    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                </div>
            )}

            {/* Video takes precedence over imgUrl */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`block ${imgUrl ? 'hidden' : 'block'}`}
                style={{ ...scopeStyle, backgroundColor: 'black' }}
            />

            {imgUrl && (
                <img
                    src={imgUrl}
                    alt="Live PIP"
                    className="block"
                    style={{ ...scopeStyle, backgroundColor: 'black' }}
                />
            )}

            {/* Live Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-red-600/80 backdrop-blur-sm flex items-center gap-1 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">LIVE</span>
            </div>
        </div>
    );
}
