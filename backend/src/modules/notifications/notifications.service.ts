import {
  db,
  schema,
  eq,
} from '@asthiwar/database';
import {
  NotificationChannel,
} from './notifications.types.js';
import { env } from '../../config/env.js';
import { estimateRefCandidates, extendQuotationLink, quotationPdfPath } from '../calculator/quotation.js';
import { sendEmail, isResendConfigured } from '../../services/resend.service.js';
import { sendWhatsAppMessage } from '../../services/whatsapp.service.js';
import { loggableError } from '../../services/db-errors.js';
import {
  renderQuotationEmail,
  renderAdminLeadAlertEmail,
  renderCustomerConfirmationEmail,
} from '../email/email-templates.js';

/**
 * Asthiwar Notification Dispatch Service.
 *
 * EMAIL channel: Dispatches live transactional emails via Resend when RESEND_API_KEY
 * is configured. If not configured, records remain PENDING in the outbox table.
 *
 * WHATSAPP channel: WhatsApp provider transport is not yet connected, so WhatsApp
 * messages remain PENDING in the outbox table for operator review or future webhook dispatch.
 */
const DEFAULT_PENDING_STATUS = 'PENDING' as const;

/**
 * A link a customer can actually open.
 *
 * Carries the estimate's access token: the quotation number alone no longer
 * authorises reading it, so a link built without the token 404s for the very
 * customer it was composed for.
 */
