import { NextResponse } from 'next/server';
import { WhatsAppClient } from '@/lib/whatsapp/client';

/**
 * GET /api/whatsapp - Get current WhatsApp connection status
 */
export async function GET() {
    try {
        const customGlobal = global as any;

        // If no client instance exists, return disconnected
        if (!customGlobal.whatsappClient) {
            return NextResponse.json({
                status: 'DISCONNECTED',
                qrCode: null,
                error: null
            });
        }

        const client = WhatsAppClient.getInstance();
        return NextResponse.json(client.getStatus());
    } catch (error: any) {
        console.error('[API] GET /api/whatsapp error:', error);
        return NextResponse.json({
            status: 'ERROR',
            qrCode: null,
            error: error.message
        });
    }
}

/**
 * POST /api/whatsapp - Initialize, send message, or perform other actions
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = body.action;

        console.log('[API] POST /api/whatsapp action:', action);

        if (action === 'initialize') {
            const client = WhatsAppClient.getInstance();

            // Start initialization (non-blocking)
            client.initialize().catch(err => {
                console.error('[API] Initialize error:', err);
            });

            return NextResponse.json({
                success: true,
                message: 'Initialization started'
            });
        }

        if (action === 'send') {
            const { phone, message, procedureId } = body;

            if (!phone || !message) {
                return NextResponse.json(
                    { success: false, error: 'Phone and message are required' },
                    { status: 400 }
                );
            }

            const client = WhatsAppClient.getInstance();
            const status = client.getStatus();

            // Check if client is in a sendable state
            if (status.status !== 'READY' && status.status !== 'AUTHENTICATED') {
                return NextResponse.json({
                    success: false,
                    error: `WhatsApp is not connected. Current status: ${status.status}. Please connect in Admin Settings.`,
                    fallbackUrl: `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`
                }, { status: 503 });
            }

            // Attempt to send
            const result = await client.sendMessage(phone, message);

            if (result.success) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({
                    success: false,
                    error: result.error,
                    fallbackUrl: `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`
                }, { status: 500 });
            }
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[API] POST /api/whatsapp error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/whatsapp - Logout and clear session
 */
export async function DELETE() {
    try {
        console.log('[API] DELETE /api/whatsapp - Logout requested');

        const customGlobal = global as any;

        if (customGlobal.whatsappClient) {
            const client = WhatsAppClient.getInstance();
            await client.logout();
        }

        return NextResponse.json({
            success: true,
            message: 'Logged out and session cleared'
        });
    } catch (error: any) {
        console.error('[API] DELETE /api/whatsapp error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
