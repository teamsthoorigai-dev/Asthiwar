import { estimate } from '@/lib/pricing/engine';
import type { EstimateInput, EstimateResult } from '@/lib/pricing/types';
import type {
  EnquiryDraft,
  EnquirySource,
  EstimateReportDraft,
  EstimateReportResult,
  SubmitResult,
} from '@/lib/leads/types';

/**
 * The boundary for network-shaped actions.
 *
 * Pricing is a pure function and stays local — there is nothing to gain from a
 * round trip. Lead submission is a real POST: it must reach the server, and it
 * must fail loudly when it does not, so the form can say so.
 */

export type EnquiryPayload = EnquiryDraft & {
  source?: EnquirySource;
  estimateId?: string;
};

/** Thrown for any non-2xx response, carrying the server's field errors when it sent them. */
export class SubmissionError extends Error {
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'SubmissionError';
    this.fields = fields;
  }
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new SubmissionError(
      'We could not reach the studio. Check your connection and try again.',
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Fall through to the status check — an unparseable body is still a failure
    // if the status says so, and irrelevant if it does not.
  }

  if (!response.ok) {
    const body = (data ?? {}) as Partial<Extract<SubmitResult, { ok: false }>>;
    throw new SubmissionError(
      body.error ?? 'Something went wrong sending that. Please try again.',
      body.fields,
    );
  }

  return data as T;
}

export function submitEnquiry(payload: EnquiryPayload): Promise<{ ok: true; id: string }> {
  return postJson('/api/enquiries', payload);
}

export function requestEstimateReport(
  payload: EstimateReportDraft,
): Promise<EstimateReportResult> {
  return postJson('/api/estimate-reports', payload);
}

export async function createEstimate(input: EstimateInput): Promise<EstimateResult> {
  return estimate(input);
}
