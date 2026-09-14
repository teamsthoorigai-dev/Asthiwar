import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db, schema, eq } from '@asthiwar/database';
import { estimateRefCandidates } from '../calculator/quotation.js';

const LOGO_FILE = fileURLToPath(
  new URL('../../../assets/brand/asthiwar-logo-white.png', import.meta.url)
);
const LOGO_FALLBACK = path.resolve(process.cwd(), 'assets/brand/asthiwar-logo-white.png');
const LOGO_PATH = existsSync(LOGO_FILE)
  ? LOGO_FILE
  : existsSync(LOGO_FALLBACK)
  ? LOGO_FALLBACK
  : undefined;

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
const OXIDE_LIGHT = '#D9A971';     // Lifted oxide for text on dark backgrounds
const OXIDE_DEEP = '#76522F';      // Deep oxide accent
const OXIDE_WASH = '#F9F5EE';      // Subtle warm oxide highlight
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

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const tblX = 36;
      const tblW = doc.page.width - 72;

      const checkPageBreak = (neededHeight = 35) => {
        if (doc.y + neededHeight > doc.page.height - 40) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, 30).fill(CARBON);
          doc.rect(0, 30, doc.page.width, 1.5).fill(OXIDE);
          doc.fillColor(OXIDE_LIGHT).font('Helvetica-Bold').fontSize(9);
          doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
          doc.y = 42;
          return true;
        }
        return false;
      };

      // =========================================================================
      // PAGE 1: MASTHEAD & DETAILS
      // =========================================================================

      // 1. Header Bar
      doc.rect(0, 0, doc.page.width, 92).fill(CARBON);
      doc.rect(0, 92, doc.page.width, 1.5).fill(OXIDE);
      if (LOGO_PATH) {
        doc.image(LOGO_PATH, 36, 18, { width: 145 });
      } else {
        doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(18).text('ASTHIWAR DESIGN & BUILD', 36, 22);
      }
      doc.font('Helvetica').fontSize(8.5).fillColor(OXIDE_LIGHT).text('Turnkey Residential Construction & Civil Engineering • Tamil Nadu', 36, 46);
      doc.fontSize(7.5).fillColor('#B0ABA1').text('Coimbatore • Virudhunagar • Chennai • Tiruppur • Erode • Pollachi • Madurai | Web: asthiwar.com', 36, 60);

      // Top Right Official Quotation Badge
      const badgeWidth = 175;
      const badgeX = doc.page.width - 36 - badgeWidth;
      doc.roundedRect(badgeX, 16, badgeWidth, 60, 6).fill(CARBON_SURFACE);
      doc.strokeColor(OXIDE).lineWidth(0.75).stroke();
      doc.fillColor(OXIDE_LIGHT).font('Helvetica-Bold').fontSize(8).text('OFFICIAL QUOTATION', badgeX + 10, 24);
      doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(11).text(estimate.estimateNumber, badgeX + 10, 38);
      doc.fillColor('#A8A298').font('Helvetica').fontSize(7.5).text(`Generated: ${formatGeneratedDate(estimate.createdAt)}`, badgeX + 10, 56);

      // 2. Client & Project Info Card
      doc.y = 106;
      const infoCardY = doc.y;
      const cardHeight = 72;
      doc.roundedRect(36, infoCardY, tblW, cardHeight, 6)
        .strokeColor(BORDER_HAIRLINE)
        .fillAndStroke(CARD_BG, BORDER_HAIRLINE);

      // Left Column: Client Information
      doc.fillColor(OXIDE_DEEP).font('Helvetica-Bold').fontSize(8.5).text('CLIENT INFORMATION', 50, infoCardY + 9);
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8).text('Customer Name: ', 50, infoCardY + 23);
      doc.font('Helvetica').fillColor(BODY_INK).text(cleanText(estimate.customerName) || 'Valued Client', 125, infoCardY + 23);

      doc.font('Helvetica-Bold').fillColor(CARBON).text('Contact Phone: ', 50, infoCardY + 37);
      doc.font('Helvetica').fillColor(BODY_INK).text(estimate.customerPhone || '—', 125, infoCardY + 37);

      doc.font('Helvetica-Bold').fillColor(CARBON).text('Email Address: ', 50, infoCardY + 51);
      doc.font('Helvetica').fillColor(BODY_INK).text(estimate.customerEmail || '', 125, infoCardY + 51);

      // Right Column: Project Specifications
      const col2X = 310;
      doc.fillColor(OXIDE_DEEP).font('Helvetica-Bold').fontSize(8.5).text('PROJECT SPECIFICATIONS', col2X, infoCardY + 9);
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8).text('Plot Location: ', col2X, infoCardY + 23);
      doc.font('Helvetica').fillColor(BODY_INK).text(cleanText(estimate.plotLocation) || 'Coimbatore', col2X + 80, infoCardY + 23);

      doc.font('Helvetica-Bold').fillColor(CARBON).text('Floors & Plot: ', col2X, infoCardY + 37);
      const floorCountRaw = String(estimate.floorCount || '1');
      const floorStr = floorCountRaw.startsWith('G') ? floorCountRaw : `G+${floorCountRaw}`;
      const plotStr = `${floorStr} • Plot: ${formatNumber(estimate.plotAreaSqft, 2)} Sq.Ft`;
      doc.font('Helvetica').fillColor(BODY_INK).text(plotStr, col2X + 80, infoCardY + 37);

      doc.font('Helvetica-Bold').fillColor(CARBON).text('Total Built-Up: ', col2X, infoCardY + 51);
      doc.font('Helvetica-Bold').fillColor(OXIDE_DEEP).text(`${formatNumber(estimate.totalBuiltupAreaSqft)} Sq.Ft`, col2X + 80, infoCardY + 51);

      doc.y = infoCardY + cardHeight + 14;

      // =========================================================================
      // SECTION 1: PACKAGE & BASE CONSTRUCTION COST
      // =========================================================================
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(10).text('1. PACKAGE & BASE CONSTRUCTION COST', 36, doc.y);
      doc.y += 5;

      const pkgTableY = doc.y;
      doc.roundedRect(tblX, pkgTableY, tblW, 20, 3).fill(CARBON);
      doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(8);
      doc.text('Selected Package Tier', tblX + 8, pkgTableY + 6);
      doc.text('Total Built-up Area', tblX + 160, pkgTableY + 6);
      doc.text('Effective Rate / Sq.Ft', tblX + 280, pkgTableY + 6);
      doc.text('Base Amount (INR)', tblX + tblW - 110, pkgTableY + 6, { align: 'right', width: 100 });

      const pkgRowY = pkgTableY + 20;
      doc.rect(tblX, pkgRowY, tblW, 20).fill('#FFFFFF').strokeColor(BORDER_HAIRLINE).stroke();
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8);
      const packageLabel = estimate.packageSlug ? `${String(estimate.packageSlug).toUpperCase()} PACKAGE` : 'STANDARD PACKAGE';
      doc.text(packageLabel, tblX + 8, pkgRowY + 5);
      doc.font('Helvetica').fillColor(BODY_INK).text(`${formatNumber(estimate.totalBuiltupAreaSqft)} Sq.Ft`, tblX + 160, pkgRowY + 5);
      doc.text(`${formatINR(estimate.packageRatePerSqft)} / sq.ft`, tblX + 280, pkgRowY + 5);
      doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(estimate.baseConstructionCost), tblX + tblW - 110, pkgRowY + 5, { align: 'right', width: 100 });

      doc.y = pkgRowY + 26;

      // =========================================================================
      // SECTION 2: BRAND CUSTOMIZATIONS & SPECIFICATION UPGRADES
      // =========================================================================
      checkPageBreak(40);
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(10).text('2. BRAND CUSTOMIZATIONS & SPECIFICATION UPGRADES', 36, doc.y);
      doc.y += 5;

      const custTableY = doc.y;
      doc.roundedRect(tblX, custTableY, tblW, 16, 3).fill(CARBON_SURFACE);
      doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(7.5);
      doc.text('Item Category', tblX + 8, custTableY + 4);
      doc.text('Selected Brand / Option', tblX + 155, custTableY + 4);
      doc.text('Rate Delta', tblX + 355, custTableY + 4, { width: 75, align: 'right' });
      doc.text('Amount Addition', tblX + tblW - 90, custTableY + 4, { align: 'right', width: 80 });

      let curY = custTableY + 16;
      if (items.length > 0) {
        items.forEach((item, idx) => {
          if (curY + 16 > doc.page.height - 40) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 30).fill(CARBON);
            doc.rect(0, 30, doc.page.width, 1.5).fill(OXIDE);
            doc.fillColor(OXIDE_LIGHT).font('Helvetica-Bold').fontSize(9);
            doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
            curY = 42;
            doc.roundedRect(tblX, curY, tblW, 16, 3).fill(CARBON_SURFACE);
            doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(7.5);
            doc.text('Item Category', tblX + 8, curY + 4);
            doc.text('Selected Brand / Option', tblX + 155, curY + 4);
            doc.text('Rate Delta', tblX + 355, curY + 4, { width: 75, align: 'right' });
            doc.text('Amount Addition', tblX + tblW - 90, curY + 4, { align: 'right', width: 80 });
            curY += 16;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
          doc.rect(tblX, curY, tblW, 15).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
          doc.fillColor(BODY_INK).font('Helvetica').fontSize(7);
          doc.text(cleanText(item.itemName), tblX + 8, curY + 4, { width: 142, lineBreak: false, ellipsis: true });
          doc.font('Helvetica-Bold').fillColor(CARBON).text(cleanText(item.selectedOptionName), tblX + 155, curY + 4, { width: 195, lineBreak: false, ellipsis: true });
          const delta = Number(item.unitPriceDelta) || 0;
          doc.font('Helvetica').fillColor(delta > 0 ? OXIDE_DEEP : BODY_INK).text(delta > 0 ? `+${formatINR(delta)} / sq.ft` : 'Included', tblX + 355, curY + 4, { width: 75, align: 'right', lineBreak: false });
          const price = Number(item.calculatedPrice) || 0;
          doc.font('Helvetica-Bold').fillColor(CARBON).text(price > 0 ? formatINR(price) : 'Rs. 0', tblX + tblW - 90, curY + 4, { align: 'right', width: 80, lineBreak: false });
          curY += 15;
        });
      } else {
        doc.rect(tblX, curY, tblW, 15).fill('#FFFFFF').strokeColor(BORDER_HAIRLINE).stroke();
        doc.fillColor(MUTED_INK).font('Helvetica').fontSize(7);
        doc.text('Standard Package Specifications Included', tblX + 8, curY + 4);
        doc.text('Included', tblX + 355, curY + 4, { width: 75, align: 'right' });
        doc.text('Rs. 0', tblX + tblW - 90, curY + 4, { align: 'right', width: 80 });
        curY += 15;
      }

      doc.y = curY + 10;

      // =========================================================================
      // SECTION 3: SELECTED ADD-ONS & INFRASTRUCTURE
      // =========================================================================
      if (addons.length > 0) {
        checkPageBreak(40);
        doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(10).text('3. SELECTED ADD-ONS & INFRASTRUCTURE', 36, doc.y);
        doc.y += 5;

        const addonTableY = doc.y;
        doc.roundedRect(tblX, addonTableY, tblW, 16, 3).fill(CARBON_SURFACE);
        doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(7.5);
        doc.text('Add-On Name', tblX + 8, addonTableY + 4);
        doc.text('Variant / Specification', tblX + 155, addonTableY + 4);
        doc.text('Quantity / Unit', tblX + 355, addonTableY + 4, { width: 75, align: 'right' });
        doc.text('Total Cost', tblX + tblW - 90, addonTableY + 4, { align: 'right', width: 80 });

        let addY = addonTableY + 16;
        addons.forEach((addon, idx) => {
          if (addY + 16 > doc.page.height - 40) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 30).fill(CARBON);
            doc.rect(0, 30, doc.page.width, 1.5).fill(OXIDE);
            doc.fillColor(OXIDE_LIGHT).font('Helvetica-Bold').fontSize(9);
            doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
            addY = 42;
            doc.roundedRect(tblX, addY, tblW, 16, 3).fill(CARBON_SURFACE);
            doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(7.5);
            doc.text('Add-On Name', tblX + 8, addY + 4);
            doc.text('Variant / Specification', tblX + 155, addY + 4);
            doc.text('Quantity / Unit', tblX + 355, addY + 4, { width: 75, align: 'right' });
            doc.text('Total Cost', tblX + tblW - 90, addY + 4, { align: 'right', width: 80 });
            addY += 16;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
          doc.rect(tblX, addY, tblW, 15).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
          doc.fillColor(BODY_INK).font('Helvetica').fontSize(7);
          doc.text(cleanText(addon.addonName), tblX + 8, addY + 4, { width: 142, lineBreak: false, ellipsis: true });
          doc.font('Helvetica-Bold').fillColor(CARBON).text(cleanText(addon.selectedVariant).toUpperCase(), tblX + 155, addY + 4, { width: 195, lineBreak: false, ellipsis: true });
          const unitFormatted = cleanUnit(addon.unit);
          doc.font('Helvetica').fillColor(BODY_INK).text(`${formatNumber(addon.quantity, 2)} ${unitFormatted}`, tblX + 355, addY + 4, { width: 75, align: 'right', lineBreak: false });
          doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(addon.totalPrice), tblX + tblW - 90, addY + 4, { align: 'right', width: 80, lineBreak: false });
          addY += 15;
        });

        doc.y = addY + 10;
      }

      // =========================================================================
      // COMMERCIAL SUMMARY CARD
      // =========================================================================
      const sumBoxW = 260;
      const sumBoxX = doc.page.width - 36 - sumBoxW;
      const hasUpgrades = Number(estimate.upgradesCost) > 0;
      const hasAddons = Number(estimate.addonsCost) > 0;
      const sumRowCount = 1 + (hasUpgrades ? 1 : 0) + (hasAddons ? 1 : 0);
      const sumBoxH = sumRowCount * 14 + 36;

      checkPageBreak(sumBoxH + 15);
      const sumBoxY = doc.y + 2;

      doc.roundedRect(sumBoxX, sumBoxY, sumBoxW, sumBoxH, 6)
        .strokeColor(BORDER_HAIRLINE)
        .fillAndStroke(CARD_BG, BORDER_HAIRLINE);

      let currentSumY = sumBoxY + 7;
      doc.fillColor(BODY_INK).font('Helvetica').fontSize(8).text('Base Construction Cost:', sumBoxX + 10, currentSumY);
      doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(estimate.baseConstructionCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
      currentSumY += 14;

      if (hasUpgrades) {
        doc.fillColor(BODY_INK).font('Helvetica').fontSize(8).text('Specification Upgrades:', sumBoxX + 10, currentSumY);
        doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(estimate.upgradesCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
        currentSumY += 14;
      }

      if (hasAddons) {
        doc.fillColor(BODY_INK).font('Helvetica').fontSize(8).text('Add-Ons Subtotal:', sumBoxX + 10, currentSumY);
        doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(estimate.addonsCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
        currentSumY += 14;
      }

      currentSumY += 2;
      doc.rect(sumBoxX, currentSumY - 2, sumBoxW, 22).fill(OXIDE_WASH);
      doc.strokeColor(OXIDE).lineWidth(0.5).stroke();
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8.5).text('TOTAL PROJECT COST:', sumBoxX + 10, currentSumY + 3);
      doc.fillColor(OXIDE_DEEP).font('Helvetica-Bold').fontSize(10.5).text(formatINR(estimate.totalProjectCost), sumBoxX + sumBoxW - 120, currentSumY + 2, { align: 'right', width: 110 });

      // =========================================================================
      // PAGE 2: 10-STAGE MILESTONES, TERMS & EXCLUSIONS
      // =========================================================================
      doc.addPage();
      doc.rect(0, 0, doc.page.width, 50).fill(CARBON);
      doc.rect(0, 50, doc.page.width, 1.5).fill(OXIDE);
      doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(12.5).text('10-STAGE CIVIL MILESTONE PAYMENT SCHEDULE', 36, 18);

      doc.y = 60;
      doc.fillColor(BODY_INK).font('Helvetica').fontSize(8).text(
        'Payments are strictly linked to on-site civil completion stages with zero front-loading. Each stage requires engineer sign-off:',
        36,
        doc.y
      );
      doc.y += 10;

      const msTableY = doc.y;
      doc.roundedRect(tblX, msTableY, tblW, 16, 3).fill(CARBON);
      doc.fillColor(PAPER).font('Helvetica-Bold').fontSize(7.5);
      doc.text('Stage', tblX + 8, msTableY + 4);
      doc.text('Milestone Description & Work Scope', tblX + 45, msTableY + 4);
      doc.text('Share %', tblX + 375, msTableY + 4, { width: 45, align: 'center' });
      doc.text('Amount (INR)', tblX + tblW - 100, msTableY + 4, { align: 'right', width: 92 });

      let msY = msTableY + 16;
      milestoneList.forEach((m, idx) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : ROW_ALT_BG;
        doc.rect(tblX, msY, tblW, 17).fill(rowBg).strokeColor(BORDER_HAIRLINE).stroke();
        doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(7.5);
        doc.text(`Stage ${m.stageNumber}`, tblX + 8, msY + 4);
        doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(7.5);
        doc.text(m.stageName, tblX + 45, msY + 4, { width: 122, lineBreak: false, ellipsis: true });
        if (m.keyDeliverables) {
          doc.font('Helvetica').fontSize(6.5).fillColor(MUTED_INK);
          doc.text(m.keyDeliverables, tblX + 171, msY + 4.5, { width: 202, lineBreak: false });
        }
        doc.font('Helvetica').fontSize(7.5).fillColor(BODY_INK).text(`${m.percentage}%`, tblX + 375, msY + 4, { width: 45, align: 'center' });
        doc.font('Helvetica-Bold').fillColor(CARBON).text(formatINR(m.amount), tblX + tblW - 100, msY + 4, { align: 'right', width: 92 });
        msY += 17;
      });

      // Total Row
      doc.rect(tblX, msY, tblW, 19).fill('#EAE6DE').strokeColor(BORDER_HAIRLINE).stroke();
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8);
      doc.text('TOTAL CONTRACT VALUE', tblX + 45, msY + 5);
      doc.text('100.00%', tblX + 375, msY + 5, { width: 45, align: 'center' });
      doc.text(formatINR(estimate.totalProjectCost), tblX + tblW - 100, msY + 5, { align: 'right', width: 92 });

      doc.y = msY + 22;

      // Terms & Conditions
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8.5).text('TERMS & STANDARD CONDITIONS', 36, doc.y);
      doc.y += 5;
      const terms = [
        '1. Quotation Validity: This estimate is valid for 30 calendar days from the date of generation.',
        '2. Rate Basis: Built-up area is calculated outer-to-outer including balconies and parking as specified.',
        '3. Standard Inclusions: 100% material, labor, structural drawings, 3D elevation, site engineer supervision.',
        '4. Standard Exclusions: Government building approval fees, EB permanent connection deposits, borewell depth beyond allowances.',
        '5. Payment Guarantee: Zero advance beyond Stage 1 booking fee; milestone payments only upon site stage verification.',
      ];
      terms.forEach((t) => {
        doc.fillColor(BODY_INK).font('Helvetica').fontSize(6.5).text(t, 42, doc.y);
        doc.y += 9;
      });

      // Standard Exclusions
      doc.y += 4;
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(8).text('STANDARD EXCLUSIONS & CLIENT SCOPE (Out of Scope for Civil Contract):', 36, doc.y);
      doc.y += 4;
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
        doc.fillColor(MUTED_INK).font('Helvetica').fontSize(6.5).text(t, 42, exclY + (i * 9));
      });
      exclusionsCol2.forEach((t, i) => {
        doc.fillColor(MUTED_INK).font('Helvetica').fontSize(6.5).text(t, 290, exclY + (i * 9));
      });
      doc.y = exclY + (exclusionsCol1.length * 9) + 4;

      // Sign-off Block
      const sigY = 740;
      doc.fillColor(CARBON).font('Helvetica-Bold').fontSize(7.5).text('For Asthiwar Design & Build', 36, sigY + 6);
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED_INK).text('Authorized Engineering Signatory', 36, sigY + 18);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CARBON).text('Customer Acknowledgment', doc.page.width - 220, sigY + 6);
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED_INK).text('Signature / Acceptance Date: ___________________', doc.page.width - 220, sigY + 18);

      // Dynamic Page Footers
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.font('Helvetica').fontSize(7).fillColor(MUTED_INK);
        doc.text(
          `ASTHIWAR Quotation • ${estimate.estimateNumber} • Page ${i + 1} of ${totalPages}`,
          36,
          doc.page.height - 18,
          { align: 'center', width: doc.page.width - 72, lineBreak: false }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
