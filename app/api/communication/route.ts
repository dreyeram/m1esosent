import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/communication/whatsapp-service';
import { getEmailService, SMTPConfig } from '@/lib/communication/email-service';

/**
 * GET /api/communication - Get status of both services
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get('service');

    try {
        if (service === 'whatsapp') {
            const whatsapp = WhatsAppService.getInstance();
            return NextResponse.json(whatsapp.getStatus());
        }

        if (service === 'email') {
            const email = getEmailService();
            return NextResponse.json({
                configured: email.isConfigured(),
                config: email.getConfig()
            });
        }

        // Return both statuses
        const whatsapp = WhatsAppService.getInstance();
        const email = getEmailService();

        return NextResponse.json({
            whatsapp: whatsapp.getStatus(),
            email: {
                configured: email.isConfigured(),
                config: email.getConfig()
            }
        });
    } catch (error: any) {
        console.error('[API] GET /api/communication error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/communication - Perform actions
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, service } = body;

        console.log('[API] POST /api/communication:', { action, service });

        // WhatsApp actions
        if (service === 'whatsapp') {
            const whatsapp = WhatsAppService.getInstance();

            if (action === 'initialize') {
                whatsapp.initialize().catch(err => {
                    console.error('[API] WhatsApp init error:', err);
                });
                return NextResponse.json({ success: true, message: 'Initializing...' });
            }

            if (action === 'send') {
                const { phone, message, mediaPath } = body;

                if (!phone || !message) {
                    return NextResponse.json(
                        { success: false, error: 'Phone and message required' },
                        { status: 400 }
                    );
                }

                const result = await whatsapp.sendMessage(phone, message, mediaPath);
                return NextResponse.json(result);
            }

            if (action === 'disconnect') {
                await whatsapp.disconnect();
                return NextResponse.json({ success: true, message: 'Disconnected' });
            }
        }

        // Email actions
        if (service === 'email') {
            const email = getEmailService();

            if (action === 'configure') {
                const config: SMTPConfig = body.config;
                if (!config || !config.host || !config.user) {
                    return NextResponse.json(
                        { success: false, error: 'Invalid SMTP configuration' },
                        { status: 400 }
                    );
                }
                email.configure(config);
                return NextResponse.json({ success: true, message: 'Email configured' });
            }

            if (action === 'test') {
                const result = await email.testConnection();
                return NextResponse.json(result);
            }

            if (action === 'send') {
                const { to, subject, html, attachmentPath } = body;
                if (!to || !subject || !html) {
                    return NextResponse.json(
                        { success: false, error: 'to, subject, and html required' },
                        { status: 400 }
                    );
                }
                const result = await email.sendEmail(to, subject, html, attachmentPath);
                return NextResponse.json(result);
            }

            if (action === 'sendReport') {
                const { to, patientName, procedureType, reportLink, pdfPath, organizationName } = body;
                const result = await email.sendReport(
                    to, patientName, procedureType, reportLink, pdfPath, organizationName
                );
                return NextResponse.json(result);
            }
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action or service' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[API] POST /api/communication error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/communication - Disconnect services
 */
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get('service');

    try {
        if (service === 'whatsapp' || !service) {
            const whatsapp = WhatsAppService.getInstance();
            await whatsapp.disconnect();
        }

        return NextResponse.json({ success: true, message: 'Service disconnected' });
    } catch (error: any) {
        console.error('[API] DELETE /api/communication error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
