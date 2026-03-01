"use client";

import React, { useState, useEffect } from "react";

interface NowIndicatorProps {
    dayStartTime: string;
    slotDuration: number; // minutes per slot
}

export function NowIndicator({ dayStartTime, slotDuration }: NowIndicatorProps) {
    const [position, setPosition] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = timeToMinutes(dayStartTime);

            // Calculate position: 80px per slot
            const pixelsPerMinute = 80 / slotDuration;
            const offsetMinutes = currentMinutes - startMinutes;
            const newPosition = offsetMinutes * pixelsPerMinute;

            setPosition(Math.max(0, newPosition));
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [dayStartTime, slotDuration]);

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${position}px` }}
        >
            <div className="flex items-center">
                {/* Time label */}
                <div className="w-20 pr-1 text-right">
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {formatTime(new Date())}
                    </span>
                </div>
                {/* Red line */}
                <div className="flex-1 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-lg" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                </div>
            </div>
        </div>
    );
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export default NowIndicator;
