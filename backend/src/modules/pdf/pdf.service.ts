import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db, schema, eq } from '@asthiwar/database';
import { estimateRefCandidates } from '../calculator/quotation.js';

const LOGO_FILE = fileURLToPath(
  new URL('../../../assets/brand/asthiwar-logo-duotone.png', import.meta.url)
);
const LOGO_FALLBACK = path.resolve(process.cwd(), 'assets/brand/asthiwar-logo-duotone.png');
const LOGO_PATH = existsSync(LOGO_FILE)
  ? LOGO_FILE
  : existsSync(LOGO_FALLBACK)
  ? LOGO_FALLBACK
  : undefined;

// Satoshi Font Family resolution (TrueType for PDFKit subsetting & vector glyph outlines)
const FONT_REGULAR_FILE = fileURLToPath(
  new URL('../../../assets/fonts/Satoshi-Regular.ttf', import.meta.url)
);
const FONT_REGULAR_FALLBACK = path.resolve(process.cwd(), 'assets/fonts/Satoshi-Regular.ttf');
const FONT_REGULAR_PATH = existsSync(FONT_REGULAR_FILE)
  ? FONT_REGULAR_FILE
  : existsSync(FONT_REGULAR_FALLBACK)
  ? FONT_REGULAR_FALLBACK
  : undefined;

const FONT_MEDIUM_FILE = fileURLToPath(
  new URL('../../../assets/fonts/Satoshi-Medium.ttf', import.meta.url)
);
const FONT_MEDIUM_FALLBACK = path.resolve(process.cwd(), 'assets/fonts/Satoshi-Medium.ttf');
const FONT_MEDIUM_PATH = existsSync(FONT_MEDIUM_FILE)
  ? FONT_MEDIUM_FILE
  : existsSync(FONT_MEDIUM_FALLBACK)
  ? FONT_MEDIUM_FALLBACK
  : undefined;

const FONT_BOLD_FILE = fileURLToPath(
  new URL('../../../assets/fonts/Satoshi-Bold.ttf', import.meta.url)
);
const FONT_BOLD_FALLBACK = path.resolve(process.cwd(), 'assets/fonts/Satoshi-Bold.ttf');
const FONT_BOLD_PATH = existsSync(FONT_BOLD_FILE)
  ? FONT_BOLD_FILE
  : existsSync(FONT_BOLD_FALLBACK)
  ? FONT_BOLD_FALLBACK
  : undefined;

const HAS_SATOSHI = !!(FONT_REGULAR_PATH && FONT_BOLD_PATH);
export const FONT_REG = HAS_SATOSHI ? 'Satoshi' : 'Helvetica';
export const FONT_MED = HAS_SATOSHI && FONT_MEDIUM_PATH ? 'Satoshi-Medium' : (HAS_SATOSHI ? 'Satoshi' : 'Helvetica');
export const FONT_BLD = HAS_SATOSHI ? 'Satoshi-Bold' : 'Helvetica-Bold';

export class PdfGenerationError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

// Color palette matching ASTHIWAR design tokens & brand identity
const CARBON = '#19241D';          // ASTHIWAR forest deep / carbon
const CARBON_SURFACE = '#243228';  // Carbon surface / badge ground
const OXIDE = '#B8854F';           // Warm architectural oxide
const OXIDE_DEEP = '#76522F';      // Deep oxide accent
const OXIDE_WASH = '#F9F5EE';      // Subtle warm oxide highlight — letterhead cream ground
const PAPER = '#EFEAE3';           // On-accent architectural paper
const CARD_BG = '#F7F5F0';         // Warm card & section fill
const ROW_ALT_BG = '#FAF8F5';      // Subtle warm zebra row fill
const BORDER_HAIRLINE = '#D6D0C5'; // Fine architectural hairline
const BODY_INK = '#526057';        // Body text ink
const MUTED_INK = '#7C887F';       // Muted captions & secondary notes

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/₹\s?/g, 'Rs. ');
}

function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'Rs. 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return 'Rs. 0';
  return 'Rs. ' + Math.round(num).toLocaleString('en-IN');
}

function formatNumber(value: number | string | undefined | null, decimals = 0): string {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatGeneratedDate(value: Date | string): string {
  const d = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()] || 'Sept';
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function cleanUnit(unit: string | null | undefined): string {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u === 'per_litre' || u === 'per_liter') return 'per litre';
  if (u === 'per_sqft') return 'per sqft';
  if (u === 'per_rft') return 'per rft';
  return unit.replace(/_/g, ' ');
}

type FooterIconKind = 'phone' | 'mail' | 'globe' | 'pin';

