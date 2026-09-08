import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, schema, eq } from '@asthiwar/database';
import {
  QUOTATION_TERMS,
  QUOTATION_EXCLUSIONS,
  QUOTATION_VALIDITY_DAYS,
  quotationValidUntil,
  estimateRefCandidates,
} from '../calculator/quotation.js';
import {
  C,
  CONTENT_W,
  MARGIN,
  PAGE_H,
  PAGE_W,
  FOOTER_RESERVE,
  cleanText,
  ensureSpace,
  hairline,
  longDate,
  money,
  num,
  sectionLabel,
  stackedField,
  table,
} from './pdf.layout.js';

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

/**
 * The backend keeps its own copy of the wordmark under backend/assets rather
 * than reaching into the web app's public/ folder. That kept the two deployables
 * coupled: pointing a host's root directory at backend/, or containerising it
 * alone, silently lost the logo.
 *
 * Resolved from this module rather than the working directory. src/modules/pdf
 * and dist/modules/pdf sit at the same depth below backend/, so one path serves
 * both the tsx dev server and the compiled build.
 */
const LOGO_FILE = fileURLToPath(
  new URL('../../../assets/brand/asthiwar-logo-white.png', import.meta.url)
);
const LOGO_PATH = existsSync(LOGO_FILE) ? LOGO_FILE : undefined;

