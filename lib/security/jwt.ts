/**
 * JWT Token Management - Medical Grade
 * 
 * Handles generation and verification of JWT tokens for session management.
 * Tokens are stored in HTTP-only cookies for XSS protection.
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { JWT_CONFIG } from './constants';
import type { Role } from './constants';

// Secret key - in production, this should be from environment or secure key storage
const JWT_SECRET = process.env.JWT_SECRET || 'endoscopy-suite-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'endoscopy-suite-refresh-secret-change-in-production';

/**
 * Token payload structure
 */
export interface TokenPayload {
    userId: string;
    username: string;
    role: Role;
    organizationId: string;
    fullName: string;
}

/**
 * Decoded token with JWT standard claims
 */
export interface DecodedToken extends TokenPayload, JwtPayload {
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}

/**
 * Token pair returned from authentication
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds until access token expires
}

/**
 * Generate an access token
 * @param payload - User data to encode in the token
 * @returns Signed JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
        algorithm: JWT_CONFIG.ALGORITHM,
    };

    return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a refresh token
 * @param payload - User data to encode in the token
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
        algorithm: JWT_CONFIG.ALGORITHM,
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

/**
 * Generate both access and refresh tokens
 * @param payload - User data to encode
 * @returns TokenPair with both tokens
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: 15 * 60, // 15 minutes in seconds
    };
}

/**
 * Verify and decode an access token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyAccessToken(token: string): DecodedToken | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_CONFIG.ISSUER,
            audience: JWT_CONFIG.AUDIENCE,
            algorithms: [JWT_CONFIG.ALGORITHM],
        }) as DecodedToken;

        return decoded;
    } catch {
        return null;
    }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: JWT_CONFIG.ISSUER,
            audience: JWT_CONFIG.AUDIENCE,
            algorithms: [JWT_CONFIG.ALGORITHM],
        }) as DecodedToken;

        return decoded;
    } catch {
        return null;
    }
}

/**
 * Check if a token is about to expire (within 2 minutes)
 * @param token - Decoded token to check
 * @returns true if token expires soon
 */
export function isTokenExpiringSoon(token: DecodedToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = token.exp - now;
    return expiresIn < 120; // Less than 2 minutes
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