/**
 * Line-icon paths traced from the same Lucide set already used across the
 * site (Phone/Mail/Globe/MapPin) so the letterhead-style footer needs no
 * bundled icon font or raster assets — just PDFKit's own vector path/stroke.
 */
const FOOTER_ICON_DEFS: Record<
  FooterIconKind,
  { paths: string[]; rect?: [number, number, number, number, number]; circle?: [number, number, number] }
> = {
  phone: {
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    ],
  },
  mail: {
    paths: ['M2 7l8.97 5.7a1.94 1.94 0 0 0 2.06 0L22 7'],
    rect: [2, 4, 20, 16, 2],
  },
  globe: {
    paths: ['M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
    circle: [12, 12, 10],
  },
  pin: {
    paths: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'],
    circle: [12, 10, 3],
  },
};

/** Draws one 24x24-viewBox line icon at (x, y), scaled to `size` points. */
function drawFooterIcon(
  doc: PDFKit.PDFDocument,
  icon: FooterIconKind,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const def = FOOTER_ICON_DEFS[icon];
  const scale = size / 24;
  doc.save();
  doc.translate(x, y).scale(scale);
  doc.lineCap('round').lineJoin('round').lineWidth(2).strokeColor(color);
  if (def.rect) doc.roundedRect(...def.rect);
  for (const d of def.paths) doc.path(d);
  if (def.circle) doc.circle(...def.circle);
  doc.stroke();
  doc.restore();
}

const FOOTER_CONTACT_ITEMS: Array<{ icon: FooterIconKind; text: string }> = [
  { icon: 'phone', text: '+91 94884 40123' },
  { icon: 'mail', text: 'Contact@akileshastiwar.com' },
  { icon: 'globe', text: 'Akileshastiwar.com' },
  { icon: 'pin', text: 'Coimbatore | Virudhunagar' },
];

/** The letterhead's icon + phone/email/website/location bar, distributed symmetrically between margins. */
function drawFooterContactBar(doc: PDFKit.PDFDocument, y: number): void {
  const iconSize = 7.5;
  const gapAfterIcon = 4;
  doc.font(FONT_REG).fontSize(7.5);

  const leftMargin = 36;
  const rightMargin = doc.page.width - 36;
  const totalAvailableWidth = rightMargin - leftMargin;

  // Pre-calculate width of each item to distribute remaining space evenly
  const itemWidths = FOOTER_CONTACT_ITEMS.map((item) => {
    return iconSize + gapAfterIcon + doc.widthOfString(item.text);
  });
  const sumItemsWidth = itemWidths.reduce((a, b) => a + b, 0);
  const totalGapSpace = totalAvailableWidth - sumItemsWidth;
  const gapBetweenItems = FOOTER_CONTACT_ITEMS.length > 1
    ? totalGapSpace / (FOOTER_CONTACT_ITEMS.length - 1)
    : 0;

  let x = leftMargin;
  FOOTER_CONTACT_ITEMS.forEach((item, idx) => {
    // Icon visual centerline matches Helvetica 7.5pt cap-height midpoint at (y - 1.0)
    drawFooterIcon(doc, item.icon, x, y - 1.0, iconSize, OXIDE);
    const textX = x + iconSize + gapAfterIcon;
    doc.fillColor(OXIDE_DEEP).text(item.text, textX, y, { lineBreak: false });

    const itemW = itemWidths[idx];
    if (idx < FOOTER_CONTACT_ITEMS.length - 1) {
      const dividerX = x + itemW + gapBetweenItems / 2;
      doc
        .strokeColor(BORDER_HAIRLINE)
        .lineWidth(0.5)
        .moveTo(dividerX, y + 0.5)
        .lineTo(dividerX, y + 7.5)
        .stroke();
    }
    x += itemW + gapBetweenItems;
  });
}

/**
 * Vertices traced from the letterhead's own background graphic (a 1812x2564
 * source, the same A4 ratio as this document), in source pixel coordinates.
 * Two flat, untinted "tower" silhouettes bottom-right — matching the letterhead.
 */
const MASTHEAD_WATERMARK_SOURCE_SIZE = 1812;
const MASTHEAD_WATERMARK_TOWERS: Array<Array<[number, number]>> = [
  [
    [1569, 980],
    [1273, 1280],
    [1273, 2564],
    [1569, 2564],
  ],
  [
    [1620, 1440],
    [1762, 1600],
    [1762, 2564],
    [1619, 2564],
  ],
];

/**
 * Draws the letterhead's building-silhouette watermark in the background of the page.
 */
