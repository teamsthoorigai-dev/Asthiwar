import { apiClient, RequestOptions } from './client';

export interface EnquiryInput {
  fullName: string;
  phone: string;
  email?: string;
  plotLocation: string;
  estimateNumber?: string;
  preferredContactTime?: string;
  requirementNotes?: string;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  enquiryId?: number;
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
