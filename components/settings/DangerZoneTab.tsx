"use client";

import React from "react";
import DangerZone from "./DangerZone";

interface DangerZoneTabProps {
    userId: string;
    onRefresh?: () => void;
}

export default function DangerZoneTab({ userId, onRefresh }: DangerZoneTabProps) {
    return (
        <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto pr-2 pb-10">
            <DangerZone
                userId={userId}
                onRefresh={onRefresh}
            />
        </div>
    );
}