function publicQuotationPdfUrl(quotationNumber: string, accessToken: string): string {
  return `${env.PUBLIC_BASE_URL}${quotationPdfPath(quotationNumber, accessToken)}`;
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

  // Staff are sending this link now, so it must not be one that has already lapsed.
  await extendQuotationLink(estimate.id);
  const pdfUrl = publicQuotationPdfUrl(estimate.estimateNumber, estimate.accessToken);

  const results = [];

  // 1. Email Channel
  if (channels.includes('EMAIL')) {
    const formattedCost = formatINR(estimate.totalProjectCost);
    const emailContent = renderQuotationEmail({
      customerName: estimate.customerName,
      plotLocation: estimate.plotLocation,
      estimateNumber: estimate.estimateNumber,
      packageSlug: estimate.packageSlug,
      totalBuiltupAreaSqft: estimate.totalBuiltupAreaSqft,
      floorCount: estimate.floorCount,
      totalProjectCostFormatted: formattedCost,
      pdfUrl,
    });

    const recipient = estimate.customerEmail?.trim() ?? '';
    let emailStatus: 'PENDING' | 'SENT' | 'FAILED' = DEFAULT_PENDING_STATUS;
    let sentAt: Date | null = null;
    let errorMessage: string | null = null;

    if (recipient && isResendConfigured()) {
      const emailResult = await sendEmail({
        to: recipient,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (emailResult.sent) {
        emailStatus = 'SENT';
        sentAt = new Date();
      } else if (emailResult.reason === 'FAILED') {
        emailStatus = 'FAILED';
        errorMessage = emailResult.error ?? 'Resend dispatch failed';
      }
    }

    const [emailRecord] = await db
      .insert(schema.notifications)
      .values({
        estimateId: estimate.id,
        channel: 'EMAIL',
        recipient,
        template: 'ESTIMATE_QUOTATION',
        subject: emailContent.subject,
        payload: {
          html: emailContent.html,
          customerName: estimate.customerName,
          estimateNumber: estimate.estimateNumber,
        },
        status: emailStatus,
        errorMessage,
        sentAt,
      })
      .returning();

    results.push(emailRecord);
  }

  // 2. WhatsApp Channel
  if (channels.includes('WHATSAPP')) {
    const message = `🏗️ *ASTHIWAR DESIGN & BUILD*\n\nHello *${estimate.customerName}*,\n\nYour turnkey residential construction estimate is ready!\n\n📋 *Estimate #:* ${estimate.estimateNumber}\n📦 *Package:* ${estimate.packageSlug.toUpperCase()}\n📐 *Built-up Area:* ${estimate.totalBuiltupAreaSqft} sq.ft\n📍 *Location:* ${estimate.plotLocation}\n💰 *Total Cost:* ${formatINR(estimate.totalProjectCost)}\n\n📄 *Download Detailed Quotation & 10-Stage Milestone Schedule:*\n${pdfUrl}\n\nOur team is ready to assist with plot assessment and floor plan design. Reply to this message to connect with our senior architect.`;

    const waResult = await sendWhatsAppMessage({
      to: estimate.customerPhone,
      message,
    }).catch(() => ({ sent: false, reason: 'FAILED' as const }));

    const waStatus = waResult.sent ? 'SENT' : DEFAULT_PENDING_STATUS;
    const waSentAt = waResult.sent ? new Date() : null;
    const waError = (waResult as any).error ?? null;

    const [waRecord] = await db
      .insert(schema.notifications)
      .values({
        estimateId: estimate.id,
        channel: 'WHATSAPP',
        recipient: estimate.customerPhone,
        template: 'ESTIMATE_QUOTATION',
        subject: 'WhatsApp Quotation Dispatch',
        payload: {
          message,
          customerPhone: estimate.customerPhone,
          estimateNumber: estimate.estimateNumber,
          provider: (waResult as any).provider ?? null,
        },
        status: waStatus,
        errorMessage: waError,
        sentAt: waSentAt,
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

  const recipientEmail =
    env.CONTACT_RECIPIENT_EMAIL ||
    env.ADMIN_ALERT_EMAIL ||
    process.env.CONTACT_RECIPIENT_EMAIL ||
    process.env.ADMIN_ALERT_EMAIL ||
    'contact@asthiwar.com';

  const emailContent = renderAdminLeadAlertEmail({
    fullName: enquiry.fullName,
    phone: enquiry.phone,
    email: enquiry.email,
    plotLocation: enquiry.plotLocation,
    preferredContactTime: enquiry.preferredContactTime,
    requirementNotes: enquiry.requirementNotes,
    estimateNumber: enquiry.estimateNumber,
  });

  let alertStatus: 'PENDING' | 'SENT' | 'FAILED' = DEFAULT_PENDING_STATUS;
  let sentAt: Date | null = null;
  let errorMessage: string | null = null;

  if (isResendConfigured()) {
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: enquiry.email || undefined,
    });

    if (emailResult.sent) {
      alertStatus = 'SENT';
      sentAt = new Date();
    } else if (emailResult.reason === 'FAILED') {
      alertStatus = 'FAILED';
      errorMessage = emailResult.error ?? 'Resend dispatch failed';
    }
  }

  // Log Admin Notification
  const [record] = await db
    .insert(schema.notifications)
    .values({
      enquiryId: enquiry.id,
      estimateId: enquiry.estimateId,
      channel: 'EMAIL',
      recipient: recipientEmail,
      template: 'NEW_LEAD_ALERT',
      subject: emailContent.subject,
      payload: {
        message: emailContent.text,
        html: emailContent.html,
        enquiryDetails: enquiry,
      },
      status: alertStatus,
      errorMessage,
      sentAt,
    })
    .returning();

  // Log WhatsApp Admin Notification row
  const adminWhatsAppPhone =
    env.WHATSAPP_RECIPIENT_PHONE ||
    process.env.WHATSAPP_RECIPIENT_PHONE ||
    process.env.ADMIN_ALERT_PHONE ||
    '919488440123';

  const waLeadMessage =
    `🚨 *NEW ASTHIWAR LEAD ALERT*\n\n` +
    `👤 *Client:* ${enquiry.fullName}\n` +
    `📞 *Phone:* ${enquiry.phone}\n` +
    `📧 *Email:* ${enquiry.email ?? 'N/A'}\n` +
    `📍 *Site Location:* ${enquiry.plotLocation}\n` +
    `⏰ *Preferred Time:* ${enquiry.preferredContactTime || 'Anytime'}\n` +
    `📝 *Requirement:* ${enquiry.requirementNotes || 'Standard consultation'}\n` +
    (enquiry.estimateNumber ? `📋 *Linked Estimate:* ${enquiry.estimateNumber}\n` : '');

  // 2. Dispatch WhatsApp Admin Notification directly in background
  const waResult = await sendWhatsAppMessage({
    to: adminWhatsAppPhone,
    message: waLeadMessage,
  }).catch((err) => {
    console.error('[Notifications] WhatsApp background dispatch error:', loggableError(err));
    return { sent: false, reason: 'FAILED' as const, error: String(err), provider: undefined };
  });

  const waStatus = waResult.sent ? 'SENT' : (waResult.reason === 'FAILED' ? 'FAILED' : DEFAULT_PENDING_STATUS);
  const waSentAt = waResult.sent ? new Date() : null;
  const waError = waResult.error ?? null;

  await db
    .insert(schema.notifications)
    .values({
      enquiryId: enquiry.id,
      estimateId: enquiry.estimateId,
      channel: 'WHATSAPP',
      recipient: adminWhatsAppPhone,
      template: 'NEW_LEAD_ALERT',
      subject: 'WhatsApp Admin Lead Alert',
      payload: {
        message: waLeadMessage,
        whatsappUrl: `https://wa.me/${adminWhatsAppPhone}?text=${encodeURIComponent(waLeadMessage)}`,
        enquiryDetails: enquiry,
        provider: waResult.provider ?? null,
      },
      status: waStatus,
      errorMessage: waError,
      sentAt: waSentAt,
    })
    .catch((err) => {
      console.error('[Notifications] Failed to record WhatsApp notification row:', loggableError(err));
    });

  return record;
}

// ----------------------------------------------------
// 3. CUSTOMER ENQUIRY CONFIRMATION DISPATCH
// ----------------------------------------------------

export async function sendCustomerEnquiryConfirmation(enquiryId: string) {
  const enquiry = await db.query.enquiries.findFirst({
    where: eq(schema.enquiries.id, enquiryId),
  });

  if (!enquiry || !enquiry.email) {
    return null;
  }

  const emailContent = renderCustomerConfirmationEmail({
    fullName: enquiry.fullName,
    plotLocation: enquiry.plotLocation,
    estimateNumber: enquiry.estimateNumber,
  });

  let status: 'PENDING' | 'SENT' | 'FAILED' = DEFAULT_PENDING_STATUS;
  let sentAt: Date | null = null;
  let errorMessage: string | null = null;

  if (isResendConfigured()) {
    const emailResult = await sendEmail({
      to: enquiry.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailResult.sent) {
      status = 'SENT';
      sentAt = new Date();
    } else if (emailResult.reason === 'FAILED') {
      status = 'FAILED';
      errorMessage = emailResult.error ?? 'Resend dispatch failed';
    }
  }

  const [record] = await db
    .insert(schema.notifications)
    .values({
      enquiryId: enquiry.id,
      estimateId: enquiry.estimateId,
      channel: 'EMAIL',
      recipient: enquiry.email,
      template: 'CUSTOMER_CONFIRMATION',
      subject: emailContent.subject,
      payload: {
        message: emailContent.text,
        html: emailContent.html,
      },
      status,
      errorMessage,
      sentAt,
    })
    .returning();

  return record;
}

// ----------------------------------------------------
// 4. RETRY / DISPATCH PENDING NOTIFICATION
// ----------------------------------------------------

export async function resendNotification(notificationId: string) {
  const notification = await db.query.notifications.findFirst({
    where: eq(schema.notifications.id, notificationId),
  });

  if (!notification) {
    throw new NotificationError(404, 'NOTIFICATION_NOT_FOUND', `Notification ${notificationId} not found`);
  }

  if (notification.channel !== 'EMAIL') {
    throw new NotificationError(400, 'UNSUPPORTED_CHANNEL', `Resending channel ${notification.channel} is not currently supported`);
  }

  if (!notification.recipient) {
    throw new NotificationError(400, 'MISSING_RECIPIENT', 'Notification does not have a recipient email');
  }

  const payload = (notification.payload as Record<string, unknown>) || {};
  const html = typeof payload.html === 'string' ? payload.html : '';
  const text = typeof payload.message === 'string' ? payload.message : undefined;

  const result = await sendEmail({
    to: notification.recipient,
    subject: notification.subject || 'ASTHIWAR Notification',
    html,
    text,
  });

  const nextStatus = result.sent ? 'SENT' : (result.reason === 'FAILED' ? 'FAILED' : 'PENDING');
  const sentAt = result.sent ? new Date() : null;
  const errorMessage = result.error || null;

  const [updated] = await db
    .update(schema.notifications)
    .set({
      status: nextStatus,
      errorMessage,
      sentAt,
    })
    .where(eq(schema.notifications.id, notificationId))
    .returning();

  return updated;
}