const COMPANY = {
  name: 'ASTHIWAR DESIGN & BUILD',
  strapline: 'Turnkey Residential Construction & Civil Engineering',
  cities: 'Coimbatore  ·  Chennai  ·  Tiruppur  ·  Erode  ·  Pollachi  ·  Madurai',
  web: 'asthiwar.com',
} as const;

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
  const milestones = (estimate.milestoneBreakdownJson as Array<{
    stageNumber: number;
    stageName: string;
    percentage: number;
    amount: number;
    keyDeliverables: string;
  }>) ?? [];

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: `Quotation ${estimate.estimateNumber} — ${COMPANY.name}`,
          Author: COMPANY.name,
          Subject: 'Construction Quotation',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Every page after the first gets a slim running header. Page 1 already
      // carries the full masthead, so this is attached after it exists.
      doc.on('pageAdded', () => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(C.muted)
          .text(COMPANY.name, MARGIN, 26, { characterSpacing: 0.8, lineBreak: false });
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(C.muted)
          .text(estimate.estimateNumber, MARGIN, 26, {
            width: CONTENT_W,
            align: 'right',
            lineBreak: false,
          });
        doc.strokeColor(C.rule).lineWidth(0.75).moveTo(MARGIN, 40).lineTo(PAGE_W - MARGIN, 40).stroke();
        doc.y = 58;
      });

      // ══════════════════════════════════════════════════ MASTHEAD
      const headerH = 104;
      doc.rect(0, 0, PAGE_W, headerH).fill(C.navy);
      // A thin brass rule under the masthead — the document's only flourish.
      doc.rect(0, headerH, PAGE_W, 2.5).fill(C.accent);

      if (LOGO_PATH) {
        // Wordmark is 5698×839; 150pt wide keeps it crisp and in proportion.
        doc.image(LOGO_PATH, MARGIN, 26, { width: 150 });
      } else {
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor(C.paper)
          .text(COMPANY.name, MARGIN, 30, { characterSpacing: 0.5 });
      }

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#9AA7B8')
        .text(COMPANY.strapline, MARGIN, 62, { characterSpacing: 0.3 })
        .text(COMPANY.cities, MARGIN, 74, { characterSpacing: 0.2 })
        .fillColor(C.accent)
        .text(COMPANY.web, MARGIN, 86);

      // Quotation identity, right-aligned in the masthead.
      const idW = 186;
      const idX = PAGE_W - MARGIN - idW;
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#9AA7B8')
        .text('QUOTATION', idX, 28, { width: idW, align: 'right', characterSpacing: 1.6 });
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(C.paper)
        .text(estimate.estimateNumber, idX, 41, { width: idW, align: 'right' });

      const issued = new Date(estimate.createdAt);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#9AA7B8')
        .text(`Issued  ${longDate(issued)}`, idX, 66, { width: idW, align: 'right' })
        .fillColor(C.accent)
        .text(`Valid until  ${longDate(quotationValidUntil(issued))}`, idX, 78, {
          width: idW,
          align: 'right',
        });

      doc.y = headerH + 24;

      // ══════════════════════════════════════════════════ PARTIES
      sectionLabel(doc, 'Prepared for');

      const colW = CONTENT_W / 2 - 12;
      const blockTop = doc.y;

      stackedField(doc, 'Client', cleanText(estimate.customerName), MARGIN, blockTop, colW);
      stackedField(doc, 'Phone', estimate.customerPhone, MARGIN, blockTop + 32, colW);
      stackedField(doc, 'Email', estimate.customerEmail || '—', MARGIN, blockTop + 64, colW);

      const rightX = MARGIN + CONTENT_W / 2 + 12;
      stackedField(doc, 'Project location', cleanText(estimate.plotLocation), rightX, blockTop, colW);
      stackedField(
        doc,
        'Configuration',
        `${estimate.floorCount}  ·  Plot ${num(estimate.plotAreaSqft)} sq.ft`,
        rightX,
        blockTop + 32,
        colW
      );
      stackedField(
        doc,
        'Total built-up area',
        `${num(estimate.totalBuiltupAreaSqft)} sq.ft`,
        rightX,
        blockTop + 64,
        colW
      );

      doc.y = blockTop + 96;

      // ══════════════════════════════════════════════════ HEADLINE FIGURE
      ensureSpace(doc, 96);
      const heroY = doc.y;
      const heroH = 76;
      doc.roundedRect(MARGIN, heroY, CONTENT_W, heroH, 4).fill(C.accentWash);
      doc.rect(MARGIN, heroY, 3, heroH).fill(C.accent);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.inkSoft)
        .text('TOTAL PROJECT VALUE', MARGIN + 20, heroY + 14, { characterSpacing: 1.2 });
      doc
        .font('Helvetica-Bold')
        .fontSize(27)
        .fillColor(C.ink)
        .text(money(estimate.totalProjectCost), MARGIN + 20, heroY + 28);

      const rateX = MARGIN + CONTENT_W - 200;
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.inkSoft)
        .text('ALL-IN RATE', rateX, heroY + 14, { width: 180, align: 'right', characterSpacing: 1.2 });
      const allInRate =
        Number(estimate.totalBuiltupAreaSqft) > 0
          ? Number(estimate.totalProjectCost) / Number(estimate.totalBuiltupAreaSqft)
          : 0;
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(C.ink)
        .text(`${money(allInRate)} / sq.ft`, rateX, heroY + 30, { width: 180, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(C.muted)
        .text(
          `on ${num(estimate.totalBuiltupAreaSqft)} sq.ft built-up`,
          rateX,
          heroY + 50,
          { width: 180, align: 'right' }
        );

      doc.y = heroY + heroH + 22;

      // ══════════════════════════════════════════════════ COST SUMMARY
      sectionLabel(doc, 'Cost summary');

      const packageLabel = `${String(estimate.packageSlug).replace(/^\w/, (m) => m.toUpperCase())} package`;
      const summaryRows: Array<Record<string, string>> = [
        {
          particular: `Base construction — ${packageLabel}`,
          detail: `${num(estimate.totalBuiltupAreaSqft)} sq.ft @ ${money(estimate.packageRatePerSqft)}/sq.ft`,
          amount: money(estimate.baseConstructionCost),
        },
      ];
      if (Number(estimate.upgradesCost) > 0) {
        summaryRows.push({
          particular: 'Specification upgrades',
          detail: `${items.length} selected ${items.length === 1 ? 'item' : 'items'}`,
          amount: money(estimate.upgradesCost),
        });
      }
      if (Number(estimate.addonsCost) > 0) {
        summaryRows.push({
          particular: 'Optional add-ons',
          detail: `${addons.length} selected ${addons.length === 1 ? 'item' : 'items'}`,
          amount: money(estimate.addonsCost),
        });
      }

      table(
        doc,
        [
          { key: 'particular', label: 'Particulars', width: 250 },
          { key: 'detail', label: 'Basis', width: 155 },
          { key: 'amount', label: 'Amount', width: CONTENT_W - 405, align: 'right', emphasis: true },
        ],
        summaryRows,
        { zebra: false }
      );

      // Totals ladder, right-aligned under the amount column.
      const totalRow = (label: string, value: string, strong = false) => {
        ensureSpace(doc, 22);
        const y = doc.y + 5;
        doc
          .font(strong ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(strong ? 10 : 8.5)
          .fillColor(strong ? C.ink : C.inkSoft)
          .text(label, MARGIN + 250, y, { width: 155, align: 'right' });
        doc
          .font('Helvetica-Bold')
          .fontSize(strong ? 12 : 9)
          .fillColor(strong ? C.accent : C.ink)
          .text(value, MARGIN + 405, y - (strong ? 2 : 0), {
            width: CONTENT_W - 405,
            align: 'right',
          });
        doc.y = y + (strong ? 20 : 16);
      };

      totalRow('Subtotal', money(estimate.subtotalCost));
      if (Number(estimate.gstPercentage) > 0) {
        totalRow(`GST @ ${num(estimate.gstPercentage, 2)}%`, money(estimate.gstAmount));
      }
      doc.y += 2;
      hairline(doc, C.ink, 1);
      totalRow('Total project value', money(estimate.totalProjectCost), true);

      // ══════════════════════════════════════════════════ SPECIFICATIONS
      if (items.length > 0) {
        ensureSpace(doc, 120);
        doc.y += 12;
        sectionLabel(doc, 'Specification schedule');
        table(
          doc,
          [
            { key: 'item', label: 'Component', width: 190 },
            { key: 'choice', label: 'Selected brand / grade', width: 200 },
            { key: 'amount', label: 'Amount', width: CONTENT_W - 390, align: 'right' },
          ],
          items.map((it) => ({
            item: cleanText(it.itemName),
            choice: cleanText(it.selectedOptionName),
            amount: Number(it.calculatedPrice) > 0 ? money(it.calculatedPrice) : 'Included',
          }))
        );
      }

      // ══════════════════════════════════════════════════ ADD-ONS
      if (addons.length > 0) {
        ensureSpace(doc, 120);
        doc.y += 12;
        sectionLabel(doc, 'Optional add-ons');
        table(
          doc,
          [
            { key: 'name', label: 'Add-on', width: 190 },
            { key: 'variant', label: 'Variant', width: 130 },
            { key: 'qty', label: 'Qty', width: 70, align: 'right' },
            { key: 'amount', label: 'Amount', width: CONTENT_W - 390, align: 'right' },
          ],
          addons.map((ad) => ({
            name: cleanText(ad.addonName),
            variant: cleanText(ad.selectedVariant),
            qty: `${num(ad.quantity, 2)}`,
            amount: money(ad.totalPrice),
          }))
        );
      }

      // ══════════════════════════════════════════════════ PAYMENT SCHEDULE
      if (milestones.length > 0) {
        ensureSpace(doc, 150);
        doc.y += 12;
        sectionLabel(doc, 'Payment milestone schedule');
        table(
          doc,
          [
            { key: 'stage', label: '#', width: 30, align: 'center' },
            { key: 'name', label: 'Stage', width: 150 },
            { key: 'deliverables', label: 'Key deliverables', width: 200 },
            { key: 'pct', label: '%', width: 42, align: 'right' },
            { key: 'amount', label: 'Amount', width: CONTENT_W - 422, align: 'right', emphasis: true },
          ],
          milestones.map((m) => ({
            stage: String(m.stageNumber),
            name: cleanText(m.stageName),
            deliverables: cleanText(m.keyDeliverables),
            pct: `${num(m.percentage, 2)}%`,
            amount: money(m.amount),
          })),
          { fontSize: 7.5 }
        );
      }

      // ══════════════════════════════════════════════════ TERMS
      ensureSpace(doc, 170);
      doc.y += 14;
      sectionLabel(doc, 'Terms & conditions', { accent: true });

      QUOTATION_TERMS.forEach((term, i) => {
        const bodyH = doc.font('Helvetica').fontSize(8).heightOfString(term.body, {
          width: CONTENT_W - 22,
        });
        ensureSpace(doc, bodyH + 20);
        const y = doc.y;
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(C.accent)
          .text(`${i + 1}`, MARGIN, y, { width: 14, lineBreak: false });
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(C.ink)
          .text(term.title, MARGIN + 16, y, { width: CONTENT_W - 22, continued: true })
          .font('Helvetica')
          .fillColor(C.inkSoft)
          .text(`  —  ${term.body}`);
        doc.y += 7;
      });

      // ══════════════════════════════════════════════════ EXCLUSIONS
      ensureSpace(doc, 150);
      doc.y += 10;
      sectionLabel(doc, 'Exclusions', { accent: true });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.muted)
        .text('The following fall outside this civil contract and are arranged or billed separately.', MARGIN, doc.y, {
          width: CONTENT_W,
        });
      doc.y += 10;

      // Two balanced columns, sized to the tallest so the block never overlaps.
      const half = Math.ceil(QUOTATION_EXCLUSIONS.length / 2);
      const colA = QUOTATION_EXCLUSIONS.slice(0, half);
      const colB = QUOTATION_EXCLUSIONS.slice(half);
      const exclColW = CONTENT_W / 2 - 10;
      const exclTop = doc.y;
      let maxBottom = exclTop;

      const drawExclusionColumn = (list: readonly string[], x: number) => {
        let y = exclTop;
        for (const entry of list) {
          const h = doc.font('Helvetica').fontSize(8).heightOfString(entry, { width: exclColW - 12 });
          doc.circle(x + 2.5, y + 4, 1.4).fill(C.accent);
          doc.font('Helvetica').fontSize(8).fillColor(C.inkSoft).text(entry, x + 10, y, {
            width: exclColW - 12,
          });
          y += h + 5;
        }
        if (y > maxBottom) maxBottom = y;
      };

      drawExclusionColumn(colA, MARGIN);
      drawExclusionColumn(colB, MARGIN + CONTENT_W / 2 + 10);
      doc.y = maxBottom + 12;

      // ══════════════════════════════════════════════════ SIGN-OFF
      ensureSpace(doc, 92);
      doc.y += 6;
      hairline(doc);
      doc.y += 14;

      const signY = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(C.ink)
        .text(`For ${COMPANY.name}`, MARGIN, signY, { width: CONTENT_W / 2 - 20 });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.muted)
        .text('Authorised signatory', MARGIN, signY + 12);
      doc
        .strokeColor(C.rule)
        .lineWidth(0.75)
        .moveTo(MARGIN, signY + 46)
        .lineTo(MARGIN + 180, signY + 46)
        .stroke();

      const acceptX = MARGIN + CONTENT_W / 2 + 10;
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(C.ink)
        .text('Client acceptance', acceptX, signY, { width: CONTENT_W / 2 - 10 });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.muted)
        .text('Signature & date', acceptX, signY + 12);
      doc
        .strokeColor(C.rule)
        .lineWidth(0.75)
        .moveTo(acceptX, signY + 46)
        .lineTo(acceptX + 180, signY + 46)
        .stroke();

      doc.y = signY + 58;

      // ══════════════════════════════════════════════════ FOOTERS
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        // The footer sits inside the reserve every section kept clear.
        doc.page.margins.bottom = 0;
        const footY = PAGE_H - 30;
        doc
          .strokeColor(C.rule)
          .lineWidth(0.5)
          .moveTo(MARGIN, footY - 8)
          .lineTo(PAGE_W - MARGIN, footY - 8)
          .stroke();
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(C.muted)
          .text(
            `${estimate.estimateNumber}  ·  Valid ${QUOTATION_VALIDITY_DAYS} days from issue  ·  This quotation is an estimate and not a tax invoice.`,
            MARGIN,
            footY,
            { width: CONTENT_W - 60, lineBreak: false }
          );
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor(C.muted)
          .text(`${i + 1} / ${range.count}`, MARGIN, footY, {
            width: CONTENT_W,
            align: 'right',
            lineBreak: false,
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
