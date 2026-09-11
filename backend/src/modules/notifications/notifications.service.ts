import {
  db,
  schema,
  eq,
} from '@asthiwar/database';
import {
  NotificationChannel,
} from './notifications.types.js';
import { env } from '../../config/env.js';
import { estimateRefCandidates, quotationPdfPath } from '../calculator/quotation.js';

/**
 * Nothing in this service transmits anything.
 *
 * There is no mail or WhatsApp transport in the dependency tree, so every
 * function here composes a message and records it. Rows are therefore written
 * PENDING — an outbox for a dispatcher that does not exist yet. They were
 * previously written `SENT` with a `sentAt` timestamp, which told operators in
 * the admin console that a customer had been contacted when nobody had.
 *
 * When a real transport is added, send here and set SENT/FAILED on the result.
 */
const NOTHING_IS_DISPATCHED_YET = 'PENDING' as const;

/** A link a customer can actually open. */
function publicQuotationPdfUrl(quotationNumber: string): string {
  return `${env.PUBLIC_BASE_URL}${quotationPdfPath(quotationNumber)}`;
}

export class NotificationError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

function formatINR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs. 0';
  return 'Rs. ' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ----------------------------------------------------
// 1. CUSTOMER ESTIMATE QUOTATION DISPATCH
// ----------------------------------------------------

export async function sendEstimateQuotationNotification(estimateIdOrNumber: string, channels: NotificationChannel[] = ['EMAIL', 'WHATSAPP']) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(estimateIdOrNumber);

  let estimate = isUuid
    ? await db.query.estimates.findFirst({
        where: eq(schema.estimates.id, estimateIdOrNumber),
      })
    : undefined;

  if (!isUuid) {
    // Accept the dash spelling a link would carry as well as the printed number.
    for (const candidate of estimateRefCandidates(estimateIdOrNumber.toUpperCase())) {
      estimate = await db.query.estimates.findFirst({
        where: eq(schema.estimates.estimateNumber, candidate),
      });
      if (estimate) break;
    }
  }

  if (!estimate) {
    throw new NotificationError(404, 'ESTIMATE_NOT_FOUND', `Estimate ${estimateIdOrNumber} not found`);
  }

  const pdfUrl = publicQuotationPdfUrl(estimate.estimateNumber);

  const results = [];

  // 1. Email Channel
  if (channels.includes('EMAIL')) {
    const subject = `ASTHIWAR Construction Quotation — ${estimate.estimateNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #1e3a8a; padding: 16px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0;">ASTHIWAR DESIGN & BUILD</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Turnkey Residential Construction</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Dear <strong>${estimate.customerName}</strong>,</p>
          <p>Thank you for exploring our turnkey construction estimation for your project in <strong>${estimate.plotLocation}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Estimate Reference:</strong> ${estimate.estimateNumber}</p>
            <p style="margin: 4px 0;"><strong>Package Selected:</strong> ${estimate.packageSlug.toUpperCase()}</p>
            <p style="margin: 4px 0;"><strong>Total Built-up Area:</strong> ${estimate.totalBuiltupAreaSqft} sq.ft (${estimate.floorCount})</p>
            <p style="margin: 8px 0 0; font-size: 16px; color: #1e3a8a;"><strong>Total Estimated Cost: ${formatINR(estimate.totalProjectCost)}</strong></p>
          </div>

          <p style="font-size: 13px; color: #64748b;">Includes 10-stage milestone schedule, brand-name materials, structural engineering, and daily site supervisor updates.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${pdfUrl}" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Download Official Quotation PDF
            </a>
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
            Asthiwar Design & Build • Coimbatore • Chennai • Tiruppur • Erode • Pollachi<br/>
            Contact: +91 98765 43210 | info@asthiwar.com
          </p>
        </div>
      </div>
    `;

    const [emailRecord] = await db
      .insert(schema.notifications)
      .values({
        estimateId: estimate.id,
        channel: 'EMAIL',
        recipient: estimate.customerEmail ?? '',
        template: 'ESTIMATE_QUOTATION',
        subject,
        payload: { html, customerName: estimate.customerName, estimateNumber: estimate.estimateNumber },
        status: NOTHING_IS_DISPATCHED_YET,
        sentAt: null,
      })
      .returning();

    results.push(emailRecord);
  }

  // 2. WhatsApp Channel
  if (channels.includes('WHATSAPP')) {
    const message = `🏗️ *ASTHIWAR DESIGN & BUILD*\n\nHello *${estimate.customerName}*,\n\nYour turnkey residential construction estimate is ready!\n\n📋 *Estimate #:* ${estimate.estimateNumber}\n📦 *Package:* ${estimate.packageSlug.toUpperCase()}\n📐 *Built-up Area:* ${estimate.totalBuiltupAreaSqft} sq.ft\n📍 *Location:* ${estimate.plotLocation}\n💰 *Total Cost:* ${formatINR(estimate.totalProjectCost)}\n\n📄 *Download Detailed Quotation & 10-Stage Milestone Schedule:*\n${pdfUrl}\n\nOur team is ready to assist with plot assessment and floor plan design. Reply to this message to connect with our senior architect.`;

    const [waRecord] = await db
      .insert(schema.notifications)
      .values({
        estimateId: estimate.id,
        channel: 'WHATSAPP',
        recipient: estimate.customerPhone,
        template: 'ESTIMATE_QUOTATION',
        subject: 'WhatsApp Quotation Dispatch',
        payload: { message, customerPhone: estimate.customerPhone, estimateNumber: estimate.estimateNumber },
        status: NOTHING_IS_DISPATCHED_YET,
        sentAt: null,
      })
      .returning();

    results.push(waRecord);
  }

  return results;
}

// ----------------------------------------------------
// 2. ADMIN NEW LEAD ALERT DISPATCH
// ----------------------------------------------------

export async function sendAdminNewLeadAlert(enquiryId: string) {
  const enquiry = await db.query.enquiries.findFirst({
    where: eq(schema.enquiries.id, enquiryId),
  });

  if (!enquiry) {
    throw new NotificationError(404, 'ENQUIRY_NOT_FOUND', `Enquiry with ID ${enquiryId} not found`);
  }

  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'sales@asthiwar.com';
  const adminPhone = process.env.ADMIN_ALERT_PHONE || '9876543210';

  const subject = `🚨 [NEW LEAD] Consultation Request: ${enquiry.fullName} (${enquiry.plotLocation})`;
  const message = `🚨 *NEW ASTHIWAR LEAD ALERT*\n\n👤 *Client:* ${enquiry.fullName}\n📞 *Phone:* ${enquiry.phone}\n📧 *Email:* ${enquiry.email ?? 'N/A'}\n📍 *Site Location:* ${enquiry.plotLocation}\n⏰ *Preferred Time:* ${enquiry.preferredContactTime || 'Anytime'}\n📝 *Requirement:* ${enquiry.requirementNotes || 'Standard consultation'}\n${enquiry.estimateNumber ? `📋 *Linked Estimate:* ${enquiry.estimateNumber}` : ''}`;

  // Log Admin Notification
  const [record] = await db
    .insert(schema.notifications)
    .values({
      enquiryId: enquiry.id,
      estimateId: enquiry.estimateId,
      channel: 'EMAIL',
      recipient: adminEmail,
      template: 'NEW_LEAD_ALERT',
      subject,
      payload: { message, enquiryDetails: enquiry },
      status: NOTHING_IS_DISPATCHED_YET,
      sentAt: null,
    })
    .returning();

  return record;
}
