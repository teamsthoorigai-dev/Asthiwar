import { apiClient, RequestOptions } from './client';

export interface EnquiryInput {
  fullName: string;
  phone: string;
  email?: string;
  plotLocation: string;
  estimateNumber?: string;
  /** Required alongside estimateNumber for the enquiry to be linked to that estimate. */
  accessToken?: string;
  preferredContactTime?: string;
  requirementNotes?: string;
}

/**
 * What the caller actually receives. `apiClient` unwraps the `{ success, data }`
 * envelope, so this is the `data` object — the previous shape here
 * (`{ success, message, enquiryId }`) described the envelope and never existed
 * at runtime. Nothing read it, so the mismatch stayed hidden.
 */
export interface EnquiryResponse {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  estimateNumber: string | null;
  status: string;
  createdAt: string;
}

/**
 * POST /api/v1/enquiries
 * Submit lead consultation / assessment request
 */
export async function submitEnquiry(
  input: EnquiryInput,
  options?: RequestOptions
): Promise<EnquiryResponse> {
  return apiClient<EnquiryResponse>('/api/v1/enquiries', {
    method: 'POST',
    body: input,
    ...options,
  });
}
