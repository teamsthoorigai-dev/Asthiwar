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