function drawMastheadWatermark(doc: PDFKit.PDFDocument): void {
  const scale = doc.page.width / MASTHEAD_WATERMARK_SOURCE_SIZE;
  doc.save();
  doc.fillColor('#F2EBE5');
  for (const tower of MASTHEAD_WATERMARK_TOWERS) {
    const [[startX, startY], ...rest] = tower;
    doc.moveTo(startX * scale, startY * scale);
    for (const [px, py] of rest) {
      doc.lineTo(px * scale, py * scale);
    }
    doc.lineTo(startX * scale, startY * scale);
    doc.fill();
  }
  doc.restore();
}

/** Clean continuation reference (no colored header bar on consecutive pages per user request) */
function drawContinuationBanner(doc: PDFKit.PDFDocument, estimateNumber: string): void {
  doc.fillColor(MUTED_INK).font(FONT_REG).fontSize(7.5).text(`ASTHIWAR Quotation • ${estimateNumber} (Continued)`, 36, 22);
}

const DEFAULT_MILESTONES = [
  { stageNumber: 1, stageName: 'Design & Approvals', percentage: 3, keyDeliverables: 'Soil test, floor plan, structural drawing, DTCP approval assistance' },
  { stageNumber: 2, stageName: 'Earthwork & Excavation', percentage: 4, keyDeliverables: 'Foundation trenching, site leveling, anti-termite treatment' },
  { stageNumber: 3, stageName: 'Foundation & Plinth', percentage: 15, keyDeliverables: 'Footing concrete, plinth beam, basement filling, PCC/RCC basement' },
  { stageNumber: 4, stageName: 'RCC Structure (Columns & Slabs)', percentage: 22, keyDeliverables: 'Column casting, roof slab shuttering, beam reinforcement & curing' },
  { stageNumber: 5, stageName: 'Brickwork & Masonry', percentage: 14, keyDeliverables: 'External & internal walls, lintels, parapet wall construction' },
  { stageNumber: 6, stageName: 'Electrical & Plumbing Concealing', percentage: 8, keyDeliverables: 'Conduits, plumbing lines, switch boxes, drainage routing' },
  { stageNumber: 7, stageName: 'Plastering (Internal & External)', percentage: 10, keyDeliverables: 'Ceiling plastering, wall leveling, exterior weather-coat plaster' },
  { stageNumber: 8, stageName: 'Flooring & Wall Tiling', percentage: 11, keyDeliverables: 'Main vitrified tiles, bathroom tiling, kitchen granite countertop' },
  { stageNumber: 9, stageName: 'Painting & Woodwork', percentage: 8, keyDeliverables: 'Putty, primer, emulsion coats, main door & internal door fixing' },
  { stageNumber: 10, stageName: 'Fixtures, Finishing & Handover', percentage: 5, keyDeliverables: 'CP & sanitary fittings, switches, lights, glass railings, deep clean' },
];

