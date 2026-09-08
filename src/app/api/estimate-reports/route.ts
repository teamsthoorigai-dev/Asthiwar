import { notifyEstimateReport } from '@/lib/leads/notify';
import { saveEstimateReport } from '@/lib/leads/store';
import type { EstimateReportResult, SubmitResult } from '@/lib/leads/types';
import { validateEstimateReport } from '@/lib/leads/validate';

/** Uses node:fs through the store, so it cannot run on the edge runtime. */
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: 'Send a JSON body.' } satisfies SubmitResult,
      { status: 400 },
    );
  }

  const result = validateEstimateReport(body);
  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: 'Some details need correcting.',
        fields: result.errors,
      } satisfies SubmitResult,
      { status: 422 },
    );
  }

  try {
    // Recorded first, so the request survives a delivery provider being absent
    // or down. `delivered` tells the client which of the two happened.
    const stored = await saveEstimateReport({ ...result.value, delivered: false });
    const delivered = await notifyEstimateReport(stored);

    return Response.json(
      { ok: true, id: stored.id, delivered } satisfies EstimateReportResult,
      { status: 201 },
    );
  } catch (error) {
    console.error('[estimate-reports] could not store report request', error);
    return Response.json(
      {
        ok: false,
        error: 'We could not record that request. Please call the studio directly.',
      } satisfies SubmitResult,
      { status: 500 },
    );
  }
}
