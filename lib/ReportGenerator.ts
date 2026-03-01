import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { resolveImageUrl } from './utils/image';

// --- Types ---
export interface ReportSegment {
    procedureId: string;
    procedureType: string;
    title: string;
    formData: any;
    selectedImages: (string | { url: string; caption?: string })[];
    imageCaptions: Record<string, string>;
    captures: any[];
    equipment?: { name: string; type: string; serialNumber?: string }[];
    prescriptions?: { name: string; generic: string; dosage: string; frequency: string; duration: string; instruction: string }[];
}

export interface ReportData {
    patient: any;
    doctor: any;
    hospital: any;
    segments: ReportSegment[];
    action?: 'download' | 'preview' | 'print' | 'share';
}

// --- CONFIG ---
const IMG_QUALITY = 1.0; // Max visual quality for printing
const COMPRESSION = 'SLOW'; // Best quality retention in jsPDF

// --- Helper: Load Image as base64 (CORS-safe via fetch) ---
const loadImage = (url: string, circleMask = false): Promise<{ base64: string; w: number; h: number; error?: string } | null> => {
    return new Promise(async (resolve) => {
        if (!url) { resolve({ base64: '', w: 0, h: 0, error: 'No URL' }); return; }

        try {
            // Helper to process image on canvas
            const processImage = (img: HTMLImageElement) => {
                let w = img.width, h = img.height;
                const MAX = 2400; // High resolution limit for crisp printing

                // Determine output size (always square if circle mask)
                let canvasW = w, canvasH = h;
                if (circleMask) {
                    canvasW = canvasH = Math.max(w, h);
                    if (canvasW > MAX) canvasW = canvasH = MAX;
                } else {
                    if (w > MAX || h > MAX) {
                        const r = w / h;
                        if (w > h) { canvasW = MAX; canvasH = Math.round(MAX / r); }
                        else { canvasH = MAX; canvasW = Math.round(MAX * r); }
                    }
                }

                const c = document.createElement('canvas');
                c.width = canvasW; c.height = canvasH;
                const ctx = c.getContext('2d');
                if (!ctx) return { base64: url, w, h };

                // 1. Fill background with white (removes black surroundings on A4)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvasW, canvasH);

                if (circleMask) {
                    // 2. Apply Circular Clip
                    ctx.beginPath();
                    ctx.arc(canvasW / 2, canvasH / 2, canvasW / 2, 0, Math.PI * 2);
                    ctx.clip();

                    // 3. Fit (Contain) Logic
                    const ratio = w / h;
                    let drawW, drawH;
                    if (ratio > 1) { // Wide
                        drawW = canvasW;
                        drawH = drawW / ratio;
                    } else { // Tall
                        drawH = canvasH;
                        drawW = drawH * ratio;
                    }
                    ctx.drawImage(img, (canvasW - drawW) / 2, (canvasH - drawH) / 2, drawW, drawH);
                } else {
                    ctx.drawImage(img, 0, 0, canvasW, canvasH);
                }

                try {
                    return { base64: c.toDataURL('image/jpeg', IMG_QUALITY), w: canvasW, h: canvasH };
                } catch {
                    return { base64: url, w, h };
                }
            };

            // Load as data URL or fetch
            let finalUrl = url;
            if (!url.startsWith('data:')) {
                const fetchUrl = url.startsWith('/') ? window.location.origin + url : url;
                const response = await fetch(fetchUrl, { cache: 'no-store', credentials: 'include' });
                if (!response.ok) {
                    resolve({ base64: '', w: 100, h: 100, error: `Error ${response.status}` });
                    return;
                }
                const blob = await response.blob();
                finalUrl = await new Promise((res) => {
                    const r = new FileReader();
                    r.onloadend = () => res(r.result as string);
                    r.readAsDataURL(blob);
                });
            }

            const img = new Image();
            img.onload = () => resolve(processImage(img));
            img.onerror = () => resolve({ base64: '', w: 100, h: 100, error: 'Load Failed' });
            img.src = finalUrl;
        } catch (e: any) {
            resolve({ base64: '', w: 100, h: 100, error: e.message || 'Error' });
        }
    });
};

// ══════════════════════════════════════════════════════════════
// MAIN PDF GENERATOR — Single A4 Page Per Segment
// ══════════════════════════════════════════════════════════════

