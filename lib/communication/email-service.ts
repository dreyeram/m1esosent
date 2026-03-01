import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
    fromEmail: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
}

/**
 * Email Service for sending reports via SMTP
 */
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private config: SMTPConfig | null = null;
    private logFile: string;

    constructor() {
        this.logFile = path.join(process.cwd(), 'email-service.log');
    }

    private log(message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [EmailService] ${message}`;
        console.log(logMsg, data || '');

        try {
            fs.appendFileSync(this.logFile, `${logMsg} ${data ? JSON.stringify(data) : ''}\n`);
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Configure SMTP settings
     */
    public configure(config: SMTPConfig): void {
        this.config = config;

        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.password
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certs
            }
        });

        this.log('SMTP configured:', { host: config.host, port: config.port });
    }

    /**
     * Test SMTP connection
     */
    public async testConnection(): Promise<{ success: boolean; error?: string }> {
        if (!this.transporter) {
            return { success: false, error: 'SMTP not configured' };
        }

        try {
            await this.transporter.verify();
            this.log('SMTP connection verified');
            return { success: true };
        } catch (error: any) {
            this.log('SMTP test failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email with optional attachment
     */
    public async sendEmail(
        to: string,
        subject: string,
        html: string,
        attachmentPath?: string
    ): Promise<EmailResult> {
        if (!this.transporter || !this.config) {
            return {
                success: false,
                error: 'SMTP not configured',
                timestamp: new Date()
            };
        }

        try {
            const mailOptions: nodemailer.SendMailOptions = {
                from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
                to,
                subject,
                html
            };

            // Add attachment if provided
            if (attachmentPath && fs.existsSync(attachmentPath)) {
                const filename = path.basename(attachmentPath);
                mailOptions.attachments = [{
                    filename,
                    path: attachmentPath
                }];
            }

            const info = await this.transporter.sendMail(mailOptions);
            this.log('Email sent:', info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                timestamp: new Date()
            };
        } catch (error: any) {
            this.log('Send email failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Send report email with PDF attachment
     */
    public async sendReport(
        to: string,
        patientName: string,
        procedureType: string,
        reportLink: string,
        pdfPath?: string,
        organizationName?: string
    ): Promise<EmailResult> {
        const subject = `Your Medical Report - ${procedureType}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        h1 { margin: 0; font-size: 24px; }
        .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Your Medical Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${organizationName || 'Medical Center'}</p>
        </div>
        <div class="content">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Your ${procedureType} report is now ready for viewing.</p>
            
            <div class="info">
                <p><strong>Procedure:</strong> ${procedureType}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>You can view your report using the secure link below:</p>
            <a href="${reportLink}" class="button">View Report</a>
            
            ${pdfPath ? '<p><em>A PDF copy is also attached to this email.</em></p>' : ''}
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                This link will expire in 7 days for your privacy and security.
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>© ${new Date().getFullYear()} ${organizationName || 'Medical Center'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail(to, subject, html, pdfPath);
    }

    /**
     * Check if email is configured
     */
    public isConfigured(): boolean {
        return this.transporter !== null && this.config !== null;
    }

    /**
     * Get current configuration (without password)
     */
    public getConfig(): Partial<SMTPConfig> | null {
        if (!this.config) return null;
        return {
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            user: this.config.user,
            fromName: this.config.fromName,
            fromEmail: this.config.fromEmail
        };
    }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
    if (!emailServiceInstance) {
        emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
}
