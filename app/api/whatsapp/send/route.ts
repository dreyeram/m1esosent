import { NextResponse } from 'next/server';
import { WhatsAppClient } from '@/lib/whatsapp/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { INTERNAL_PATHS, ensureDirectoryExists } from '@/lib/storage/paths';

export async function POST(req: Request) {
    let phone = '';
    try {
        const formData = await req.formData();
        phone = formData.get('phone') as string || '';
        const message = formData.get('message') as string;
        const file = formData.get('file') as File | null;
        const procedureId = formData.get('procedureId') as string;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const client = WhatsAppClient.getInstance();
        const status = client.getStatus();

        console.log(`[API/send] Client Status: ${status.status}`);

        // Allow both READY and AUTHENTICATED - the client handles waiting internally
        if (status.status !== 'READY' && status.status !== 'AUTHENTICATED') {
            return NextResponse.json({
                error: `WhatsApp client is not connected. Status: ${status.status}`,
                fallbackUrl: `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message || '')}`
            }, { status: 503 });
        }

        let filePath: string | undefined;

        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Save to reports directory if procedureId exists, otherwise temp
            const directory = procedureId ? INTERNAL_PATHS.reports : INTERNAL_PATHS.temp;
            ensureDirectoryExists(directory);

            const filename = procedureId
                ? `report_${procedureId}.pdf`
                : `temp_whatsapp_${Date.now()}.pdf`;

            filePath = join(directory, filename);
            await writeFile(filePath, buffer);
        }

        const result = await client.sendMessage(phone, message || '', filePath);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({
                error: result.error || 'Failed to send message',
                fallbackUrl: `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message || '')}`
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Send API Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to send message',
            fallbackUrl: `https://web.whatsapp.com/send?phone=${phone?.replace(/\D/g, '') || ''}&text=`
        }, { status: 500 });
    }
}
