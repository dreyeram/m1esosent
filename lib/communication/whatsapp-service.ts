import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

// Global singleton for development hot reload
declare global {
    var whatsappService: WhatsAppService | undefined;
}

export type ConnectionStatus =
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'QR_READY'
    | 'AUTHENTICATED'
    | 'READY'
    | 'ERROR';

export interface MessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
}

export interface ServiceStatus {
    connection: ConnectionStatus;
    qrCode: string | null;
    lastPing: Date | null;
    uptime: number;
    messagesSent: number;
    messagesFailed: number;
    lastError: string | null;
}

/**
 * Pi5-optimized WhatsApp Service
 * Features:
 * - ARM-compatible Chromium configuration
 * - Memory-efficient settings
 * - Auto-reconnect on disconnect
 * - Health monitoring
 * - Retry logic with exponential backoff
 */
export class WhatsAppService {
    private client: Client | null = null;
    private status: ConnectionStatus = 'DISCONNECTED';
    private qrCode: string | null = null;
    private initPromise: Promise<void> | null = null;
    private startTime: Date | null = null;
    private messagesSent: number = 0;
    private messagesFailed: number = 0;
    private lastPing: Date | null = null;
    private lastError: string | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private isReconnecting: boolean = false;

    // Logging
    private logFile: string;

    constructor() {
        this.logFile = path.join(process.cwd(), 'whatsapp-service.log');
        this.status = 'DISCONNECTED';
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): WhatsAppService {
        if (!global.whatsappService) {
            console.log('[WhatsAppService] Creating new singleton instance');
            global.whatsappService = new WhatsAppService();
        }
        return global.whatsappService;
    }

    /**
     * Get current service status
     */
    public getStatus(): ServiceStatus {
        return {
            connection: this.status,
            qrCode: this.qrCode,
            lastPing: this.lastPing,
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            messagesSent: this.messagesSent,
            messagesFailed: this.messagesFailed,
            lastError: this.lastError
        };
    }

