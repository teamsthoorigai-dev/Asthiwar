import { Request, Response, NextFunction } from 'express';
import { db, enquiries, estimates, eq } from '@asthiwar/database';
import { CreateEnquiryDto } from './enquiries.schema.js';

export async function createEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreateEnquiryDto;

    let estimateId: string | null = null;
    if (data.estimateNumber) {
      const estRows = await db
        .select({ id: estimates.id })
        .from(estimates)
        .where(eq(estimates.estimateNumber, data.estimateNumber.toUpperCase().trim()))
        .limit(1);

      if (estRows.length > 0) {
        estimateId = estRows[0].id;
      }
    }

    // Check if an enquiry record already exists for this estimate
    if (estimateId || data.estimateNumber) {
      const existingEnquiry = await db.query.enquiries.findFirst({
        where: data.estimateNumber
          ? eq(enquiries.estimateNumber, data.estimateNumber.toUpperCase().trim())
          : eq(enquiries.estimateId, estimateId!),
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
        estimateId,
        estimateNumber: data.estimateNumber ? data.estimateNumber.toUpperCase().trim() : null,
        preferredContactTime: data.preferredContactTime ?? null,
        requirementNotes: data.requirementNotes ?? null,
        status: 'NEW',
      })
      .returning();

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
