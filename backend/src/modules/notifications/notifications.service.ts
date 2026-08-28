import {
  db,
  schema,
  eq,
  desc,
  and,
  count,
} from '@asthiwar/database';
import {
  NotificationChannel,
  NotificationTemplate,
} from './notifications.types.js';

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

  const estimate = await db.query.estimates.findFirst({
    where: isUuid
      ? eq(schema.estimates.id, estimateIdOrNumber)
      : eq(schema.estimates.estimateNumber, estimateIdOrNumber),
  });

  if (!estimate) {
    throw new NotificationError(404, 'ESTIMATE_NOT_FOUND', `Estimate ${estimateIdOrNumber} not found`);
  }

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
            <a href="https://asthiwar.com/estimate/${estimate.estimateNumber}/pdf" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
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
        status: 'SENT',
        sentAt: new Date(),
      })
      .returning();

    results.push(emailRecord);
  }

  // 2. WhatsApp Channel
  if (channels.includes('WHATSAPP')) {
    const message = `🏗️ *ASTHIWAR DESIGN & BUILD*\n\nHello *${estimate.customerName}*,\n\nYour turnkey residential construction estimate is ready!\n\n📋 *Estimate #:* ${estimate.estimateNumber}\n📦 *Package:* ${estimate.packageSlug.toUpperCase()}\n📐 *Built-up Area:* ${estimate.totalBuiltupAreaSqft} sq.ft\n📍 *Location:* ${estimate.plotLocation}\n💰 *Total Cost:* ${formatINR(estimate.totalProjectCost)}\n\n📄 *Download Detailed Quotation & 10-Stage Milestone Schedule:*\nhttps://asthiwar.com/estimate/${estimate.estimateNumber}/pdf\n\nOur team is ready to assist with plot assessment and floor plan design. Reply to this message to connect with our senior architect.`;

    const [waRecord] = await db
      .insert(schema.notifications)
      .values({
        estimateId: estimate.id,
        channel: 'WHATSAPP',
        recipient: estimate.customerPhone,
        template: 'ESTIMATE_QUOTATION',
        subject: 'WhatsApp Quotation Dispatch',
        payload: { message, customerPhone: estimate.customerPhone, estimateNumber: estimate.estimateNumber },
        status: 'SENT',
        sentAt: new Date(),
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
      status: 'SENT',
      sentAt: new Date(),
    })
    .returning();

  return record;
}

// ----------------------------------------------------
// 3. NOTIFICATION LOGS & HISTORY
// ----------------------------------------------------

export async function getNotificationLogs(query: {
  page?: number;
  limit?: number;
  channel?: NotificationChannel;
  template?: NotificationTemplate;
  estimateId?: string;
  enquiryId?: string;
}) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.channel) conditions.push(eq(schema.notifications.channel, query.channel));
  if (query.template) conditions.push(eq(schema.notifications.template, query.template));
  if (query.estimateId) conditions.push(eq(schema.notifications.estimateId, query.estimateId));
  if (query.enquiryId) conditions.push(eq(schema.notifications.enquiryId, query.enquiryId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: count() })
    .from(schema.notifications)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  const items = await db
    .select()
    .from(schema.notifications)
    .where(whereClause)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function resendNotification(notificationId: string) {
  const record = await db.query.notifications.findFirst({
    where: eq(schema.notifications.id, notificationId),
  });

  if (!record) {
    throw new NotificationError(404, 'NOTIFICATION_NOT_FOUND', `Notification ${notificationId} not found`);
  }

  const [updated] = await db
    .update(schema.notifications)
    .set({
      status: 'SENT',
      sentAt: new Date(),
    })
    .where(eq(schema.notifications.id, notificationId))
    .returning();

  return updated;
}
