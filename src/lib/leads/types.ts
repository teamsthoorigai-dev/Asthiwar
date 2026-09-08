/**
 * Lead capture — shared shapes.
 *
 * These cross the network boundary, so they are kept free of anything
 * server-only and are imported by both the client forms and the route handlers.
 */

export type EnquirySource = 'contact-form' | 'cost-calculator';

/** What a client is allowed to send. The server assigns id, receivedAt and source metadata. */
export type EnquiryDraft = {
  name: string;
  phone: string;
  email: string;
  location: string;
  projectType: string;
  message: string;
};

/** What is actually persisted. */
export type StoredEnquiry = EnquiryDraft & {
  id: string;
  receivedAt: string;
  source: EnquirySource;
  /** Set when the enquiry arrived carrying a calculator estimate. */
  estimateId?: string;
};

/** A request to have an estimate report sent on. */
export type EstimateReportDraft = {
  estimateId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  packageKey: string;
  builtUpSqft: number;
  grandTotal: number;
};

export type StoredEstimateReport = EstimateReportDraft & {
  id: string;
  receivedAt: string;
  /**
   * Whether an email actually went out. False whenever no delivery provider is
   * configured — the record is still kept so the lead is never lost.
   */
  delivered: boolean;
};

export type SubmitOk = { ok: true; id: string };
export type SubmitError = { ok: false; error: string; fields?: Record<string, string> };
export type SubmitResult = SubmitOk | SubmitError;

/** Result of an estimate-report request, including whether email delivery ran. */
export type EstimateReportResult = SubmitOk & { delivered: boolean };
