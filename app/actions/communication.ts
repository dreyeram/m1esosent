"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

// ============================================================================
// SHARE LINK GENERATION
// ============================================================================

interface ShareLinkResult {
    success: boolean;
    token?: string;
    url?: string;
    expiresAt?: Date;
    patientName?: string;
    error?: string;
}

/**
 * Generate a secure, expiring share link for a procedure report
 */
export async function generateShareLink(data: {
    procedureId: string;
    recipient: string;
    channel: "whatsapp" | "email";
    expiryDays?: number;
}): Promise<ShareLinkResult> {
    try {
        const { procedureId, recipient, channel, expiryDays = 7 } = data;

        // Validate inputs
        if (!procedureId) {
            console.error("generateShareLink: No procedureId provided");
            return { success: false, error: "No procedure ID provided" };
        }

        // Verify procedure exists and has a report
        const procedure = await prisma.procedure.findUnique({
            where: { id: procedureId },
            include: { report: true, patient: true }
        });

        if (!procedure) {
            console.error("generateShareLink: Procedure not found:", procedureId);
            return { success: false, error: "Procedure not found" };
        }

        if (!procedure.report) {
            console.error("generateShareLink: No report for procedure:", procedureId);
            return { success: false, error: "No report found for this procedure. Please finalize the report first." };
        }

        // Create expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        // Create share token
        const token = await (prisma as any).shareToken.create({
            data: {
                procedureId,
                expiresAt,
                recipient,
                channel,
                isActive: true
            }
        });

        // Build the full URL (will be replaced with actual domain in production)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const shareUrl = `${baseUrl}/portal/${token.id}`;

        console.log("generateShareLink: Success for procedure:", procedureId, "URL:", shareUrl);

        return {
            success: true,
            token: token.id,
            url: shareUrl,
            expiresAt: token.expiresAt,
            patientName: procedure.patient.fullName
        };
    } catch (error) {
        console.error("generateShareLink error:", error);
        return { success: false, error: "Database error while generating share link" };
    }
}

// ============================================================================
// WHATSAPP
// ============================================================================

/**
 * Generate a WhatsApp share URL (wa.me format)
 */
export async function getWhatsAppShareUrl(data: {
    procedureId: string;
    phone: string;
    messageTemplate?: string;
}) {
    try {
        const { procedureId, phone, messageTemplate } = data;

        // Generate the secure link first
        const linkResult = await generateShareLink({
            procedureId,
            recipient: phone,
            channel: "whatsapp"
        });

        if (!linkResult.success || !linkResult.url) {
            return { success: false, error: linkResult.error || "Failed to generate link" };
        }

        // Get default template or use provided one
        let template = messageTemplate;
        if (!template) {
            const defaultTemplate = await prisma.messageTemplate.findFirst({
                where: { channel: "whatsapp", isDefault: true }
            });
            template = defaultTemplate?.body ||
                "Hello! Your medical report is ready. Please click the link below to view it securely:\n\n{{link}}\n\nThis link will expire in 7 days.";
        }

        // Replace placeholders
        const message = (template || "")
            .replace(/\{\{link\}\}/g, linkResult.url || "")
            .replace(/\{\{patientName\}\}/g, linkResult.patientName || "Patient");

        // Clean phone number (remove spaces, dashes)
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

        // Build WhatsApp Web URL directly to bypass "Open WhatsApp?" prompt
        // Using web.whatsapp.com forces the web interface
        const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

        return {
            success: true,
            url: waUrl,
            shareLink: linkResult.url,
            expiresAt: linkResult.expiresAt,
            message // Return the message for direct sending
        };
    } catch (error) {
        console.error("getWhatsAppShareUrl error:", error);
        return { success: false, error: "Failed to generate WhatsApp URL" };
    }
}

/**
 * Send WhatsApp message directly via connected client
 * This is the preferred method when WhatsApp is connected
 */
import { WhatsAppService } from "@/lib/communication/whatsapp-service";

// ...

/**
 * Send WhatsApp message directly via connected client
 * This is the preferred method when WhatsApp is connected
 */