export async function generateEstimatePdf(estimateNumberOrId: string): Promise<Buffer> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    estimateNumberOrId
  );

  let estimate = isUuid
    ? await db.query.estimates.findFirst({ where: eq(schema.estimates.id, estimateNumberOrId) })
    : undefined;

  if (!isUuid) {
    for (const candidate of estimateRefCandidates(estimateNumberOrId)) {
      estimate = await db.query.estimates.findFirst({
        where: eq(schema.estimates.estimateNumber, candidate),
      });
      if (estimate) break;
    }
  }

  if (!estimate) {
    throw new PdfGenerationError(
      404,
      'ESTIMATE_NOT_FOUND',
      `Estimate ${estimateNumberOrId} not found`
    );
  }

  const items = await db.query.estimateItems.findMany({
    where: eq(schema.estimateItems.estimateId, estimate.id),
  });
  const addons = await db.query.estimateAddons.findMany({
    where: eq(schema.estimateAddons.estimateId, estimate.id),
  });
  const rawMilestones = (estimate.milestoneBreakdownJson as Array<{
    stageNumber?: number;
    stageName?: string;
    percentage?: number;
    amount?: number;
    keyDeliverables?: string;
  }>) ?? [];

  const totalCost = Number(estimate.totalProjectCost) || 0;

  const milestoneList = DEFAULT_MILESTONES.map((def) => {
    const matched = rawMilestones.find((m) => m.stageNumber === def.stageNumber);
    const pct = matched?.percentage ?? def.percentage;
    const amount = matched?.amount ?? Math.round((totalCost * pct) / 100);
    const deliverables = matched?.keyDeliverables || def.keyDeliverables;
    return {
      stageNumber: def.stageNumber,
      stageName: matched?.stageName || def.stageName,
      percentage: pct,
      amount,
      keyDeliverables: deliverables,
    };
  });

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 36, right: 36 },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `Quotation ${estimate.estimateNumber} — ASTHIWAR DESIGN & BUILD`,
          Author: 'ASTHIWAR DESIGN & BUILD',
          Subject: 'Official Construction Quotation',
        },
      });

      if (HAS_SATOSHI && FONT_REGULAR_PATH && FONT_BOLD_PATH) {
        doc.registerFont('Satoshi', FONT_REGULAR_PATH);
        if (FONT_MEDIUM_PATH) {
          doc.registerFont('Satoshi-Medium', FONT_MEDIUM_PATH);
        }
        doc.registerFont('Satoshi-Bold', FONT_BOLD_PATH);
      }

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Draw watermark on page 1 background
      drawMastheadWatermark(doc);

      // Ensure every subsequent page (Page 2, continuation pages) automatically gets
      // the watermark rendered in the background before any content is placed.
      doc.on('pageAdded', () => {
        drawMastheadWatermark(doc);
      });

      const tblX = 36;
      const tblW = doc.page.width - 72;

      const checkPageBreak = (neededHeight = 35) => {
        if (doc.y + neededHeight > doc.page.height - 40) {
          doc.addPage();
          drawContinuationBanner(doc, estimate.estimateNumber);
          doc.y = 42;
          return true;
        }
        return false;
      };

      // =========================================================================
      // PAGE 1: MASTHEAD & DETAILS
      // =========================================================================

      // 1. Header Bar — cream ground with the oxide-accented wordmark, matching
      // the ASTHIWAR letterhead (logo top-left, hairline rule under the header).
      doc.rect(0, 0, doc.page.width, 92).fill(OXIDE_WASH);
      doc.rect(0, 92, doc.page.width, 1).fill(OXIDE);
      if (LOGO_PATH) {
        doc.image(LOGO_PATH, 36, 22, { width: 138 });
      } else {
        doc.fillColor(CARBON).font(FONT_BLD).fontSize(18).text('ASTHIWAR DESIGN & BUILD', 36, 26);
      }
      doc.font(FONT_REG).fontSize(7.5).fillColor(MUTED_INK).text('Coimbatore • Virudhunagar • Chennai • Tiruppur • Erode • Pollachi • Madurai | Web: asthiwar.com', 36, 58);

      // Top Right Official Quotation Badge (Refined and reduced in size per user request)
      const badgeWidth = 170;
      const badgeX = doc.page.width - 36 - badgeWidth;
      doc.lineWidth(0.75);
      doc.roundedRect(badgeX, 17, badgeWidth, 58, 6).fillAndStroke(CARD_BG, OXIDE);
      doc.fillColor(OXIDE_DEEP).font(FONT_BLD).fontSize(6.5).text('OFFICIAL QUOTATION', badgeX + 12, 26, { characterSpacing: 0.8 });
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(10.5).text(estimate.estimateNumber, badgeX + 12, 38);
      doc.fillColor(MUTED_INK).font(FONT_REG).fontSize(7).text(`Generated: ${formatGeneratedDate(estimate.createdAt)}`, badgeX + 12, 55);

      // 2. Client & Project Info Card (Expanded vertical padding & row spacing)
      doc.y = 108;
      const infoCardY = doc.y;
      const cardHeight = 88;
      doc.roundedRect(36, infoCardY, tblW, cardHeight, 6)
        .strokeColor(BORDER_HAIRLINE)
        .fillAndStroke(CARD_BG, BORDER_HAIRLINE);

      // Left Column: Client Information
      doc.fillColor(OXIDE_DEEP).font(FONT_BLD).fontSize(8.5).text('CLIENT INFORMATION', 50, infoCardY + 11);
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(8).text('Customer Name: ', 50, infoCardY + 29);
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(cleanText(estimate.customerName) || 'Valued Client', 125, infoCardY + 29);

      doc.font(FONT_BLD).fontSize(8).fillColor(CARBON).text('Contact Phone: ', 50, infoCardY + 47);
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(estimate.customerPhone || '—', 125, infoCardY + 47);

      doc.font(FONT_BLD).fontSize(8).fillColor(CARBON).text('Email Address: ', 50, infoCardY + 65);
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(estimate.customerEmail || '—', 125, infoCardY + 65);

      // Right Column: Project Specifications
      const col2X = 310;
      doc.fillColor(OXIDE_DEEP).font(FONT_BLD).fontSize(8.5).text('PROJECT SPECIFICATIONS', col2X, infoCardY + 11);
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(8).text('Plot Location: ', col2X, infoCardY + 29);
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(cleanText(estimate.plotLocation) || 'Coimbatore', col2X + 80, infoCardY + 29);

      doc.font(FONT_BLD).fontSize(8).fillColor(CARBON).text('Floors & Plot: ', col2X, infoCardY + 47);
      const floorCountRaw = String(estimate.floorCount || '1');
      const floorStr = floorCountRaw.startsWith('G') ? floorCountRaw : `G+${floorCountRaw}`;
      const plotStr = `${floorStr} • Plot: ${formatNumber(estimate.plotAreaSqft, 2)} Sq.Ft`;
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(plotStr, col2X + 80, infoCardY + 47);

      doc.font(FONT_BLD).fontSize(8).fillColor(CARBON).text('Total Built-Up: ', col2X, infoCardY + 65);
      doc.font(FONT_BLD).fontSize(8.5).fillColor(OXIDE_DEEP).text(`${formatNumber(estimate.totalBuiltupAreaSqft)} Sq.Ft`, col2X + 80, infoCardY + 65);

      doc.y = infoCardY + cardHeight + 22;

      // =========================================================================
      // SECTION 1: PACKAGE & BASE CONSTRUCTION COST
      // =========================================================================
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(10).text('1. PACKAGE & BASE CONSTRUCTION COST', 36, doc.y);
      doc.y += 6;

      const pkgTableY = doc.y;
      doc.roundedRect(tblX, pkgTableY, tblW, 26, 3).fill(CARBON_SURFACE);
      doc.fillColor(PAPER).font(FONT_BLD).fontSize(8.5);
      doc.text('Selected Package Tier', tblX + 8, pkgTableY + 8.5);
      doc.text('Total Built-up Area', tblX + 160, pkgTableY + 8.5);
      doc.text('Effective Rate / Sq.Ft', tblX + 280, pkgTableY + 8.5);
      doc.text('Base Amount (INR)', tblX + tblW - 110, pkgTableY + 8.5, { align: 'right', width: 100 });

      const pkgRowY = pkgTableY + 26;
      doc.rect(tblX, pkgRowY, tblW, 28).fill('#FFFFFF').strokeColor(BORDER_HAIRLINE).stroke();
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(8.5);
      const packageLabel = estimate.packageSlug ? `${String(estimate.packageSlug).toUpperCase()} PACKAGE` : 'STANDARD PACKAGE';
      doc.text(packageLabel, tblX + 8, pkgRowY + 9);
      doc.font(FONT_REG).fontSize(8.5).fillColor(BODY_INK).text(`${formatNumber(estimate.totalBuiltupAreaSqft)} Sq.Ft`, tblX + 160, pkgRowY + 9);
      doc.text(`${formatINR(estimate.packageRatePerSqft)} / sq.ft`, tblX + 280, pkgRowY + 9);
      doc.font(FONT_BLD).fontSize(9).fillColor(CARBON).text(formatINR(estimate.baseConstructionCost), tblX + tblW - 110, pkgRowY + 9, { align: 'right', width: 100 });

      doc.y = pkgRowY + 28 + 24;

      // =========================================================================
      // SECTION 2: BRAND CUSTOMIZATIONS & SPECIFICATION UPGRADES
      // =========================================================================
      checkPageBreak(50);
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(10).text('2. BRAND CUSTOMIZATIONS & SPECIFICATION UPGRADES', 36, doc.y);
      doc.y += 6;

      const custTableY = doc.y;
      doc.roundedRect(tblX, custTableY, tblW, 24, 3).fill(CARBON_SURFACE);
      doc.fillColor(PAPER).font(FONT_BLD).fontSize(8);
      doc.text('Item Category', tblX + 8, custTableY + 7.5);
      doc.text('Selected Brand / Option', tblX + 155, custTableY + 7.5);
      doc.text('Rate Delta', tblX + 355, custTableY + 7.5, { width: 75, align: 'right' });
      doc.text('Amount Addition', tblX + tblW - 90, custTableY + 7.5, { align: 'right', width: 80 });

      let curY = custTableY + 24;
      if (items.length > 0) {
        items.forEach((item, idx) => {
          if (curY + 24 > doc.page.height - 40) {
            doc.addPage();
            drawContinuationBanner(doc, estimate.estimateNumber);
            curY = 42;
            doc.roundedRect(tblX, curY, tblW, 24, 3).fill(CARBON_SURFACE);
            doc.fillColor(PAPER).font(FONT_BLD).fontSize(8);
            doc.text('Item Category', tblX + 8, curY + 7.5);
            doc.text('Selected Brand / Option', tblX + 155, curY + 7.5);
            doc.text('Rate Delta', tblX + 355, curY + 7.5, { width: 75, align: 'right' });
            doc.text('Amount Addition', tblX + tblW - 90, curY + 7.5, { align: 'right', width: 80 });
            curY += 24;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
          doc.rect(tblX, curY, tblW, 24).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
          doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8);
          doc.text(cleanText(item.itemName), tblX + 8, curY + 7.5, { width: 142, lineBreak: false, ellipsis: true });
          doc.font(FONT_MED).fontSize(8.5).fillColor(CARBON).text(cleanText(item.selectedOptionName), tblX + 155, curY + 7.5, { width: 195, lineBreak: false, ellipsis: true });
          const delta = Number(item.unitPriceDelta) || 0;
          doc.font(FONT_REG).fontSize(8).fillColor(delta > 0 ? OXIDE_DEEP : BODY_INK).text(delta > 0 ? `+${formatINR(delta)} / sq.ft` : 'Included', tblX + 355, curY + 7.5, { width: 75, align: 'right', lineBreak: false });
          const price = Number(item.calculatedPrice) || 0;
          doc.font(FONT_BLD).fontSize(8.5).fillColor(CARBON).text(price > 0 ? formatINR(price) : 'Rs. 0', tblX + tblW - 90, curY + 7.5, { align: 'right', width: 80, lineBreak: false });
          curY += 24;
        });
      } else {
        doc.rect(tblX, curY, tblW, 24).fill('#FFFFFF').strokeColor(BORDER_HAIRLINE).stroke();
        doc.fillColor(MUTED_INK).font(FONT_REG).fontSize(8);
        doc.text('Standard Package Specifications Included', tblX + 8, curY + 7.5);
        doc.text('Included', tblX + 355, curY + 7.5, { width: 75, align: 'right' });
        doc.text('Rs. 0', tblX + tblW - 90, curY + 7.5, { align: 'right', width: 80 });
        curY += 24;
      }

      doc.y = curY + 18;

      // =========================================================================
      // SECTION 3: SELECTED ADD-ONS & INFRASTRUCTURE
      // =========================================================================
      if (addons.length > 0) {
        checkPageBreak(50);
        doc.fillColor(CARBON).font(FONT_BLD).fontSize(10).text('3. SELECTED ADD-ONS & INFRASTRUCTURE', 36, doc.y);
        doc.y += 6;

        const addonTableY = doc.y;
        doc.roundedRect(tblX, addonTableY, tblW, 24, 3).fill(CARBON_SURFACE);
        doc.fillColor(PAPER).font(FONT_BLD).fontSize(8);
        doc.text('Add-On Name', tblX + 8, addonTableY + 7.5);
        doc.text('Variant / Specification', tblX + 155, addonTableY + 7.5);
        doc.text('Quantity / Unit', tblX + 355, addonTableY + 7.5, { width: 75, align: 'right' });
        doc.text('Total Cost', tblX + tblW - 90, addonTableY + 7.5, { align: 'right', width: 80 });

        let addY = addonTableY + 24;
        addons.forEach((addon, idx) => {
          if (addY + 24 > doc.page.height - 40) {
            doc.addPage();
            drawContinuationBanner(doc, estimate.estimateNumber);
            addY = 42;
            doc.roundedRect(tblX, addY, tblW, 24, 3).fill(CARBON_SURFACE);
            doc.fillColor(PAPER).font(FONT_BLD).fontSize(8);
            doc.text('Add-On Name', tblX + 8, addY + 7.5);
            doc.text('Variant / Specification', tblX + 155, addY + 7.5);
            doc.text('Quantity / Unit', tblX + 355, addY + 7.5, { width: 75, align: 'right' });
            doc.text('Total Cost', tblX + tblW - 90, addY + 7.5, { align: 'right', width: 80 });
            addY += 24;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
          doc.rect(tblX, addY, tblW, 24).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
          doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8);
          doc.text(cleanText(addon.addonName), tblX + 8, addY + 7.5, { width: 142, lineBreak: false, ellipsis: true });
          doc.font(FONT_MED).fontSize(8.5).fillColor(CARBON).text(cleanText(addon.selectedVariant).toUpperCase(), tblX + 155, addY + 7.5, { width: 195, lineBreak: false, ellipsis: true });
          const unitFormatted = cleanUnit(addon.unit);
          doc.font(FONT_REG).fontSize(8).fillColor(BODY_INK).text(`${formatNumber(addon.quantity, 2)} ${unitFormatted}`, tblX + 355, addY + 7.5, { width: 75, align: 'right', lineBreak: false });
          doc.font(FONT_BLD).fontSize(8.5).fillColor(CARBON).text(formatINR(addon.totalPrice), tblX + tblW - 90, addY + 7.5, { align: 'right', width: 80, lineBreak: false });
          addY += 24;
        });

        doc.y = addY + 18;
      }

      // =========================================================================
      // COMMERCIAL SUMMARY CARD
      // =========================================================================
      const sumBoxW = 280;
      const sumBoxX = doc.page.width - 36 - sumBoxW;
      const hasUpgrades = Number(estimate.upgradesCost) > 0;
      const hasAddons = Number(estimate.addonsCost) > 0;
      const sumRowCount = 1 + (hasUpgrades ? 1 : 0) + (hasAddons ? 1 : 0);
      const sumRowH = 20;
      const sumBoxH = sumRowCount * sumRowH + 46;

      checkPageBreak(sumBoxH + 20);
      const sumBoxY = doc.y + 4;

      doc.roundedRect(sumBoxX, sumBoxY, sumBoxW, sumBoxH, 6)
        .strokeColor(BORDER_HAIRLINE)
        .fillAndStroke(CARD_BG, BORDER_HAIRLINE);

      let currentSumY = sumBoxY + 11;
      doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8.5).text('Base Construction Cost:', sumBoxX + 14, currentSumY);
      doc.font(FONT_BLD).fontSize(9).fillColor(CARBON).text(formatINR(estimate.baseConstructionCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 96 });
      currentSumY += sumRowH;

      if (hasUpgrades) {
        doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8.5).text('Specification Upgrades:', sumBoxX + 14, currentSumY);
        doc.font(FONT_BLD).fontSize(9).fillColor(CARBON).text(formatINR(estimate.upgradesCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 96 });
        currentSumY += sumRowH;
      }

      if (hasAddons) {
        doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8.5).text('Add-Ons Subtotal:', sumBoxX + 14, currentSumY);
        doc.font(FONT_BLD).fontSize(9).fillColor(CARBON).text(formatINR(estimate.addonsCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 96 });
        currentSumY += sumRowH;
      }

      // Clean divider line above total project cost per user request
      currentSumY += 4;
      doc
        .strokeColor(BORDER_HAIRLINE)
        .lineWidth(0.75)
        .moveTo(sumBoxX + 14, currentSumY)
        .lineTo(sumBoxX + sumBoxW - 14, currentSumY)
        .stroke();
      currentSumY += 7;

      doc.fillColor(CARBON).font(FONT_BLD).fontSize(9.5).text('TOTAL PROJECT COST:', sumBoxX + 14, currentSumY);
      doc.fillColor(OXIDE_DEEP).font(FONT_BLD).fontSize(11.5).text(formatINR(estimate.totalProjectCost), sumBoxX + sumBoxW - 120, currentSumY - 1, { align: 'right', width: 106 });

      // =========================================================================
      // PAGE 2: 10-STAGE MILESTONES, TERMS & EXCLUSIONS
      // =========================================================================
      doc.addPage();
      // No colored header bar on consecutive pages per user request; title placed cleanly below top margin
      doc.y = 40;
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(12.5).text('10-STAGE CIVIL MILESTONE PAYMENT SCHEDULE', 36, doc.y, { characterSpacing: 0.5 });

      doc.y += 18;
      doc.fillColor(BODY_INK).font(FONT_REG).fontSize(8.5).text(
        'Payments are strictly linked to on-site civil completion stages with zero front-loading. Each stage requires engineer sign-off:',
        36,
        doc.y
      );
      doc.y += 14;

      const msTableY = doc.y;
      doc.roundedRect(tblX, msTableY, tblW, 24, 3).fill(CARBON_SURFACE);
      doc.fillColor(PAPER).font(FONT_BLD).fontSize(8);
      doc.text('Stage', tblX + 8, msTableY + 7.5);
      doc.text('Milestone Description & Work Scope', tblX + 42, msTableY + 7.5);
      doc.text('Share %', tblX + tblW - 128, msTableY + 7.5, { width: 44, align: 'center' });
      doc.text('Amount (INR)', tblX + tblW - 80, msTableY + 7.5, { align: 'right', width: 72 });

      let msY = msTableY + 24;
      const msRowH = 26;
      milestoneList.forEach((m, idx) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
        doc.rect(tblX, msY, tblW, msRowH).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
        doc.fillColor(CARBON).font(FONT_BLD).fontSize(8);
        doc.text(`Stage ${m.stageNumber}`, tblX + 8, msY + 8.5);
        doc.fillColor(CARBON).font(FONT_BLD).fontSize(8);
        doc.text(m.stageName, tblX + 42, msY + 8.5, { width: 128, lineBreak: false, ellipsis: true });
        if (m.keyDeliverables) {
          doc.font(FONT_REG).fontSize(7).fillColor(MUTED_INK);
          doc.text(m.keyDeliverables, tblX + 172, msY + 9, { width: 220, lineBreak: false, ellipsis: true });
        }
        doc.font(FONT_REG).fontSize(8).fillColor(BODY_INK).text(`${m.percentage}%`, tblX + tblW - 128, msY + 8.5, { width: 44, align: 'center' });
        doc.font(FONT_BLD).fontSize(8.5).fillColor(CARBON).text(formatINR(m.amount), tblX + tblW - 80, msY + 8.5, { align: 'right', width: 72 });
        msY += msRowH;
      });

      // Total Row
      const totalRowH = 26;
      doc.rect(tblX, msY, tblW, totalRowH).fill('#EAE6DE').strokeColor(BORDER_HAIRLINE).stroke();
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(8.5);
      doc.text('TOTAL CONTRACT VALUE', tblX + 42, msY + 8.5);
      doc.text('100.00%', tblX + tblW - 128, msY + 8.5, { width: 44, align: 'center', lineBreak: false });
      doc.text(formatINR(estimate.totalProjectCost), tblX + tblW - 80, msY + 8.5, { align: 'right', width: 72 });

      // Generous 26pt clear separation between Total Contract Value and Terms
      doc.y = msY + totalRowH + 26;

      // Terms & Conditions
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(9).text('TERMS & STANDARD CONDITIONS', 36, doc.y);
      doc.y += 8;
      const terms = [
        '1. Quotation Validity: This estimate is valid for 30 calendar days from the date of generation.',
        '2. Rate Basis: Built-up area is calculated outer-to-outer including balconies and parking as specified.',
        '3. Standard Inclusions: 100% material, labor, structural drawings, 3D elevation, site engineer supervision.',
        '4. Standard Exclusions: Government building approval fees, EB permanent connection deposits, borewell depth beyond allowances.',
        '5. Payment Guarantee: Zero advance beyond Stage 1 booking fee; milestone payments only upon site stage verification.',
      ];
      terms.forEach((t) => {
        doc.fillColor(BODY_INK).font(FONT_REG).fontSize(7.5).text(t, 42, doc.y);
        doc.y += 11;
      });

      // Standard Exclusions
      doc.y += 10;
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(8.5).text('STANDARD EXCLUSIONS & CLIENT SCOPE (Out of Scope for Civil Contract):', 36, doc.y);
      doc.y += 7;
      const exclusionsCol1 = [
        '• Elevation Work (Special exterior stone/HPL claddings)',
        '• Outer Area Development (Setbacks, paving & landscape)',
        '• Interior Works & Carpentry (Wardrobes, modular units)',
        '• DTCP & Local Body Building Plan Sanction Fees',
        '• Electricity Board (EB) Connection & Meter Deposits',
        '• Gas Connection & Piped Gas Installation Charges',
      ];
      const exclusionsCol2 = [
        '• Drinking Water & Drainage (UGD) Connection Fees',
        '• Borewell Drilling, Casing & Submersible Piping',
        '• Water Pumps & Motors (unless chosen as Add-On)',
        '• Electrical Appliances (TV, Fridge, ACs, Chimney)',
        '• Vacant Land Tax (VLT) & Local Property Taxes',
      ];
      const exclY = doc.y;
      exclusionsCol1.forEach((t, i) => {
        doc.fillColor(MUTED_INK).font(FONT_REG).fontSize(7.5).text(t, 42, exclY + (i * 11));
      });
      exclusionsCol2.forEach((t, i) => {
        doc.fillColor(MUTED_INK).font(FONT_REG).fontSize(7.5).text(t, 290, exclY + (i * 11));
      });
      doc.y = exclY + (exclusionsCol1.length * 11) + 8;

      // Sign-off Block
      const sigY = 740;
      doc.fillColor(CARBON).font(FONT_BLD).fontSize(7.5).text('For Asthiwar Design & Build', 36, sigY + 6);
      doc.font(FONT_REG).fontSize(6.5).fillColor(MUTED_INK).text('Authorized Engineering Signatory', 36, sigY + 18);
      doc.font(FONT_BLD).fontSize(7.5).fillColor(CARBON).text('Customer Acknowledgment', doc.page.width - 220, sigY + 6);
      doc.font(FONT_REG).fontSize(6.5).fillColor(MUTED_INK).text('Signature / Acceptance Date: ___________________', doc.page.width - 220, sigY + 18);

      // Dynamic Page Footers — the letterhead's hairline + phone/email/website/
      // location bar, with the quotation reference and page count underneath.
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;

        const footerRuleY = doc.page.height - 40;
        doc.strokeColor(OXIDE).lineWidth(0.75).moveTo(36, footerRuleY).lineTo(doc.page.width - 36, footerRuleY).stroke();
        drawFooterContactBar(doc, footerRuleY + 8);

        doc.font(FONT_REG).fontSize(6.5).fillColor(MUTED_INK);
        doc.text(
          `ASTHIWAR Quotation • ${estimate.estimateNumber} • Page ${i + 1} of ${totalPages}`,
          36,
          footerRuleY + 22,
          { align: 'center', width: doc.page.width - 72, lineBreak: false }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
