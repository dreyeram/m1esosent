/**
 * Centralized utility for resolving stored file paths to servable API URLs.
 * Handles uploads, data URIs, and external URLs.
 */
export function resolveImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // 1. Handle base64 / data URIs directly
    if (path.startsWith('data:')) return path;

    // 2. Handle absolute URLs (http/https)
    if (path.startsWith('http')) return path;

    // 3. Handle paths that are already prefixed with our API
    if (path.startsWith('/api/capture-serve')) return path;

    // 4. Normalize slashes for Windows compatibility
    const cleanPath = path.replace(/\\/g, '/');

    // 5. Ensure we don't have leading slashes that confuse the API 'path' param
    const relativePath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    // 6. Return the resolved API URL
    return `/api/capture-serve?path=${encodeURIComponent(relativePath)}`;
}
