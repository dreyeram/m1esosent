import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as path from 'path';
import * as fs from 'fs';

// Global reference to prevent multiple clients in development (Next.js hot reload)
declare global {
    var whatsappClient: WhatsAppClient | undefined;
}

export type WhatsAppStatus = 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'READY' | 'ERROR';

export class WhatsAppClient {
    private client: Client | null = null;
    private qrCode: string | null = null;
    private status: WhatsAppStatus = 'DISCONNECTED';
    private initPromise: Promise<void> | null = null;
    private lastError: string | null = null;

    constructor() {
        this.status = 'DISCONNECTED';
    }

    public static getInstance(): WhatsAppClient {
        if (!global.whatsappClient) {
            console.log('[WhatsApp] Creating new singleton instance');
            global.whatsappClient = new WhatsAppClient();
        }
        return global.whatsappClient;
    }

    public getStatus() {
        return {
            status: this.status,
            qrCode: this.qrCode,
            error: this.lastError
        };
    }

    private log(message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [WhatsApp] ${message}`;
        console.log(logMsg, data || '');

        // Also log to file for debugging
        try {
            const logPath = path.join(process.cwd(), 'whatsapp-debug.log');
            fs.appendFileSync(logPath, `${logMsg} ${data ? JSON.stringify(data) : ''}\n`);
        } catch (e) {
            // Ignore file write errors
        }
    }

    public async initialize(): Promise<void> {
        // If already initializing, return the existing promise
        if (this.initPromise && this.status === 'INITIALIZING') {
            this.log('Already initializing, returning existing promise');
            return this.initPromise;
        }

        // If already ready, return immediately
        if (this.status === 'READY') {
            this.log('Already READY');
            return;
        }

        // If client exists (in error state or otherwise), cleanup first
        if (this.client || this.status === 'ERROR') {
            this.log('Cleaning up before initialization...');
            await this.cleanup();
        }

        // Reset state
        this.status = 'INITIALIZING';
        this.lastError = null;
        this.qrCode = null;

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    private async _doInitialize(): Promise<void> {
        this.log('Starting initialization...');
        this.status = 'INITIALIZING';
        this.lastError = null;

        try {
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'endoscopy-suite-client',
                    dataPath: './.wwebjs_auth'
                }),
                puppeteer: {
                    headless: true,
                    executablePath: process.platform === 'linux'
                        ? (fs.existsSync('/usr/bin/chromium-browser') ? '/usr/bin/chromium-browser' : '/usr/bin/chromium')
                        : undefined,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-extensions',
                        '--disable-gpu',
                        '--disable-dev-shm-usage',
                        '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    ],
                    timeout: 60000,
                },
                authTimeoutMs: 120000,
                qrMaxRetries: 5
            });

            // Setup event listeners
            this.setupEventListeners();

            // Start the client
            await this.client.initialize();

            this.log('Client.initialize() completed');

        } catch (error: any) {
            this.log('Initialization failed:', error.message);
            this.status = 'ERROR';
            this.lastError = error.message;
            this.initPromise = null;
            throw error;
        }
    }

    private setupEventListeners() {
        if (!this.client) return;

        this.client.on('qr', (qr) => {
            this.log('QR Code received');
            this.qrCode = qr;
            this.status = 'QR_READY';
        });

        this.client.on('authenticated', () => {
            this.log('Authenticated successfully');
            this.status = 'AUTHENTICATED';
            this.qrCode = null;
        });

        this.client.on('ready', () => {
            this.log('Client is READY!');
            this.status = 'READY';
            this.qrCode = null;
            this.initPromise = null; // Clear the promise
        });

        this.client.on('auth_failure', (msg) => {
            this.log('Authentication failed:', msg);
            this.status = 'ERROR';
            this.lastError = 'Authentication failed: ' + msg;
            this.initPromise = null;
        });

        this.client.on('disconnected', (reason) => {
            this.log('Disconnected:', reason);
            this.status = 'DISCONNECTED';
            this.client = null;
            this.initPromise = null;
        });

        // @ts-ignore
        this.client.on('error', (err) => {
            this.log('Client error:', err);
        });
    }

    /**
     * Wait for client to be ready with timeout
     */
    private async waitForReady(timeoutMs: number = 30000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            if (this.status === 'READY') {
                return true;
            }

            // If client has pupPage and internal services are available, consider it ready
            if (this.status === 'AUTHENTICATED' && this.client?.pupPage) {
                try {
                    const hasStore = await this.client.pupPage.evaluate(() => {
                        // @ts-ignore
                        return typeof window.Store !== 'undefined' && typeof window.Store.Chat !== 'undefined';
                    });

                    if (hasStore) {
                        this.log('Internal services detected, setting to READY');
                        this.status = 'READY';
                        return true;
                    }
                } catch (e) {
                    // Continue waiting
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return false;
    }

    /**
     * Send a message via WhatsApp
     */
    public async sendMessage(to: string, message: string, mediaPath?: string): Promise<{ success: boolean; error?: string }> {
        this.log('sendMessage called', { to, hasMedia: !!mediaPath });

        // Validate client exists
        if (!this.client) {
            return { success: false, error: 'WhatsApp client not initialized. Please connect in Admin Settings.' };
        }

        // Wait for ready state if authenticated
        if (this.status === 'AUTHENTICATED') {
            this.log('Waiting for ready state...');
            const isReady = await this.waitForReady(30000);
            if (!isReady) {
                return {
                    success: false,
                    error: 'WhatsApp session timed out waiting for ready state. Please try disconnecting and reconnecting in Admin Settings.'
                };
            }
        }

        // Check if we're ready to send
        if (this.status !== 'READY') {
            return {
                success: false,
                error: `WhatsApp is not ready to send messages. Current status: ${this.status}. Please connect in Admin Settings.`
            };
        }

        // Verify pupPage exists
        if (!this.client.pupPage) {
            return { success: false, error: 'WhatsApp browser session is not available. Please reconnect.' };
        }

        try {
            // Clean and validate phone number
            const number = to.replace(/\D/g, '');
            if (number.length < 10) {
                return { success: false, error: 'Invalid phone number format' };
            }

            this.log('Getting number ID for:', number);

            // Get the WhatsApp ID for this number
            const numberId = await this.client.getNumberId(number);

            if (!numberId) {
                return { success: false, error: `The number ${number} is not registered on WhatsApp.` };
            }

            const chatId = numberId._serialized;
            this.log('Sending to chatId:', chatId);

            // Send the message
            if (mediaPath && fs.existsSync(mediaPath)) {
                const media = MessageMedia.fromFilePath(mediaPath);
                await this.client.sendMessage(chatId, media, { caption: message });
            } else {
                await this.client.sendMessage(chatId, message);
            }

            this.log('Message sent successfully');
            return { success: true };

        } catch (error: any) {
            this.log('Send error:', error.message);

            // Handle common errors
            if (error.message?.includes('markedUnread') ||
                error.message?.includes('Cannot read properties') ||
                error.message?.includes('undefined')) {
                return {
                    success: false,
                    error: 'WhatsApp session error. Please disconnect and reconnect in Admin Settings.'
                };
            }

            return { success: false, error: error.message || 'Failed to send message' };
        }
    }

    /**
     * Cleanup client resources
     */
    private async cleanup() {
        this.log('Cleaning up client...');

        if (this.client) {
            try {
                await this.client.destroy();
            } catch (e) {
                this.log('Destroy error (ignored):', e);
            }
            this.client = null;
        }

        this.qrCode = null;
        this.initPromise = null;
    }

    /**
     * Logout and clear all session data
     */
    public async logout(): Promise<void> {
        this.log('Logout initiated...');

        // Try to properly logout from WhatsApp
        if (this.client) {
            try {
                await this.client.logout();
                this.log('Logged out from WhatsApp servers');
            } catch (e) {
                this.log('Logout error (may be already disconnected):', e);
            }
        }

        // Cleanup client
        await this.cleanup();

        // Clear auth cache
        const authPath = './.wwebjs_auth';
        try {
            if (fs.existsSync(authPath)) {
                this.log('Clearing auth cache...');
                fs.rmSync(authPath, { recursive: true, force: true });
                this.log('Auth cache cleared');
            }
        } catch (e) {
            this.log('Failed to clear auth cache:', e);
        }

        // Reset state
        this.status = 'DISCONNECTED';
        this.lastError = null;

        // Clear global singleton
        global.whatsappClient = undefined;

        this.log('Logout completed');
    }

    /**
     * Check if client is ready to send
     */
    public isReady(): boolean {
        return this.status === 'READY' && this.client !== null;
    }
}
