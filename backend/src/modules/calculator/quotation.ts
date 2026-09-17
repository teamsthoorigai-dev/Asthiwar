/**
 * Quotation identity and the standing commercial text that appears on every
 * quotation. The PDF and the JSON estimate both read from here, so the terms a
 * customer sees on screen and the terms printed on their document cannot drift.
 */
import crypto from 'node:crypto';
import { db, estimates, eq, sql } from '@asthiwar/database';

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
export function quotationPdfPath(quotationNumber: string, accessToken: string): string {
  return (
    `/api/v1/calculator/estimate/${urlSafeQuotationNumber(quotationNumber)}/pdf` +
    `?t=${encodeURIComponent(accessToken)}`
  );
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

// ---------------------------------------------------------------------------
// Quotation access
// ---------------------------------------------------------------------------

/**
 * The secret half of a quotation link.
 *
 * The printed number is a sequence, so it identifies a quotation but cannot
 * protect one. This is what a customer's link carries alongside it.
 */
export function generateEstimateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** A quotation could not be reached, for whichever of the two possible reasons. */
export class EstimateAccessError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'EstimateAccessError';
  }
}

/** Look a quotation up by id, printed number, or the dash spelling of it. */
export async function findEstimateByRef(ref: string) {
  const trimmed = ref.trim();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);

  if (isUuid) {
    const [row] = await db.select().from(estimates).where(eq(estimates.id, trimmed)).limit(1);
    return row ?? null;
  }

  for (const candidate of estimateRefCandidates(trimmed.toUpperCase())) {
    const [row] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.estimateNumber, candidate))
      .limit(1);
    if (row) return row;
  }

  return null;
}

/**
 * Constant-time token comparison.
 *
 * `===` on a secret leaks its prefix through timing, which is exactly the
 * property that makes a 64-character token guessable one character at a time.
 * Lengths are compared first because timingSafeEqual throws on a mismatch.
 */
export function tokensMatch(supplied: string, stored: string): boolean {
  const a = Buffer.from(supplied, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Resolve a quotation for an unauthenticated caller.
 *
 * Both failures answer 404 with one message. Saying "wrong token" on a number
 * that exists, and "not found" on one that does not, would turn this endpoint
 * back into the oracle the access token exists to close: an attacker walking the
 * sequence would still learn exactly which quotations are real, and how many
 * customers there are.
 */
export async function resolveEstimateForPublicAccess(ref: string, suppliedToken: unknown) {
  const estimate = await findEstimateByRef(ref);
  const token = typeof suppliedToken === 'string' ? suppliedToken.trim() : '';

  if (!estimate || !token || !tokensMatch(token, estimate.accessToken)) {
    throw new EstimateAccessError(
      404,
      'ESTIMATE_NOT_FOUND',
      'That quotation could not be found. Please open it using the full link from your estimate.'
    );
  }

  // Said plainly only to someone holding the right token — it reveals nothing
  // to a caller who does not already have the link.
  if (isAccessLinkExpired(estimate)) {
    throw new EstimateAccessError(
      410,
      'QUOTATION_LINK_EXPIRED',
      'This quotation link has expired. Please contact us and we will send you a fresh one.'
    );
  }

  return estimate;
}

// ---------------------------------------------------------------------------
// Link lifetime
// ---------------------------------------------------------------------------

/**
 * How long a customer's quotation link keeps working.
 *
 * Links never expired and could not be withdrawn, so a forwarded message exposed
 * the customer's details indefinitely. Longer than the quotation's own 30-day
 * validity, so a customer can still refer back to it while deciding.
 */
export const QUOTATION_LINK_VALIDITY_DAYS = 90;

export function quotationLinkExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + QUOTATION_LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

export function isAccessLinkExpired(estimate: { accessTokenExpiresAt: Date | string }): boolean {
  return new Date(estimate.accessTokenExpiresAt).getTime() <= Date.now();
}

/**
 * Issue a new link for a quotation. The previous token stops working at once.
 * For a link that was forwarded where it should not have been.
 */
export async function reissueQuotationLink(estimateId: string) {
  const [updated] = await db
    .update(estimates)
    .set({
      accessToken: generateEstimateAccessToken(),
      accessTokenExpiresAt: quotationLinkExpiry(),
      updatedAt: new Date(),
    })
    .where(eq(estimates.id, estimateId))
    .returning({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      accessToken: estimates.accessToken,
      accessTokenExpiresAt: estimates.accessTokenExpiresAt,
    });
  return updated ?? null;
}

/**
 * Keep the current link working for another full period. Used when staff send
 * the quotation, so the link in that message is never already expired.
 */
export async function extendQuotationLink(estimateId: string): Promise<Date> {
  const expiresAt = quotationLinkExpiry();
  await db
    .update(estimates)
    .set({ accessTokenExpiresAt: expiresAt })
    .where(eq(estimates.id, estimateId));
  return expiresAt;
}

/**
 * The stored snapshot, as served to the customer. The snapshot was written with
 * the token it was issued under; after a reissue that value is stale, and the
 * caller already holds the live one, so it is not repeated back.
 */
export function publicSnapshotOf(snapshot: unknown): unknown {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const { accessToken: _omitted, ...rest } = snapshot as Record<string, unknown>;
  return rest;
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
