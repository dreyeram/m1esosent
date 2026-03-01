"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors no-print flex items-center gap-2"
        >
            <Printer className="w-4 h-4" />
            Print / Download
        </button>
    );
}

export function PrintStyles() {
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
                body { background: white !important; }
                .no-print { display: none !important; }
                .no-shadow { box-shadow: none !important; }
            }
        ` }} />
    );
}
