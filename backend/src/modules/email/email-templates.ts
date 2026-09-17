export interface QuotationEmailParams {
  customerName: string;
  plotLocation: string;
  estimateNumber: string;
  packageSlug: string;
  totalBuiltupAreaSqft: number | string;
  floorCount: string | number;
  totalProjectCostFormatted: string;
  pdfUrl: string;
}

export interface AdminLeadAlertParams {
  fullName: string;
  phone: string;
  email?: string | null;
  plotLocation: string;
  preferredContactTime?: string | null;
  requirementNotes?: string | null;
  estimateNumber?: string | null;
  pdfUrl?: string | null;
}

export interface CustomerConfirmationParams {
  fullName: string;
  plotLocation: string;
  estimateNumber?: string | null;
}

/**
 * Safely escapes HTML special characters to prevent stored HTML injection and email XSS.
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders a branded HTML email for customer quotation delivery.
 */
export function renderQuotationEmail(params: QuotationEmailParams): { subject: string; html: string; text: string } {
  const subject = `ASTHIWAR Construction Quotation — ${params.estimateNumber}`;
  const customerName = escapeHtml(params.customerName);
  const plotLocation = escapeHtml(params.plotLocation);
  const estimateNumber = escapeHtml(params.estimateNumber);
  const packageSlug = escapeHtml(params.packageSlug);
  const totalBuiltupAreaSqft = escapeHtml(Number(params.totalBuiltupAreaSqft).toLocaleString('en-IN'));
  const floorCount = escapeHtml(params.floorCount);
  const totalProjectCostFormatted = escapeHtml(params.totalProjectCostFormatted);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #0f766e;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">ASTHIWAR</h1>
      <p style="margin: 6px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase;">Design &amp; Build • Turnkey Residential</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px 24px;">
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">Dear <strong>${customerName}</strong>,</p>
      
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you for exploring our turnkey construction estimation for your project in <strong>${plotLocation}</strong>. Below is your preliminary project summary:
      </p>

      <!-- Cost Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Estimate Reference</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${estimateNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Package Tier</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f766e; text-transform: uppercase;">${packageSlug}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Built-up Area</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${totalBuiltupAreaSqft} sq.ft (${floorCount})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Location</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${plotLocation}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="padding: 12px 0 4px; font-size: 14px; font-weight: 700; color: #0f172a;">Total Estimated Cost</td>
            <td style="padding: 12px 0 4px; text-align: right; font-size: 17px; font-weight: 800; color: #0f766e;">${totalProjectCostFormatted}</td>
          </tr>
        </table>
      </div>

      <!-- Feature Bullet Points -->
      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #134e4a;">
          <strong>Included in every Asthiwar project:</strong> 10-stage escrow milestone payment plan, branded ISI materials, structural soil testing, 10-year warranty, and real-time CCTV site monitoring.
        </p>
      </div>

      <!-- PDF Download Button -->
      <div style="text-align: center; margin: 30px 0 24px;">
        <a href="${params.pdfUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0f766e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
          Download Official Quotation PDF
        </a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
        Direct link: <a href="${params.pdfUrl}" style="color: #0f766e; word-break: break-all;">${params.pdfUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 6px; font-weight: 600; color: #334155;">ASTHIWAR DESIGN &amp; BUILD</p>
      <p style="margin: 0 0 6px;">Coimbatore • Virudhunagar • Chennai • Tiruppur • Erode • Pollachi</p>
      <p style="margin: 0;">
        Phone: <a href="tel:+919488440123" style="color: #0f766e; text-decoration: none;">+91 94884 40123</a> | Email: <a href="mailto:contact@asthiwar.com" style="color: #0f766e; text-decoration: none;">contact@asthiwar.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const text = `ASTHIWAR DESIGN & BUILD - Turnkey Residential Construction

Dear ${params.customerName},

Thank you for exploring our turnkey construction estimation for your project in ${params.plotLocation}.

Estimate Reference: ${params.estimateNumber}
Package Selected: ${params.packageSlug.toUpperCase()}
Total Built-up Area: ${params.totalBuiltupAreaSqft} sq.ft (${params.floorCount})
Total Estimated Cost: ${params.totalProjectCostFormatted}

Download your official quotation PDF:
${params.pdfUrl}

Asthiwar Design & Build
Contact: +91 94884 40123 | contact@asthiwar.com
`;

  return { subject, html, text };
}

/**
 * Renders an instant email alert to admin when a new lead/enquiry arrives.
 */
export function renderAdminLeadAlertEmail(params: AdminLeadAlertParams): { subject: string; html: string; text: string } {
  const subject = `🚨 [NEW LEAD] Consultation Request: ${params.fullName} (${params.plotLocation})`;
  const fullName = escapeHtml(params.fullName);
  const phone = escapeHtml(params.phone);
  const email = params.email ? escapeHtml(params.email) : null;
  const plotLocation = escapeHtml(params.plotLocation);
  const preferredContactTime = escapeHtml(params.preferredContactTime || 'Anytime');
  const requirementNotes = escapeHtml(params.requirementNotes || 'Standard consultation requested.');
  const estimateNumber = params.estimateNumber ? escapeHtml(params.estimateNumber) : null;
  const pdfUrl = params.pdfUrl;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    
    <div style="background-color: #0f172a; padding: 18px 24px; color: white;">
      <span style="background-color: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Instant Lead Alert</span>
      <h2 style="margin: 8px 0 0; font-size: 18px;">New Consultation Request</h2>
    </div>

    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; width: 140px; font-weight: 600;">Client Name</td>
          <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${fullName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Phone Number</td>
          <td style="padding: 10px 0;">
            <a href="tel:${phone}" style="color: #0f766e; font-weight: 700; text-decoration: none;">${phone}</a>
            <span style="font-size: 12px; color: #94a3b8; margin-left: 8px;">(Click to call)</span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Email</td>
          <td style="padding: 10px 0;">
            ${email ? `<a href="mailto:${email}" style="color: #0f766e; text-decoration: none;">${email}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Site Location</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${plotLocation}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Preferred Time</td>
          <td style="padding: 10px 0; color: #1e293b;">${preferredContactTime}</td>
        </tr>
        ${estimateNumber ? `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Linked Estimate</td>
          <td style="padding: 10px 0; font-family: monospace; font-weight: 700; color: #0f766e;">${estimateNumber}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 12px 0 0; color: #64748b; font-weight: 600; vertical-align: top;">Requirement Notes</td>
          <td style="padding: 12px 0 0; color: #334155; line-height: 1.5; white-space: pre-wrap;">${requirementNotes}</td>
        </tr>
      </table>

      ${pdfUrl ? `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <a href="${pdfUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Open Customer PDF Quotation
        </a>
      </div>` : ''}
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
      Asthiwar Lead Management Engine • Automated Dispatch
    </div>
  </div>
</body>
</html>`;

  const text = `🚨 NEW ASTHIWAR LEAD ALERT

Client: ${params.fullName}
Phone: ${params.phone}
Email: ${params.email || 'N/A'}
Site Location: ${params.plotLocation}
Preferred Time: ${params.preferredContactTime || 'Anytime'}
Requirement: ${params.requirementNotes || 'Standard consultation'}
${params.estimateNumber ? `Linked Estimate: ${params.estimateNumber}` : ''}
`;

  return { subject, html, text };
}

/**
 * Renders a confirmation email to customer acknowledging their consultation enquiry.
 */
export function renderCustomerConfirmationEmail(params: CustomerConfirmationParams): { subject: string; html: string; text: string } {
  const subject = `We've received your consultation request — ASTHIWAR Design & Build`;
  const fullName = escapeHtml(params.fullName);
  const plotLocation = escapeHtml(params.plotLocation);
  const estimateNumber = params.estimateNumber ? escapeHtml(params.estimateNumber) : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    
    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff;">ASTHIWAR</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #38bdf8;">Turnkey Residential Construction</p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin: 0 0 16px;">Dear <strong>${fullName}</strong>,</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
        Thank you for reaching out to ASTHIWAR for your construction project in <strong>${plotLocation}</strong>.
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Our senior architectural engineering team has received your details. One of our engineers will contact you shortly to discuss your site specifications, architectural plans, and preliminary milestone schedules.
      </p>

      ${estimateNumber ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px;">
        <span style="font-size: 12px; color: #64748b;">Your Reference:</span>
        <strong style="font-family: monospace; font-size: 14px; color: #0f172a; margin-left: 8px;">${estimateNumber}</strong>
      </div>` : ''}

      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 8px;">
        Need immediate assistance? You can call us directly at <strong>+91 94884 40123</strong> or reply to this email.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
      Asthiwar Design &amp; Build • Coimbatore • Virudhunagar • Chennai • Tiruppur
    </div>
  </div>
</body>
</html>`;

  const text = `Dear ${params.fullName},

Thank you for reaching out to ASTHIWAR Design & Build regarding your construction project in ${params.plotLocation}.

Our senior engineering team has received your enquiry and will connect with you shortly.
${params.estimateNumber ? `Reference: ${params.estimateNumber}\n` : ''}
Need immediate assistance? Call us directly at +91 94884 40123.

Asthiwar Design & Build
`;

  return { subject, html, text };
}