export async function sendWhatsAppDirect(data: {
    procedureId: string;
    phone: string;
    messageTemplate?: string;
    pdfBuffer?: string; // Base64 encoded PDF
}) {
    console.log("[sendWhatsAppDirect] Starting send process for:", data.phone);
    try {
        const { procedureId, phone, messageTemplate, pdfBuffer } = data;

        // Generate the secure link first
        const linkResult = await generateShareLink({
            procedureId,
            recipient: phone,
            channel: "whatsapp"
        });

        if (!linkResult.success || !linkResult.url) {
            console.error("[sendWhatsAppDirect] Link generation failed:", linkResult.error);
            return { success: false, error: linkResult.error || "Failed to generate link" };
        }

        // Get default template or use provided one
        let template = messageTemplate;
        if (!template) {
            const defaultTemplate = await prisma.messageTemplate.findFirst({
                where: { channel: "whatsapp", isDefault: true }
            });
            template = defaultTemplate?.body ||
                "Hello! Your medical report is ready. Please click the link below to view it securely:\n\n{{link}}\n\nThis link will expire in 7 days.";
        }

        // Replace placeholders
        const message = (template || "")
            .replace(/\{\{link\}\}/g, linkResult.url || "")
            .replace(/\{\{patientName\}\}/g, linkResult.patientName || "Patient");

        // Clean phone number
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

        // Use new WhatsApp Service
        console.log("[sendWhatsAppDirect] Getting WhatsApp service instance...");
        const service = WhatsAppService.getInstance();
        const status = service.getStatus();

        console.log("[sendWhatsAppDirect] Service Status:", status.connection);

        // Allow both AUTHENTICATED and READY
        if (status.connection !== 'READY' && status.connection !== 'AUTHENTICATED') {
            console.warn("[sendWhatsAppDirect] Service not ready. Status:", status.connection);
            return {
                success: false,
                error: `WhatsApp is not connected. Status: ${status.connection}. Please connect in Admin Settings → Communication.`,
                fallbackUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
            };
        }

        console.log("[sendWhatsAppDirect] Sending message to:", cleanPhone);

        // Use service.sendMessage which has built-in retry logic
        const result = await service.sendMessage(cleanPhone, message);

        if (result.success) {
            console.log("[sendWhatsAppDirect] Message sent successfully");
            return {
                success: true,
                shareLink: linkResult.url,
                expiresAt: linkResult.expiresAt,
                message: "Report sent via WhatsApp successfully!"
            };
        } else {
            console.error("[sendWhatsAppDirect] Send failed:", result.error);
            return {
                success: false,
                error: result.error || "Failed to send WhatsApp message",
                fallbackUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
            };
        }

    } catch (error: any) {
        console.error("[sendWhatsAppDirect] Unexpected error:", error);
        return { success: false, error: error.message || "Failed to send WhatsApp message" };
    }
}

// ============================================================================
// EMAIL
// ============================================================================

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(config: {
    host: string;
    port: string;
    secure: boolean;
    user: string;
    pass: string;
}) {
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
            connectTimeout: 10000, // 10s timeout
        } as any);

        await transporter.verify();
        return { success: true, message: "Connection successful" };
    } catch (error: any) {
        console.error("testSmtpConnection error:", error);
        return { success: false, message: error.message || "Connection failed" };
    }
}

/**
 * Send report via email
 */
