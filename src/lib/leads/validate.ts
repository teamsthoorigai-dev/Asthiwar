import type { EnquiryDraft, EstimateReportDraft } from './types';

/**
 * Server-side validation.
 *
 * The forms validate too, for the sake of the person typing. This exists because
 * a client can send anything, and a lead that reaches the store malformed is a
 * lead nobody can act on.
 */

const MAX = {
  name: 120,
  phone: 20,
  email: 254,
  location: 80,
  projectType: 60,
  message: 4000,
} as const;

/** Ten digits, optionally with +91 / 0 in front and spaces or dashes inside. */
const PHONE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;
/** Deliberately permissive — the goal is to reject obvious junk, not to police addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Digits only, so "+91 90000 00001" and "9000000001" validate the same way. */
function normalisePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export type FieldErrors = Record<string, string>;

export function validateEnquiry(
  body: unknown,
): { ok: true; value: EnquiryDraft } | { ok: false; errors: FieldErrors } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = str(raw.name);
  const phone = normalisePhone(str(raw.phone));
  const email = str(raw.email);
  const location = str(raw.location);
  const projectType = str(raw.projectType);
  const message = str(raw.message);

  if (name.length < 2) errors.name = 'Enter a name of at least 2 characters.';
  else if (name.length > MAX.name) errors.name = 'That name is too long.';

  if (!phone) errors.phone = 'Enter a mobile number.';
  else if (!PHONE.test(phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';

  if (!email) errors.email = 'Enter an email address.';
  else if (!EMAIL.test(email) || email.length > MAX.email)
    errors.email = 'Enter a valid email address.';

  if (!location) errors.location = 'Choose a location.';
  else if (location.length > MAX.location) errors.location = 'That location is not recognised.';

  if (!projectType) errors.projectType = 'Choose a project type.';
  else if (projectType.length > MAX.projectType)
    errors.projectType = 'That project type is not recognised.';

  if (message.length > MAX.message) errors.message = 'Shorten the message to 4,000 characters.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { name, phone, email, location, projectType, message } };
}

export function validateEstimateReport(
  body: unknown,
): { ok: true; value: EstimateReportDraft } | { ok: false; errors: FieldErrors } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const estimateId = str(raw.estimateId);
  const name = str(raw.name);
  const email = str(raw.email);
  const phone = normalisePhone(str(raw.phone));
  const location = str(raw.location);
  const packageKey = str(raw.packageKey);
  const builtUpSqft = Number(raw.builtUpSqft);
  const grandTotal = Number(raw.grandTotal);

  if (!estimateId) errors.estimateId = 'Missing estimate reference.';
  if (name && name.length < 2) errors.name = 'Enter a name of at least 2 characters.';
  if (!email || !EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (phone && !PHONE.test(phone))
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (!Number.isFinite(builtUpSqft) || builtUpSqft <= 0)
    errors.builtUpSqft = 'Missing built-up area.';
  if (!Number.isFinite(grandTotal) || grandTotal <= 0)
    errors.grandTotal = 'Missing estimate total.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { estimateId, name, email, phone, location, packageKey, builtUpSqft, grandTotal },
  };
}