export const generatePDF = async (data: ReportData): Promise<Blob> => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const { patient, doctor, hospital, segments } = data;

    // Resolve doctor name (page.tsx sends `name`, editor sends `fullName`)
    const rawDoctorName = doctor?.fullName || doctor?.name || 'Doctor';
    const doctorName = rawDoctorName.replace(/^dr\.?\s*/i, '').trim() || rawDoctorName;
    const doctorDegree = doctor?.degree ? `, ${doctor.degree}` : '';
    const doctorRole = doctor?.role || 'Consultant Specialist';

    const PW = 210;   // page width
    const PH = 297;   // page height
    const M = 10;      // margin
    const CW = PW - M * 2; // content width

    // Colors
    const C = {
        black: [24, 24, 27] as [number, number, number],
        dark: [39, 39, 42] as [number, number, number],
        mid: [82, 82, 91] as [number, number, number],
        label: [113, 113, 122] as [number, number, number],
        muted: [161, 161, 170] as [number, number, number],
        line: [220, 220, 225] as [number, number, number],
        bg: [248, 248, 250] as [number, number, number],
        blue: [30, 58, 138] as [number, number, number], // #1E3A8A
        blueLight: [37, 99, 235] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        errorBg: [254, 226, 226] as [number, number, number], // Red-100
        errorText: [185, 28, 28] as [number, number, number]  // Red-700
    };

    // ── Shared Helpers ──
    const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
    const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
    const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

    // ── Header: Table-Style Medical Letterhead ──
    const drawHeader = async (seg?: ReportSegment): Promise<number> => {
        let y = M;
        const rx = PW - M;

        // Border removed
        // Let's calculate the content first.
        const boxTop = y;

        // 1. Hospital Branding (Top Row)
        const topRowY = y + 4;
        let logoLoaded = false;
        const maxLogoHeight = 14;
        let finalLogoWidth = 14;

        if (hospital?.logoPath) {
            try {
                const logoUrl = resolveImageUrl(hospital.logoPath);
                if (logoUrl) {
                    const logoData = await loadImage(logoUrl, false);
                    if (logoData && logoData.base64 && !logoData.error) {
                        const imgAspect = (logoData.w || 100) / (logoData.h || 100);
                        finalLogoWidth = maxLogoHeight * imgAspect;
                        let finalLogoHeight = maxLogoHeight;
                        const maxAllowedWidth = 60;
                        if (finalLogoWidth > maxAllowedWidth) {
                            finalLogoWidth = maxAllowedWidth;
                            finalLogoHeight = maxAllowedWidth / imgAspect;
                        }
                        // Center vertically within the 14mm constrained row
                        const yOffset = topRowY + (maxLogoHeight - finalLogoHeight) / 2;
                        doc.addImage(logoData.base64, 'JPEG', M, yOffset, finalLogoWidth, finalLogoHeight, undefined, COMPRESSION);
                        logoLoaded = true;
                    }
                }
            } catch (e) {
                console.warn('Failed to load org logo for PDF:', e);
            }
        }

        if (!logoLoaded) {
            const firstLetter = (hospital?.name || 'M').charAt(0).toUpperCase();
            setFill(C.blue);
            doc.circle(M + 10, topRowY + 7, 7, 'F');
            setColor(C.white);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
            doc.text(firstLetter, M + 10, topRowY + 12, { align: 'center' });
        }

        // Hospital Name & Address (Middle-left)
        const textX = M + finalLogoWidth + 8;
        setColor(C.black);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); // Downsized to prevent overlap
        doc.text((hospital?.name || 'PREDISCAN HOSPITAL').toUpperCase(), textX, topRowY + 5);

        setColor(C.black); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        doc.text(hospital?.address || 'IITM Research Park, Chennai', textX, topRowY + 10.5);

        // Contact Info (Right)
        setColor(C.black); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        if (hospital?.mobile || hospital?.phone) {
            doc.text(`Contact: ${hospital?.mobile || hospital?.phone || '+91 7339286710'}`, rx - 4, topRowY + 5, { align: 'right' });
        }
        if (hospital?.contactEmail || hospital?.email || hospital?.contactEmail !== undefined) {
            doc.text(`Mail:  ${hospital?.contactEmail || hospital?.email || 'prediscan@gmail.com'}`, rx - 4, topRowY + 10.5, { align: 'right' });
        }

        y = topRowY + 16;

        // Horizontal Divider
        setDraw([30, 30, 30]); doc.setLineWidth(0.4);
        doc.line(M, y, rx, y);

        // 2. Bottom Row: Patient Demographics Table & Report Info
        y += 4;
        const gridStartX = M;
        const labelW = 20;
        const colonX = gridStartX + labelW;
        const valX = colonX + 3;
        let pY = y;

        const drawRow = (label: string, value: string) => {
            setColor([60, 60, 65]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
            doc.text(label, gridStartX, pY + 3);
            setColor([30, 30, 30]); doc.text(':', colonX, pY + 3);
            doc.setFont('helvetica', 'bold');
            doc.text(value, valX, pY + 3);
            pY += 4.5;
        };

        drawRow('MRN No', patient?.mrn || 'N/A');
        drawRow('Name', (patient?.fullName || patient?.name || 'PATIENT').toUpperCase());
        drawRow('Age/Sex', `${patient?.age || '--'} Years/${patient?.gender || '--'}`);
        drawRow('Address', (patient?.address || 'N/A').toUpperCase());

        const rd = new Date();
        const repDateStr = `${rd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ')}/${rd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        drawRow('Report Date', repDateStr.toUpperCase());
        drawRow('Ref', (patient?.referringDoctor || 'N/A').toUpperCase());

        // Right side: Blue Pill & Doctor Info
        // Blue Pill
        const pillW = 80;
        const pillH = 7;
        const pillX = rx - pillW;
        const pillY = y + 1;
        setFill([31, 58, 138]); // Deep blue
        doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'F');

        setColor(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
        const reportTitle = (seg?.title || 'DIAGNOSTIC NASAL ENDOSCOPY REPORT').toUpperCase();
        doc.text(reportTitle, pillX + pillW / 2, pillY + 5.2, { align: 'center' });

        // Doctor Details
        const drY = pillY + pillH + 6;

        const doctorRole = doctor?.role || 'Consultant Specialist';
        const doctorDegree = doctor?.degree ? `, ${doctor.degree}` : '';
        const hasDrPrefix = doctorName.toLowerCase().startsWith('dr');
        const formattedDrName = hasDrPrefix ? doctorName : `Dr. ${doctorName}`;

        const docNameStr = `${formattedDrName}${doctorDegree}`;
        // Calculate text width to properly align the 'Consultant Name :' label
        const docNameWidth = doc.getStringUnitWidth(docNameStr) * 8.5 / doc.internal.scaleFactor;

        setColor([60, 60, 65]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('Consultant Name :', rx - docNameWidth - 2, drY + 3, { align: 'right' });

        setColor(C.black); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        doc.text(docNameStr, rx, drY + 3, { align: 'right' });

        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text(doctorRole, rx, drY + 8, { align: 'right' });

        const headerBottom = Math.max(pY, drY + 10) + 2;

        return headerBottom + 6;
    };

    // ── Footer: Signature Block ──
    const drawFooter = async () => {
        const fy = PH - 25; // Moved further down to prevent overlap
        const rx = PW - M;

        // Try to load and render signature image
        let signatureDrawn = false;
        if (doctor?.signaturePath || doctor?.sign) {
            try {
                const sigPath = doctor.signaturePath || doctor.sign;
                const sigUrl = resolveImageUrl(sigPath);
                if (sigUrl) {
                    const sigData = await loadImage(sigUrl, false);
                    if (sigData && sigData.base64 && !sigData.error) {
                        const maxH = 10;
                        const maxW = 40;
                        const aspect = (sigData.w || 100) / (sigData.h || 50);
                        let drawW = maxH * aspect;
                        let drawH = maxH;
                        if (drawW > maxW) { drawW = maxW; drawH = maxW / aspect; }
                        const sigX = rx - drawW;
                        const sigY = fy + 8 - drawH;
                        doc.addImage(sigData.base64, 'PNG', sigX, sigY, drawW, drawH, undefined, COMPRESSION);
                        signatureDrawn = true;
                    }
                }
            } catch (e) {
                console.warn('Failed to load signature for PDF:', e);
            }
        }

        // Signature dashed line
        setDraw([180, 180, 185]); doc.setLineWidth(0.3); doc.setLineDashPattern([2, 2], 0);
        doc.line(rx - 50, fy + 8, rx, fy + 8);
        doc.setLineDashPattern([], 0);

        if (!signatureDrawn) {
            setColor([200, 200, 205]); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
            doc.text('SIGNATURE PLACEHOLDER', rx - 25, fy + 6.5, { align: 'center' });
        }

        setColor(C.black); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        const hasDrPrefix = doctorName.toLowerCase().startsWith('dr');
        const formattedDrName = hasDrPrefix ? doctorName : `Dr. ${doctorName}`;
        doc.text(`${formattedDrName}${doctorDegree}`, rx, fy + 13, { align: 'right' });

        setColor(C.label); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text(doctorRole, rx, fy + 17, { align: 'right' });
    };

    // ══════════════════════════════════════════════════════════
    // SEGMENT LOOP
    // ══════════════════════════════════════════════════════════
    for (let si = 0; si < segments.length; si++) {
        if (si > 0) doc.addPage();
        const seg = segments[si];

        // 1. Preload images
        const loadedImages: { base64: string; w: number; h: number; caption: string; error?: string }[] = [];
        for (const input of seg.selectedImages) {
            let url = '', caption = '';
            if (typeof input === 'string') {
                // ID reference → look up in captures
                const found = seg.captures?.find((x: any) => x.id === input);
                if (found) { url = found.url; caption = seg.imageCaptions?.[input] || ''; }
            } else {
                // Direct object with url
                url = input.url || '';
                caption = input.caption || '';
            }
            // Always try to load, even if URL is empty (loadImage handles it)
            const resolvedUrl = resolveImageUrl(url);
            const loaded = await loadImage(resolvedUrl || '', true); // apply circle mask
            if (loaded) loadedImages.push({ ...loaded, caption });
        }

        let y = await drawHeader();

        // Removed duplicate Report Title string since it's already generated within the blue pill
        y += 2;

        // ── Two Column Layout ──
        const gap = 4;
        const leftW = CW * 0.62;
        const rightW = CW - leftW - gap;
        const rightX = M + leftW + gap;
        const contentStartY = y;

        // ────────────────────────────────────────────
        // RIGHT COLUMN: Images (max 6, compact)
        // ────────────────────────────────────────────
        let imgY = contentStartY;
        const maxFooterY = PH - 35; // Reserve footer space / Prevent overwrite
        const maxImages = Math.min(loadedImages.length, 6);

        for (let i = 0; i < maxImages; i++) {
            const img = loadedImages[i];

            // Diameter of circular frame
            const diameter = rightW - 2;
            const radius = diameter / 2;

            // Cap height to fit remaining space for 6 images
            const remainingSpace = maxFooterY - imgY - (maxImages - i) * 6;
            const maxH = Math.min(remainingSpace / (maxImages - i), 38);
            const frameH = Math.max(Math.min(diameter, maxH), 12); // Minimum 12mm size
            const frameW = frameH; // Square frame for circle

            const xOff = (rightW - frameW) / 2;
            const cx = rightX + xOff + frameW / 2;
            const cy = imgY + frameH / 2;

            if (img.error) {
                // Render Error Placeholder
                setFill(C.errorBg);
                doc.circle(cx, cy, frameH / 2, 'F');
                setDraw(C.errorText);
                doc.circle(cx, cy, frameH / 2, 'S');

                setColor(C.errorText); doc.setFontSize(5);
                doc.text("Error", cx, cy, { align: 'center' });
            } else {
                try {
                    // Draw Image (already masked and scaled by canvas)
                    doc.addImage(img.base64, 'JPEG', xOff + rightX, imgY, frameW, frameH, undefined, COMPRESSION);

                    // Small index badge
                    setFill(C.black);
                    const bx = cx - frameW / 2 + 1;
                    const by = cy - frameH / 2 + 1;
                    doc.roundedRect(bx, by, 4, 3, 1, 1, 'F');
                    setColor(C.white); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                    doc.text(`${i + 1}`, bx + 2, by + 2.2, { align: 'center' });

                } catch (e: any) {
                    console.warn('PDF image error', e);
                    setDraw(C.line);
                    doc.circle(cx, cy, frameH / 2, 'S');
                    setColor(C.muted); doc.setFontSize(6);
                    doc.text("Render Error", cx, cy, { align: 'center' });
                }
            }

            imgY += frameH + 3;

            const defaultCaption = `Fig ${i + 1}`;
            const displayCaption = img.caption ? `${defaultCaption}: ${img.caption}` : defaultCaption;

            setColor(C.muted); doc.setFont('helvetica', 'italic'); doc.setFontSize(5.5);
            // Wrap caption if too long
            const captionLines = doc.splitTextToSize(displayCaption, rightW - 2);
            doc.text(captionLines, rightX + rightW / 2, imgY, { align: 'center' });
            imgY += captionLines.length * 2.5 + 1;
        }


        // ────────────────────────────────────────────
        // LEFT COLUMN: Form fields
        // ────────────────────────────────────────────
        let textY = contentStartY;
        const sections = seg.formData?.printableSections || [];
        const labelCol = M;
        const valCol = M + 40;
        const valWidth = leftW - 40;

        for (const section of sections) {
            const hasData = section.items?.some((it: any) =>
                it.value && String(it.value).trim() && it.value !== 'undefined'
            );
            if (!hasData) continue;

            // Section heading
            setColor(C.dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
            doc.text(section.title.toUpperCase(), labelCol, textY);

            // Underline heading
            const titleWidth = doc.getStringUnitWidth(section.title.toUpperCase()) * 7.5 / doc.internal.scaleFactor;
            setDraw(C.mid); doc.setLineWidth(0.2);
            doc.line(labelCol, textY + 1.5, labelCol + titleWidth, textY + 1.5);

            textY += 4;

            for (const item of section.items) {
                const val = String(item.value || '');
                if (!val || val === 'undefined' || !val.trim()) continue;

                // Label
                setColor(C.label); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
                doc.text(item.label + ':', labelCol + 2, textY);

                // Value rendering
                if (item.type === 'bilateral' && item.rawValue) {
                    const rv = String(item.rawValue.right || '—');
                    const lv = String(item.rawValue.left || '—');
                    const halfW = valWidth / 2;

                    // Right side
                    setColor(C.blue); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
                    doc.text('R:', valCol, textY);

                    setColor(C.black); doc.setFont('times', 'normal'); doc.setFontSize(8.5);
                    const rLines = doc.splitTextToSize(rv, halfW - 6);
                    doc.text(rLines, valCol + 6, textY);

                    // Left side
                    setColor(C.blue); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
                    doc.text('L:', valCol + halfW, textY);

                    setColor(C.black); doc.setFont('times', 'normal'); doc.setFontSize(8.5);
                    const lLines = doc.splitTextToSize(lv, halfW - 6);
                    doc.text(lLines, valCol + halfW + 6, textY);

                    textY += Math.max(rLines.length, lLines.length) * 3.5 + 1;
                } else {
                    // Standard Value
                    setColor(C.black); doc.setFont('times', 'normal'); doc.setFontSize(8.5);
                    const lines = doc.splitTextToSize(val, valWidth);
                    doc.text(lines, valCol, textY);
                    textY += lines.length * 3.5 + 1;
                }

                // Safety: don't overflow into footer
                if (textY > maxFooterY - 3) break;
            }
            textY += 2;
            if (textY > maxFooterY - 3) break;
        }

        // ── Prescription (compact, below form fields) ──
        let bottomY = Math.max(textY, imgY) + 2;

        if (seg.prescriptions && seg.prescriptions.length > 0 && bottomY < maxFooterY - 10) {
            let rxY = bottomY;

            setColor(C.blue); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
            doc.text('PRESCRIPTION / RX', M, rxY);

            // Underline heading
            const titleWidth = doc.getStringUnitWidth('PRESCRIPTION / RX') * 7.5 / doc.internal.scaleFactor;
            setDraw(C.mid); doc.setLineWidth(0.2);
            doc.line(M, rxY + 1.5, M + titleWidth, rxY + 1.5);

            rxY += 4;

            for (const rx of seg.prescriptions) {
                if (rxY > maxFooterY - 4) break;

                setColor(C.black); doc.setFont('times', 'bold'); doc.setFontSize(7.5);
                const medName = rx.name || 'Medicine';
                doc.text(medName, M, rxY);

                setColor(C.muted); doc.setFont('times', 'italic'); doc.setFontSize(6);
                doc.text(`(${rx.generic || ''})`, M + doc.getTextWidth(medName) + 1.5, rxY);

                setColor(C.mid); doc.setFont('times', 'normal'); doc.setFontSize(7);
                doc.text(`${rx.dosage || ''} • ${rx.frequency || ''} • ${rx.duration || ''}`, M + 60, rxY);

                if (rx.instruction) {
                    doc.text(rx.instruction, M + 110, rxY);
                }
                rxY += 3.5;
            }
        }

        await drawFooter();
    }

    // Output
    if (data.action === 'download') {
        doc.save(`${patient?.fullName || patient?.name || 'Report'}_Report.pdf`);
    } else if (data.action === 'print') {
        return doc.output('blob');
    }
    return doc.output('blob');
};