export async function sendReportEmail(data: {
    procedureId: string;
    email: string;
    subject?: string;
    messageTemplate?: string;
}) {
    try {
        const { procedureId, email, subject, messageTemplate } = data;

        // 1. Get SMTP Config from Organization
        const procedure = await prisma.procedure.findUnique({
            where: { id: procedureId },
            include: { doctor: { include: { organization: true } } }
        });

        if (!procedure?.doctor?.organization?.smtpConfig) {
            return { success: false, error: "SMTP Email is not configured in Admin Settings" };
        }

        const smtpConfig = JSON.parse(procedure.doctor.organization.smtpConfig);

        // 2. Generate the secure link
        const linkResult = await generateShareLink({
            procedureId,
            recipient: email,
            channel: "email"
        });

        if (!linkResult.success || !linkResult.url) {
            return { success: false, error: linkResult.error || "Failed to generate link" };
        }

        // 3. Get Template
        let template = messageTemplate;
        let finalSubject = subject;

        if (!template) {
            const defaultTemplate = await (prisma as any).messageTemplate.findFirst({
                where: { channel: "email", isDefault: true }
            });
            template = defaultTemplate?.body ||
                "Dear Patient,\n\nYour medical report is now available. Please click the link below to view it:\n\n{{link}}\n\nThis link will expire in 7 days.\n\nBest regards,\n{{hospitalName}}";

            if (!finalSubject && defaultTemplate?.subject) {
                finalSubject = defaultTemplate.subject;
            }
        }

        // Ensure template is a string
        const templateStr = template || "";

        // 4. Prepare Message
        const body = templateStr
            .replace(/\{\{link\}\}/g, linkResult.url || "")
            .replace(/\{\{patientName\}\}/g, linkResult.patientName || "Patient")
            .replace(/\{\{hospitalName\}\}/g, (procedure.doctor as any).organization.name || "Medical Center");

        const mailSubject = finalSubject || `Medical Report - ${linkResult.patientName || "Patient"}`;

        // 5. Send Email
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: parseInt(smtpConfig.port),
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        } as any);

        await transporter.sendMail({
            from: `"${smtpConfig.fromName || procedure.doctor.organization.name}" <${smtpConfig.fromEmail || smtpConfig.user}>`,
            to: email,
            subject: mailSubject,
            text: body,
            // html: body.replace(/\n/g, '<br>') // Optional: added basic HTML fallback
        });

        return {
            success: true,
            shareLink: linkResult.url,
            expiresAt: linkResult.expiresAt,
            message: "Report shared via email successfully"
        };
    } catch (error: any) {
        console.error("sendReportEmail error:", error);
        return { success: false, error: error.message || "Failed to send email. Check SMTP settings." };
    }
}

// ============================================================================
// VERIFY TOKEN (for Portal page)
// ============================================================================

/**
 * Verify a share token and return the report data if valid
 */
export async function verifyShareToken(tokenId: string) {
    try {
        const token = await prisma.shareToken.findUnique({
            where: { id: tokenId },
            include: {
                procedure: {
                    include: {
                        patient: true,
                        doctor: { select: { fullName: true } },
                        report: true
                    }
                }
            }
        });

        if (!token) {
            return { success: false, error: "Invalid link", code: "NOT_FOUND" };
        }

        if (!token.isActive) {
            return { success: false, error: "This link has been deactivated", code: "DEACTIVATED" };
        }

        if (new Date() > token.expiresAt) {
            return { success: false, error: "This link has expired", code: "EXPIRED" };
        }

        // Update access tracking
        await (prisma as any).shareToken.update({
            where: { id: tokenId },
            data: {
                accessedAt: token.accessedAt || new Date(),
                viewCount: { increment: 1 }
            }
        });

        return {
            success: true,
            data: {
                patientName: token.procedure.patient.fullName,
                procedureType: token.procedure.type,
                procedureDate: token.procedure.createdAt,
                doctorName: token.procedure.doctor?.fullName || "Unknown",
                reportContent: token.procedure.report?.content || "{}",
                viewCount: token.viewCount + 1
            }
        };
    } catch (error) {
        console.error("verifyShareToken error:", error);
        return { success: false, error: "Failed to verify link", code: "ERROR" };
    }
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export async function getMessageTemplates(channel?: string) {
    try {
        const templates = await (prisma as any).messageTemplate.findMany({
            where: channel ? { channel } : undefined,
            orderBy: { createdAt: "desc" }
        });
        return { success: true, templates };
    } catch (error) {
        console.error("getMessageTemplates error:", error);
        return { success: false, error: "Failed to load templates", templates: [] };
    }
}

export async function saveMessageTemplate(data: {
    id?: string;
    name: string;
    channel: string;
    subject?: string;
    body: string;
    isDefault?: boolean;
}) {
    try {
        // If setting as default, unset other defaults for this channel
        if (data.isDefault) {
            await (prisma as any).messageTemplate.updateMany({
                where: { channel: data.channel },
                data: { isDefault: false }
            });
        }

        if (data.id) {
            // Update existing
            const template = await (prisma as any).messageTemplate.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    channel: data.channel,
                    subject: data.subject,
                    body: data.body,
                    isDefault: data.isDefault || false
                }
            });
            return { success: true, template };
        } else {
            // Create new
            const template = await (prisma as any).messageTemplate.create({
                data: {
                    name: data.name,
                    channel: data.channel,
                    subject: data.subject,
                    body: data.body,
                    isDefault: data.isDefault || false
                }
            });
            return { success: true, template };
        }
    } catch (error) {
        console.error("saveMessageTemplate error:", error);
        return { success: false, error: "Failed to save template" };
    }
}
