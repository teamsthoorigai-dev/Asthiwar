import { Request, Response, NextFunction } from 'express';
import { db, enquiries, eq } from '@asthiwar/database';
import { CreateEnquiryDto } from './enquiries.schema.js';
import { sendAdminNewLeadAlert } from '../notifications/notifications.service.js';
import { findEstimateByRef, isAccessLinkExpired, tokensMatch } from '../calculator/quotation.js';
import { loggableError } from '../../services/db-errors.js';

/**
 * The estimate this enquiry may attach to, or null.
 *
 * Only the estimate's access token authorises it. Every persisted estimate raises
 * a CRM lead, and estimate numbers are a sequence, so a number alone would let
 * anyone rewrite a stranger's lead. A matching phone number was accepted here too,
 * but a phone number is not a secret — and answering 200 for a match and 201 for a
 * miss told a caller which phone number belonged to which quotation.
 */
async function resolveLinkedEstimate(data: CreateEnquiryDto) {
  const token = data.accessToken?.trim();
  if (!data.estimateNumber || !token) return null;

  const estimate = await findEstimateByRef(data.estimateNumber);
  if (!estimate || !tokensMatch(token, estimate.accessToken) || isAccessLinkExpired(estimate)) {
    return null;
  }

  return { id: estimate.id, estimateNumber: estimate.estimateNumber };
}

export async function createEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreateEnquiryDto;
    const linkedEstimate = await resolveLinkedEstimate(data);

    if (linkedEstimate) {
      const existingEnquiry = await db.query.enquiries.findFirst({
        where: eq(enquiries.estimateId, linkedEstimate.id),
      });

      if (existingEnquiry) {
        const [updated] = await db
          .update(enquiries)
          .set({
            fullName: data.fullName || existingEnquiry.fullName,
            phone: data.phone || existingEnquiry.phone,
            email: data.email || existingEnquiry.email,
            plotLocation: data.plotLocation || existingEnquiry.plotLocation,
            preferredContactTime: data.preferredContactTime ?? existingEnquiry.preferredContactTime,
            requirementNotes: data.requirementNotes ?? existingEnquiry.requirementNotes,
            updatedAt: new Date(),
          })
          .where(eq(enquiries.id, existingEnquiry.id))
          .returning();

        // Trigger instant email notification via Resend to configured email
        sendAdminNewLeadAlert(updated.id).catch((err) => {
          console.error('[Enquiries] Failed to send email alert for updated lead:', loggableError(err));
        });

        res.status(200).json({
          success: true,
          message: 'Consultation request submitted successfully. Our team will contact you shortly.',
          data: {
            id: updated.id,
            fullName: updated.fullName,
            phone: updated.phone,
            email: updated.email,
            estimateNumber: updated.estimateNumber,
            status: updated.status,
            createdAt: updated.createdAt,
          },
        });
        return;
      }
    }

    const [newEnquiry] = await db
      .insert(enquiries)
      .values({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        plotLocation: data.plotLocation,
        estimateId: linkedEstimate?.id ?? null,
        estimateNumber: linkedEstimate?.estimateNumber ?? null,
        preferredContactTime: data.preferredContactTime ?? null,
        requirementNotes: data.requirementNotes ?? null,
        status: 'NEW',
      })
      .returning();

    // Trigger instant email notification via Resend to configured email
    sendAdminNewLeadAlert(newEnquiry.id).catch((err) => {
      console.error('[Enquiries] Failed to send email alert for new lead:', loggableError(err));
    });

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully. Our team will contact you shortly.',
      data: {
        id: newEnquiry.id,
        fullName: newEnquiry.fullName,
        phone: newEnquiry.phone,
        email: newEnquiry.email,
        estimateNumber: newEnquiry.estimateNumber,
        status: newEnquiry.status,
        createdAt: newEnquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
