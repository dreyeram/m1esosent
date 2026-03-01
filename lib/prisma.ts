/**
 * Prisma Client - Optimized for Pi5
 * 
 * Medical-grade database connection with:
 * - WAL mode for concurrent reads
 * - Optimized cache settings
 * - Connection pooling (single instance)
 */

import { PrismaClient } from "@prisma/client";

// Declare global type for Prisma client singleton
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

/**
 * Create optimized Prisma client
 */
function createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["error"],
    });

    // Execute SQLite PRAGMAs for optimization
    if (process.env.NODE_ENV === "production") {
        (async () => {
            try {
                // WAL mode returns a string, so we must use $queryRawUnsafe
                await client.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
                // Others are commands
                await client.$executeRawUnsafe(`
                    PRAGMA synchronous = NORMAL;
                    PRAGMA cache_size = -65536;
                    PRAGMA mmap_size = 268435456;
                    PRAGMA temp_store = MEMORY;
                    PRAGMA busy_timeout = 5000;
                `);
            } catch (err) {
                console.warn("Failed to set SQLite PRAGMAs:", err);
            }
        })();
    }

    return client;
}

/**
 * Get or create Prisma client singleton
 */
export const prisma = globalThis.prisma ?? createPrismaClient();

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
    connected: boolean;
    responseTime: number;
    error?: string;
}> {
    const start = Date.now();

    try {
        // Simple query to check connection
        await prisma.$queryRaw`SELECT 1`;

        return {
            connected: true,
            responseTime: Date.now() - start,
        };
    } catch (error) {
        return {
            connected: false,
            responseTime: Date.now() - start,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
    patients: number;
    procedures: number;
    reports: number;
    media: number;
}> {
    const [patients, procedures, reports, media] = await Promise.all([
        prisma.patient.count({ where: { deletedAt: null } }),
        prisma.procedure.count(),
        prisma.report.count(),
        prisma.media.count(),
    ]);

    return { patients, procedures, reports, media };
}
