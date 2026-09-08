import { notifyEnquiry } from '@/lib/leads/notify';
import { saveEnquiry } from '@/lib/leads/store';
import type { EnquirySource, SubmitResult } from '@/lib/leads/types';
import { validateEnquiry } from '@/lib/leads/validate';

/** Uses node:fs through the store, so it cannot run on the edge runtime. */
export const runtime = 'nodejs';

const SOURCES: readonly EnquirySource[] = ['contact-form', 'cost-calculator'];

function isSource(value: unknown): value is EnquirySource {
  return typeof value === 'string' && (SOURCES as readonly string[]).includes(value);
}

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

  const result = validateEnquiry(body);
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

  const raw = body as Record<string, unknown>;
  const source: EnquirySource = isSource(raw.source) ? raw.source : 'contact-form';
  const estimateId = typeof raw.estimateId === 'string' ? raw.estimateId.trim() : '';

  try {
    const stored = await saveEnquiry({
      ...result.value,
      source,
      ...(estimateId ? { estimateId } : {}),
    });

    // Storage is what makes the lead safe; notification is best-effort on top.
    await notifyEnquiry(stored);

    return Response.json({ ok: true, id: stored.id } satisfies SubmitResult, { status: 201 });
  } catch (error) {
    console.error('[enquiries] could not store enquiry', error);
    return Response.json(
      {
        ok: false,
        error: 'We could not record that enquiry. Please call the studio directly.',
      } satisfies SubmitResult,
      { status: 500 },
    );
  }
}
