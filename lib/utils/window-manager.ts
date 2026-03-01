export { };

// Singleton reference to the shared window
// This allows us to strictly reuse the JavaScript object reference, 
// which is the most reliable way to handle cross-origin window reuse.
let whatsappWindow: Window | null = null;

const WINDOW_NAME = 'EndoscopyWhatsAppShare';
// Using dimensions makes it a "popup" which browsers treat as a distinct window,
// easier to reuse and cleaner for the user (doesn't get lost in tabs).
const WINDOW_FEATURES = 'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes';

export const openWhatsAppWindow = async (getUrlFn: () => Promise<string | null>) => {
    // 1. SYNCHRONOUS STEP: Capture/Open window immediately (must happen during click)
    // -------------------------------------------------------------------------------
    // Check if we lost the reference but the window might be open (e.g. strict name lookup)
    if (!whatsappWindow || whatsappWindow.closed) {
        // Try to find existing named window or open new one
        // Passing '' (empty) prevents navigation if it exists
        whatsappWindow = window.open('', WINDOW_NAME, WINDOW_FEATURES);
    }

    if (!whatsappWindow) {
        alert("Popups are blocked. Please allow popups for this site.");
        return;
    }

    // 2. IMMEDIATE FEEDBACK: Focus and show loading (if safe)
    // -------------------------------------------------------------------------------
    whatsappWindow.focus();

    try {
        // Only modify if it's a fresh/blank window.
        // If it's already on WhatsApp (cross-origin), accessing document will throw.
        const isBlank = whatsappWindow.location.href === 'about:blank';
        if (isBlank) {
            whatsappWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Opening WhatsApp...</title>
                    <style>
                        body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; margin: 0; }
                        .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #00a884; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
                        h2 { color: #111b21; margin: 0 0 8px 0; }
                        p { color: #54656f; margin: 0; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="spinner"></div>
                    <h2>Opening WhatsApp...</h2>
                    <p>Please wait while we generate your secure link.</p>
                </body>
                </html>
            `);
            whatsappWindow.document.close();
        }
    } catch (e) {
        // Ignore cross-origin errors (window is already on WhatsApp)
        console.log("Window is active/cross-origin, skipping loading screen");
    }

    // 3. ASYNCHRONOUS STEP: Get URL and Navigate
    // -------------------------------------------------------------------------------
    try {
        const url = await getUrlFn();

        if (url && whatsappWindow && !whatsappWindow.closed) {
            // Force navigation (works even for cross-origin windows)
            whatsappWindow.location.href = url;
            whatsappWindow.focus();
        } else if (!url) {
            // If generation failed, close the blank window if we just opened it
            try {
                if (whatsappWindow.location.href === 'about:blank') {
                    whatsappWindow.close();
                    whatsappWindow = null;
                }
            } catch (e) { }
        }
    } catch (error) {
        console.error("WhatsApp Window Error:", error);
        // Clean up
        try {
            if (whatsappWindow && !whatsappWindow.closed && whatsappWindow.location.href === 'about:blank') {
                whatsappWindow.close();
                whatsappWindow = null;
            }
        } catch (e) { }
        alert("Failed to open WhatsApp. Please try again.");
    }
};
