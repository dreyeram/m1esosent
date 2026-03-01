import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// POST /api/debug-latency — receives batched latency measurements and appends to CSV
const LOG_PATH = path.join(process.cwd(), "latency-log.csv");

function ensureHeader() {
    if (!fs.existsSync(LOG_PATH)) {
        fs.writeFileSync(LOG_PATH, "timestamp,latency_ms,capture_time,render_time,fps,frame_count\n");
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { samples } = body as { samples: Array<{ ts: number; latency: number; captureTime: number; renderTime: number; fps: number; frameCount: number }> };

        if (!Array.isArray(samples) || samples.length === 0) {
            return NextResponse.json({ ok: false, error: "No samples" }, { status: 400 });
        }

        ensureHeader();

        const lines = samples.map(s =>
            `${new Date(s.ts).toISOString()},${s.latency.toFixed(2)},${s.captureTime.toFixed(2)},${s.renderTime.toFixed(2)},${s.fps},${s.frameCount}`
        ).join("\n") + "\n";

        fs.appendFileSync(LOG_PATH, lines);

        return NextResponse.json({ ok: true, count: samples.length });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

// GET /api/debug-latency — returns the CSV log content (for viewing / downloading)
export async function GET() {
    try {
        if (!fs.existsSync(LOG_PATH)) {
            return new NextResponse("No latency log found yet. Start a procedure to begin collecting data.\n", {
                status: 200,
                headers: { "Content-Type": "text/plain" },
            });
        }
        const content = fs.readFileSync(LOG_PATH, "utf-8");
        return new NextResponse(content, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": "inline; filename=latency-log.csv",
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE /api/debug-latency — clears the log (for fresh test runs)
export async function DELETE() {
    try {
        if (fs.existsSync(LOG_PATH)) fs.unlinkSync(LOG_PATH);
        return NextResponse.json({ ok: true, message: "Log cleared" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
