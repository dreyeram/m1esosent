/**
 * Next.js Middleware - Medical Grade Route Protection
 * 
 * Protects routes based on authentication and role-based access.
 * Redirects unauthenticated users to login page.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, JWT_CONFIG, hasPermission, type Role } from '@/lib/security';

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
    '/login',
    '/setup',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
];

/**
 * Static assets that should be ignored
 */
const STATIC_PATTERNS = [
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
];

/**
 * Route permissions mapping
 */
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    '/admin': ['*'], // Admin only
    '/settings': ['settings:read'],
    '/settings/organization': ['settings:update'],
    '/settings/danger': ['*'], // Admin only
};

/**
 * Check if path matches any patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => path.startsWith(pattern));
}

/**
 * Check if route requires specific permissions
 */
function getRequiredPermissions(path: string): string[] | null {
    for (const [route, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
        if (path.startsWith(route)) {
            return permissions;
        }
    }
    return null;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets
    if (matchesPattern(pathname, STATIC_PATTERNS)) {
        return NextResponse.next();
    }

    // Skip public routes
    if (matchesPattern(pathname, PUBLIC_ROUTES)) {
        return NextResponse.next();
    }

    // Get access token from cookies
    const accessToken = request.cookies.get(JWT_CONFIG.ACCESS_COOKIE_NAME)?.value;

    // No token - redirect to login
    if (!accessToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
        // Invalid token - clear cookie and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(JWT_CONFIG.ACCESS_COOKIE_NAME);
        response.cookies.delete(JWT_CONFIG.REFRESH_COOKIE_NAME);
        return response;
    }

    // Check route-specific permissions
    const requiredPermissions = getRequiredPermissions(pathname);

    if (requiredPermissions) {
        const userRole = decoded.role as Role;
        const hasAccess = requiredPermissions.every(perm =>
            hasPermission(userRole, perm)
        );

        if (!hasAccess) {
            // User doesn't have permission - redirect to dashboard with error
            const dashboardUrl = new URL('/', request.url);
            dashboardUrl.searchParams.set('error', 'access_denied');
            return NextResponse.redirect(dashboardUrl);
        }
    }

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-user-name', decoded.fullName);
    requestHeaders.set('x-org-id', decoded.organizationId);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, fonts, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
    ],
};
