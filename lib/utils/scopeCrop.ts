/**
 * Scope Cropping Utility
 * 
 * Helper functions to consistently apply the circular scope mask
 * across Capture, Video Thumbnails, and Reports.
 */

interface ScopeSettings {
    scale: number;
    x: number;
    y: number;
}

/**
 * Applies a circular crop to a canvas based on scope settings.
 * Returns a Data URL of the cropped image (image/jpeg).
 * 
 * @param sourceCanvas The source canvas containing the full frame (or video frame)
 * @param settings The current scope settings (scale, x, y)
 * @param quality JPEG quality (0-1)
 * @param outputSize Optional fixed output size (default: source height, ensuring square)
 */
export const cropScopeToDataURL = (
    source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
    settings: ScopeSettings,
    quality: number = 0.9,
    outputSize?: number
): string => {
    // 1. Determine Dimensions
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    // Default size is the height of the source (assuming landscape video)
    // or the explicitly provided output size
    const size = outputSize || Math.min(srcW, srcH);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // 2. Clear Background (Transparent)
    ctx.clearRect(0, 0, size, size);

    // 3. Create Circular Mask
    ctx.beginPath();
    // Center of the OUTPUT canvas
    const cx = size / 2;
    const cy = size / 2;
    // Radius logic: Matches ProcedureMode.tsx CSS radius (42%)
    // Base radius = 42% of size * settings.scale
    const radius = (size * 0.42) * (settings.scale || 1.0);

    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // 4. Draw Source
    // We need to map the "Center" of the source video to the "Center" of our output canvas.
    // Plus apply the X/Y offsets from settings.

    // Source Center
    const srcCX = srcW / 2;
    const srcCY = srcH / 2;

    // Offset applied to source reading position
    // If settings.x is +10, we want to shift the view right, so we subtract from source X? 
    // Or shift the image right? Usually "Position" controls move the image.
    // Let's assume settings.x moves the circle center relative to the video.
    // Actually, physically moving the mask is easier to think about.
    // But we are cropping.

    // Let's stick to: We draw the source image CENTERED on the canvas, then shifted by offsets.

    // Destination Draw Coords:
    // We want the source center (srcCX, srcCY) to align with output center (cx, cy).
    const drawW = srcW; // Draw full resolution? 
    // Or do we scale the source? 
    // Usually we just want 1:1 pixel mapping if possible, or scaled to fit.
    // If we are capturing 1080p, size is 1080. 

    // Scaling source to match output height if needed
    // If source is 3840x2160 and output is 1080x1080, we should scale source down?
    // Or just crop center 2160? 
    // For "HD" capture, we probably want to preserve max detail. 
    // If outputSize is set to 1080, we scale.

    // Let's rely on drawImage to handle scaling if source dimensions differ from intended draw dimensions.
    // But usually we assume source video height ~= output size.

    // Calculate draw position to center the video
    // dx = cx - srcCX + settings.x
    // dy = cy - srcCY + settings.y
    // WAIT: settings.x/y are usually "percentage" offsets in other apps, but here we might want pixels?
    // Let's standardise on PIXELS relative to the source resolution? Or standard reference?
    // If we use pixels, it breaks when resolution changes (4k vs 1080p).
    // Let's use PERCENTAGE of the output size.

    const offsetX = (settings.x / 100) * size;
    const offsetY = (settings.y / 100) * size;

    const dstX = cx - (srcW / 2) + offsetX;
    const dstY = cy - (srcH / 2) + offsetY;

    // But wait, if we scale the source to fit the height?
    const scaleFactor = size / srcH; // Fit height
    const scaledW = srcW * scaleFactor;
    const scaledH = srcH * scaleFactor;

    const finalDstX = cx - (scaledW / 2) + offsetX;
    const finalDstY = cy - (scaledH / 2) + offsetY;

    ctx.drawImage(source, finalDstX, finalDstY, scaledW, scaledH);

    return canvas.toDataURL('image/jpeg', quality);
};
