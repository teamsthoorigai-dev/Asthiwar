/**
 * Layout primitives for the quotation PDF.
 *
 * The previous document positioned everything with hard-coded Y coordinates,
 * which meant a quotation with many line items ran its content underneath the
 * signature block. Everything here flows from `doc.y` and asks `ensureSpace`
 * before drawing, so a document grows onto a new page instead of overlapping.
 */
import type PDFDocument from 'pdfkit';

type Doc = PDFKit.PDFDocument;

export const PAGE_W = 595.28; // A4 at 72dpi
export const PAGE_H = 841.89;
export const MARGIN = 42;
export const CONTENT_W = PAGE_W - MARGIN * 2;
/** Kept clear at the foot of every page for the running footer. */
export const FOOTER_RESERVE = 54;

/**
 * One ink, one accent, and greys. The previous document mixed navy, teal, amber
 * and gold, which read as four competing brands on one page.
 */
export const C = {
  ink: '#0B1220',
  inkSoft: '#3F4C5F',
  muted: '#8895A7',
  rule: '#DDE3EB',
  wash: '#F5F7FA',
  washDeep: '#ECF0F5',
  accent: '#B0793C',
  accentWash: '#FBF5EE',
  paper: '#FFFFFF',
  navy: '#0E1726',
} as const;

/** PDFKit's standard fonts are WinAnsi — the Rupee sign has no glyph there. */
export function cleanText(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';
  return String(text).replace(/₹\s?/g, 'Rs. ');
}

export function money(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (!Number.isFinite(n)) return 'Rs. 0';
  return 'Rs. ' + Math.round(n).toLocaleString('en-IN');
}

export function num(value: number | string | null | undefined, digits = 0): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export function longDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Start a new page when `needed` points would run into the footer reserve. */
export function ensureSpace(doc: Doc, needed: number): void {
  if (doc.y + needed > PAGE_H - FOOTER_RESERVE) {
    doc.addPage();
  }
}

/** A letter-spaced small label above a block of content. */
export function sectionLabel(doc: Doc, text: string, opts: { accent?: boolean } = {}): void {
  ensureSpace(doc, 30);
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(opts.accent ? C.accent : C.muted)
    .text(text.toUpperCase(), MARGIN, doc.y, { characterSpacing: 1.1, width: CONTENT_W });
  doc.y += 3;
  doc
    .strokeColor(C.rule)
    .lineWidth(0.75)
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + CONTENT_W, doc.y)
    .stroke();
  doc.y += 9;
}

export function hairline(doc: Doc, color: string = C.rule, width = 0.75): void {
  doc.strokeColor(color).lineWidth(width).moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_W, doc.y).stroke();
}

export interface Column {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  /** Rendered in the accent colour and bold — for the money column. */
  emphasis?: boolean;
}

/**
 * A table that repeats its header when it spills onto the next page, so a long
 * milestone or specification schedule stays readable.
 */
export function table(
  doc: Doc,
  columns: Column[],
  rows: Array<Record<string, string>>,
  opts: { zebra?: boolean; rowPadding?: number; fontSize?: number } = {}
): void {
  const { zebra = true, rowPadding = 6, fontSize = 8 } = opts;
  const drawHeader = () => {
    const h = 20;
    ensureSpace(doc, h + 24);
    // doc.text() advances doc.y, so the row origin is captured once and every
    // cell is drawn against it — otherwise each column sits lower than the last.
    const top = doc.y;
    doc.rect(MARGIN, top, CONTENT_W, h).fill(C.washDeep);
    let x = MARGIN;
    for (const col of columns) {
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(C.inkSoft)
        .text(col.label.toUpperCase(), x + 7, top + 6.5, {
          width: col.width - 14,
          align: col.align ?? 'left',
          characterSpacing: 0.5,
          lineBreak: false,
        });
      x += col.width;
    }
    doc.y = top + h;
  };

  drawHeader();

  rows.forEach((row, i) => {
    // Measure the tallest cell so multi-line text does not overlap the next row.
    let cellHeight = 0;
    for (const col of columns) {
      const h = doc.font('Helvetica').fontSize(fontSize).heightOfString(row[col.key] ?? '', {
        width: col.width - 14,
      });
      if (h > cellHeight) cellHeight = h;
    }
    const rowHeight = cellHeight + rowPadding * 2;

    if (doc.y + rowHeight > PAGE_H - FOOTER_RESERVE) {
      doc.addPage();
      drawHeader();
    }

    const top = doc.y;
    if (zebra && i % 2 === 1) {
      doc.rect(MARGIN, top, CONTENT_W, rowHeight).fill(C.wash);
    }

    let x = MARGIN;
    for (const col of columns) {
      doc
        .font(col.emphasis ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(fontSize)
        .fillColor(col.emphasis ? C.ink : C.inkSoft)
        .text(row[col.key] ?? '', x + 7, top + rowPadding, {
          width: col.width - 14,
          align: col.align ?? 'left',
        });
      x += col.width;
    }

    doc.y = top + rowHeight;
    doc
      .strokeColor(C.rule)
      .lineWidth(0.5)
      .moveTo(MARGIN, doc.y)
      .lineTo(MARGIN + CONTENT_W, doc.y)
      .stroke();
  });
}

/** A label/value pair stacked vertically, used in the client and project blocks. */
export function stackedField(
  doc: Doc,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
): number {
  doc
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor(C.muted)
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.7, lineBreak: false });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(C.ink)
    .text(value || '—', x, y + 10, { width });
  return doc.y;
}
