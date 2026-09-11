/**
 * Quotation identity and the standing commercial text that appears on every
 * quotation. The PDF and the JSON estimate both read from here, so the terms a
 * customer sees on screen and the terms printed on their document cannot drift.
 */
import { db, estimates, sql } from '@asthiwar/database';

/**
 * Quotation number: AW/2026/O/0001
 *   AW   — Asthiwar
 *   2026 — calendar year of issue
 *   O    — origination channel (O = Online)
 *   0001 — sequence within that year and channel, zero-padded to 4
 */
export const QUOTATION_PREFIX = 'AW';

/** Channels a quotation can originate from. */
export const QUOTATION_CHANNELS = { ONLINE: 'O' } as const;
export type QuotationChannel = (typeof QUOTATION_CHANNELS)[keyof typeof QUOTATION_CHANNELS];

/** Shown on a preview, which must never consume a real sequence number. */
export const DRAFT_QUOTATION_NUMBER = `${QUOTATION_PREFIX}/${new Date().getFullYear()}/${QUOTATION_CHANNELS.ONLINE}/DRAFT`;

export function formatQuotationNumber(year: number, channel: QuotationChannel, sequence: number): string {
  return `${QUOTATION_PREFIX}/${year}/${channel}/${String(sequence).padStart(4, '0')}`;
}

/**
 * The next number in this year's sequence.
 *
 * Derived from the highest sequence already issued rather than from a row count,
 * so deleting a quotation from the middle of the run does not shift later
 * numbers. Deleting the most recent one does free its number for reissue —
 * acceptable here because nothing in the app deletes estimates. Quotations
 * issued under the older EST-YYYY-XXXXXX scheme are ignored by the LIKE, so both
 * schemes coexist and old documents keep resolving.
 *
 * The caller retries on collision: `estimates.estimate_number` is UNIQUE, which
 * is the real guard against two concurrent requests claiming one number.
 */
export async function nextQuotationNumber(
  channel: QuotationChannel = QUOTATION_CHANNELS.ONLINE,
  attempt = 0
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${QUOTATION_PREFIX}/${year}/${channel}/`;

  const rows = await db
    .select({ n: estimates.estimateNumber })
    .from(estimates)
    .where(sql`${estimates.estimateNumber} LIKE ${prefix + '%'}`);

  let highest = 0;
  for (const row of rows) {
    const sequence = Number.parseInt(row.n.slice(prefix.length), 10);
    if (Number.isFinite(sequence) && sequence > highest) highest = sequence;
  }

  return formatQuotationNumber(year, channel, highest + 1 + attempt);
}

/**
 * The URL-safe spelling of a quotation number: AW-2026-O-0001.
 *
 * The printed number uses slashes, which only survive a URL path when the caller
 * percent-encodes them. Anything that builds a link by hand — a notification
 * template, a pasted address — will not, and would 404. Links should therefore
 * use this form; lookups accept either.
 */
export function urlSafeQuotationNumber(quotationNumber: string): string {
  return quotationNumber.replace(/\//g, '-');
}

/**
 * The path that serves a quotation's PDF.
 *
 * Anything that links to a quotation must build the link here. Templates used to
 * interpolate the printed number directly — `/estimate/AW/2026/O/0001/pdf` — which
 * is four path segments, matches no route, and 404s for every customer who clicks
 * it. Going through `urlSafeQuotationNumber` is the whole point of that function.
 */
export function quotationPdfPath(quotationNumber: string): string {
  return `/api/v1/calculator/estimate/${urlSafeQuotationNumber(quotationNumber)}/pdf`;
}

/**
 * Every stored key an inbound reference could mean, in priority order.
 * The literal is tried first so an older EST-YYYY-XXXXXX number — which is
 * legitimately dash-separated — is never rewritten into something else.
 */
export function estimateRefCandidates(ref: string): string[] {
  const trimmed = ref.trim();
  const candidates = [trimmed];

  const urlSafe = new RegExp(`^${QUOTATION_PREFIX}-\\d{4}-[A-Za-z]-\\w+$`);
  if (urlSafe.test(trimmed)) {
    candidates.push(trimmed.replace(/-/g, '/'));
  }

  return candidates;
}

/** How long a quotation stands, in days. Printed on the document and in term 1. */
export const QUOTATION_VALIDITY_DAYS = 30;

export const QUOTATION_TERMS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Quotation Validity',
    body: `Valid for ${QUOTATION_VALIDITY_DAYS} calendar days from issuance.`,
  },
  {
    title: 'Rate Basis',
    body: 'Calculated on outer-to-outer built-up area (including balconies and parking) upon project completion.',
  },
  {
    title: 'Payment Schedule',
    body: 'Payment is due within 3 calendar days of stage completion intimation by the builder.',
  },
  {
    title: 'Drawings & Approvals',
    body: 'Floor plans, elevations, electrical, and plumbing layouts must be mutually approved prior to construction.',
  },
  {
    title: 'Variations & Modifications',
    body: 'Any revisions to designs, materials, or scope after commencement require written approval and will incur additional charges.',
  },
];

/** Work outside the civil contract, billed separately or arranged by the client. */
export const QUOTATION_EXCLUSIONS: readonly string[] = [
  'Elevation features',
  'Outer area development (setbacks and landscaping)',
  'Interior design and carpentry works',
  'DTCP and building permit approvals',
  'EB connection fees and utility bills',
  'Gas connection and utility charges',
  'Water connection and charges',
  'Borewell drilling and bore piping',
  'Water pumps and motors',
  'Home and electrical appliances (TV, fridge, AC, dishwasher, chimney)',
  'VLT and property taxes',
  'Sewage connections',
];

/** The date a quotation issued on `issuedAt` stops standing. */
export function quotationValidUntil(issuedAt: Date | string): Date {
  const issued = new Date(issuedAt);
  const until = new Date(issued);
  until.setDate(until.getDate() + QUOTATION_VALIDITY_DAYS);
  return until;
}