    /**
     * Log message to console and file
     */
    private log(message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [WhatsAppService] ${message}`;
        console.log(logMsg, data || '');

        try {
            fs.appendFileSync(this.logFile, `${logMsg} ${data ? JSON.stringify(data) : ''}\n`);
        } catch (e) {
            // Ignore file write errors
        }
    }

    /**
     * Get Chromium executable path for different platforms
     */
    private getChromiumPath(): string | undefined {
        // Pi5 / ARM Linux paths
        const armPaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/snap/bin/chromium'
        ];

        // Check for ARM/Linux
        if (process.platform === 'linux') {
            for (const p of armPaths) {
                if (fs.existsSync(p)) {
                    this.log('Using Chromium at:', p);
                    return p;
                }
            }
        }

        // Windows/Mac - let puppeteer use bundled chromium
        return undefined;
    }

    /**
     * Initialize WhatsApp client
     */
    public async initialize(): Promise<void> {
        // Already connecting
        if (this.initPromise && this.status === 'CONNECTING') {
            this.log('Already connecting, returning existing promise');
            return this.initPromise;
        }

        // Already ready
        if (this.status === 'READY') {
            this.log('Already ready');
            return;
        }

        // Cleanup any existing client
        if (this.client) {
            await this.cleanup();
        }

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    private async _doInitialize(): Promise<void> {
        this.log('Initializing WhatsApp client...');
        this.status = 'CONNECTING';
        this.lastError = null;
        this.qrCode = null;
        this.reconnectAttempts = 0;

        try {
            const chromiumPath = this.getChromiumPath();

            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'endoscopy-pi5',
                    dataPath: './.wwebjs_auth'
                }),
                puppeteer: {
                    headless: true,
                    executablePath: chromiumPath,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-extensions',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding',
                        '--disable-backgrounding-occluded-windows',
                        ...(process.platform === 'linux' ? [
                            '--single-process', // Only for Pi5/Linux
                            // Memory optimization for Pi5
                            '--js-flags=--max-old-space-size=256',
                            '--user-agent=Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        ] : [])
                    ],
                    timeout: 120000, // 2 minutes for slow Pi5 startup
                },
                authTimeoutMs: 180000, // 3 minutes
                qrMaxRetries: 5,
                takeoverOnConflict: true,
                takeoverTimeoutMs: 10000
            });

            this.setupEventListeners();
            await this.client.initialize();
            this.log('Client initialized successfully');

        } catch (error: any) {
            this.log('Initialization failed:', error.message);

            // Specific handling for "Navigating frame was detached"
            if (error.message.includes('detached') || error.message.includes('Protocol error')) {
                this.log('Frame detached error detected. This is common on first launch or slow systems.');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.log('Triggering immediate retry due to frame detach...');
                    this.cleanup().then(() => {
                        this.reconnectAttempts++;
                        // Short delay before retry
                        setTimeout(() => this.attemptReconnect(), 1000);
                    });
                    return; // Don't throw, let the retry handle it
                }
            }

            this.status = 'ERROR';
            this.lastError = error.message;
            this.initPromise = null;
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners() {
        if (!this.client) return;

        this.client.on('qr', (qr) => {
            this.log('QR Code received');
            this.qrCode = qr;
            this.status = 'QR_READY';
        });

        this.client.on('authenticated', () => {
            this.log('Authenticated');
            this.status = 'AUTHENTICATED';
            this.qrCode = null;

            // Start a watchdog to detect READY state even if the event doesn't fire
            // This is common with some WhatsApp Web versions
            let checks = 0;
            const checkReadyInterval = setInterval(async () => {
                if (this.status === 'READY' || !this.client || checks > 60) { // Stop after 60 checks (30s) or if ready
                    clearInterval(checkReadyInterval);
                    return;
                }

                checks++;
                try {
                    // Check if WWebJS has loaded the store
                    const isReady = await this.client.pupPage?.evaluate(() => {
                        // @ts-ignore
                        return typeof window.Store !== 'undefined' && typeof window.Store.Chat !== 'undefined';
                    });

                    if (isReady) {
                        this.log('Watchdog detected internal readiness, forcing READY status');
                        clearInterval(checkReadyInterval);
                        // @ts-ignore - Status might have changed externally, TS control flow is too strict here
                        if (this.status !== 'READY') { // distinct check to avoid double-firing if event happened simultaneously
                            this.status = 'READY';
                            this.startTime = new Date();
                            this.startHealthCheck();
                        }
                    }
                } catch (e) {
                    // Ignore errors during check (e.g. page navigation)
                }
            }, 500);
        });

        this.client.on('ready', () => {
            this.log('Client READY!');
            this.status = 'READY';
            this.qrCode = null;
            this.startTime = new Date();
            this.initPromise = null;
            this.reconnectAttempts = 0;

            // Start health monitoring
            this.startHealthCheck();
        });

        this.client.on('auth_failure', (msg) => {
            this.log('Auth failure:', msg);
            this.status = 'ERROR';
            this.lastError = 'Authentication failed: ' + msg;
            this.initPromise = null;
        });

        this.client.on('disconnected', async (reason) => {
            this.log('Disconnected:', reason);
            this.status = 'DISCONNECTED';
            this.stopHealthCheck();

            // Auto-reconnect
            if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.attemptReconnect();
            }
        });

        // @ts-ignore - Handle errors
        this.client.on('error', (err) => {
            this.log('Client error:', err);
            this.lastError = err?.message || 'Unknown error';
        });
    }

    /**
     * Start health check interval
     */
    private startHealthCheck() {
        this.stopHealthCheck();

        this.healthCheckInterval = setInterval(async () => {
            if (this.status === 'READY' && this.client) {
                try {
                    // Simple ping - check if puppeteer page is responsive
                    if (this.client.pupPage) {
                        await this.client.pupPage.evaluate(() => true);
                        this.lastPing = new Date();
                    }
                } catch (e) {
                    this.log('Health check failed:', e);
                    this.attemptReconnect();
                }
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop health check interval
     */
    private stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Attempt to reconnect
     */
    private async attemptReconnect() {
        if (this.isReconnecting) return;

        this.isReconnecting = true;
        this.reconnectAttempts++;

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        this.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            await this.cleanup();
            await this.initialize();
        } catch (e) {
            this.log('Reconnect failed:', e);
        } finally {
            this.isReconnecting = false;
        }
    }

    /**
     * Check if service is ready to send
     */
    private async ensureReady(): Promise<boolean> {
        if (this.status === 'READY') return true;

        // If authenticated, wait for ready with internal check
        if (this.status === 'AUTHENTICATED' && this.client?.pupPage) {
            this.log('Waiting for internal services...');

            for (let i = 0; i < 60; i++) { // 30 seconds max
                await new Promise(resolve => setTimeout(resolve, 500));

                if (this.status === 'READY') return true;

                try {
                    const hasStore = await this.client.pupPage.evaluate(() => {
                        // @ts-ignore
                        return typeof window.Store !== 'undefined' &&
                            // @ts-ignore
                            typeof window.Store.Chat !== 'undefined';
                    });

                    if (hasStore) {
                        this.log('Internal services detected, setting READY');
                        this.status = 'READY';
                        this.startHealthCheck();
                        return true;
                    }
                } catch (e) {
                    // Continue waiting
                }
            }
        }

        return false;
    }

    /**
     * Send a message with retry logic
     */
    public async sendMessage(
        phone: string,
        message: string,
        mediaPath?: string,
        maxRetries: number = 3
    ): Promise<MessageResult> {
        this.log('Send request:', { phone: phone.slice(-4), hasMedia: !!mediaPath });

        // Ensure ready
        const isReady = await this.ensureReady();
        if (!isReady) {
            this.messagesFailed++;
            return {
                success: false,
                error: `WhatsApp not ready. Status: ${this.status}`,
                timestamp: new Date()
            };
        }

        // Retry loop
        let lastError = '';
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this._sendMessageInternal(phone, message, mediaPath);
                if (result.success) {
                    this.messagesSent++;
                    return result;
                }
                lastError = result.error || 'Unknown error';
            } catch (e: any) {
                lastError = e.message || 'Send failed';
                this.log(`Send attempt ${attempt} failed:`, lastError);
            }

            if (attempt < maxRetries) {
                const delay = 1000 * attempt; // Linear backoff
                this.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        this.messagesFailed++;
        return {
            success: false,
            error: `Failed after ${maxRetries} attempts: ${lastError}`,
            timestamp: new Date()
        };
    }

    /**
     * Internal send message (single attempt)
     */
    private async _sendMessageInternal(
        phone: string,
        message: string,
        mediaPath?: string
    ): Promise<MessageResult> {
        if (!this.client) {
            return { success: false, error: 'Client not initialized', timestamp: new Date() };
        }

        // Clean phone number
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return { success: false, error: 'Invalid phone number', timestamp: new Date() };
        }

        // Verify number exists on WhatsApp
        const numberId = await this.client.getNumberId(cleanPhone);
        if (!numberId) {
            return {
                success: false,
                error: `${cleanPhone} is not on WhatsApp`,
                timestamp: new Date()
            };
        }

        const chatId = numberId._serialized;

        // Force load the chat to prevent "markedUnread" of undefined error
        // This ensures the chat object exists in the internal Store before sending
        try {
            const chat = await this.client.getChatById(chatId);
            // Optionally clear unread state if it exists to be safe
            await chat.sendSeen().catch(() => { });
        } catch (e) {
            this.log('Chat not found locally, it will be created upon sending.');
        }

        // Send message (with or without media)
        if (mediaPath && fs.existsSync(mediaPath)) {
            const media = MessageMedia.fromFilePath(mediaPath);
            const msg = await this.client.sendMessage(chatId, media, { caption: message });
            return { success: true, messageId: msg.id._serialized, timestamp: new Date() };
        } else {
            const msg = await this.client.sendMessage(chatId, message);
            return { success: true, messageId: msg.id._serialized, timestamp: new Date() };
        }
    }

    /**
     * Cleanup resources
     */
    private async cleanup() {
        this.log('Cleaning up...');
        this.stopHealthCheck();

        if (this.client) {
            try {
                await this.client.destroy();
            } catch (e) {
                this.log('Destroy error (ignored):', e);
            }
            this.client = null;
        }

        this.initPromise = null;
    }

    /**
     * Disconnect and clear session
     */
    public async disconnect(): Promise<void> {
        this.log('Disconnect requested');

        if (this.client) {
            try {
                await this.client.logout();
            } catch (e) {
                this.log('Logout error (ignored):', e);
            }
        }

        await this.cleanup();

        // Clear auth cache
        const authPath = './.wwebjs_auth';
        try {
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                this.log('Auth cache cleared');
            }
        } catch (e) {
            this.log('Failed to clear cache:', e);
        }

        this.status = 'DISCONNECTED';
        this.qrCode = null;
        this.lastError = null;
        this.startTime = null;
        this.messagesSent = 0;
        this.messagesFailed = 0;

        // Clear singleton
        global.whatsappService = undefined;

        this.log('Disconnect complete');
    }
}
