import type { StoredEnquiry, StoredEstimateReport } from './types';

/**
 * Outbound notification seam.
 *
 * No provider is wired yet. Rather than pretend otherwise, every function here
 * reports whether delivery actually happened, and the UI is written against that
 * boolean — a lead is always stored first, so nothing is lost while this is
 * unconfigured.
 *
 * To turn delivery on, set ASTHIWAR_NOTIFY_WEBHOOK to an endpoint that accepts a
 * JSON POST (a transactional email provider, a CRM intake hook, or a workflow
 * runner). Anything more specific belongs behind the same boolean.
 */

const WEBHOOK = process.env.ASTHIWAR_NOTIFY_WEBHOOK;

async function post(payload: unknown): Promise<boolean> {
  if (!WEBHOOK) return false;

  try {
    const response = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch (error) {
    // A failed notification must never fail the request — the lead is already saved.
    console.error('[notify] delivery failed', error);
    return false;
  }
}

export function notifyEnquiry(enquiry: StoredEnquiry): Promise<boolean> {
  return post({ kind: 'enquiry', ...enquiry });
}

export function notifyEstimateReport(report: StoredEstimateReport): Promise<boolean> {
  return post({ kind: 'estimate-report', ...report });
}

/** True when outbound delivery is configured at all. */
export function deliveryConfigured(): boolean {
  return Boolean(WEBHOOK);
}
