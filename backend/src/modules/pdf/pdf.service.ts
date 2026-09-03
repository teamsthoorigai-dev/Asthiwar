import PDFDocument from 'pdfkit';
import { db, schema, eq } from '@asthiwar/database';

export class PdfGenerationError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

// Sanitizes text strings to replace Unicode Rupee symbol with 'Rs. ' (prevents PDFKit WinAnsi glyph encoding artifacts)
function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/₹\s?/g, 'Rs. ');
}

// Currency Formatter Helper (Indian Rupee Numbering Format with Rs. prefix)
function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'Rs. 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return 'Rs. 0';
  return 'Rs. ' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export async function generateEstimatePdf(estimateNumberOrId: string): Promise<Buffer> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(estimateNumberOrId);

  const estimate = await db.query.estimates.findFirst({
    where: isUuid
      ? eq(schema.estimates.id, estimateNumberOrId)
      : eq(schema.estimates.estimateNumber, estimateNumberOrId),
  });

  if (!estimate) {
    throw new PdfGenerationError(404, 'ESTIMATE_NOT_FOUND', `Estimate ${estimateNumberOrId} not found`);
  }

  // Fetch items and addons
  const items = await db.query.estimateItems.findMany({
    where: eq(schema.estimateItems.estimateId, estimate.id),
  });

  const addons = await db.query.estimateAddons.findMany({
    where: eq(schema.estimateAddons.estimateId, estimate.id),
  });

  const milestones = (estimate.milestoneBreakdownJson as any[]) || [];

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 36, right: 36 },
        autoFirstPage: true,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Executive Color Palette
      const PRIMARY = '#0F172A'; // Slate 900
      const NAVY_HEADER = '#0B132B'; // Deep Midnight
      const ACCENT_GOLD = '#D97706'; // Amber 600
      const GOLD_LIGHT = '#FEF3C7'; // Amber 100
      const TEAL_ACCENT = '#0D9488'; // Teal 600
      const DARK = '#1E293B'; // Slate 800
      const TEXT_MUTED = '#64748B'; // Slate 500
      const LIGHT_BG = '#F8FAFC'; // Slate 50
      const BORDER_COLOR = '#E2E8F0'; // Slate 200

      // ====================================================
      // PAGE 1: HEADER, CLIENT SPECS & COMMERCIAL BREAKDOWN
      // ====================================================

      // Header Bar
      doc.rect(0, 0, doc.page.width, 92).fill(NAVY_HEADER);

      // Left Brand Identity
      doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(18);
      doc.text('ASTHIWAR DESIGN & BUILD', 36, 22);

      doc.font('Helvetica').fontSize(8.5).fillColor('#E2E8F0');
      doc.text('Turnkey Residential Construction & Civil Engineering • Tamil Nadu', 36, 44);
      doc.fontSize(7.5).fillColor('#94A3B8');
      doc.text('Coimbatore • Chennai • Tiruppur • Erode • Pollachi • Madurai | Web: asthiwar.com', 36, 58);

      // Right Header Badge (Estimate ID & Date)
      const badgeWidth = 175;
      const badgeX = doc.page.width - 36 - badgeWidth;
      doc.roundedRect(badgeX, 16, badgeWidth, 60, 6).fill('#1E293B');
      doc.fillColor('#FBBF24').font('Helvetica-Bold').fontSize(8).text('OFFICIAL QUOTATION', badgeX + 10, 24);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text(estimate.estimateNumber, badgeX + 10, 38);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(7.5).text(`Generated: ${new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, badgeX + 10, 56);

      doc.y = 104;

      // Client & Project Specifications Two-Column Card
      const infoCardY = doc.y;
      const cardHeight = 72;
      doc.roundedRect(36, infoCardY, doc.page.width - 72, cardHeight, 6)
        .strokeColor(BORDER_COLOR)
        .fillAndStroke(LIGHT_BG, BORDER_COLOR);

      // Left Column: Client Details
      doc.fillColor(TEAL_ACCENT).font('Helvetica-Bold').fontSize(8.5).text('CLIENT INFORMATION', 50, infoCardY + 9);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8).text('Customer Name: ', 50, infoCardY + 23);
      doc.font('Helvetica').fillColor(DARK).text(cleanText(estimate.customerName), 125, infoCardY + 23);

      doc.font('Helvetica-Bold').text('Contact Phone: ', 50, infoCardY + 37);
      doc.font('Helvetica').text(estimate.customerPhone, 125, infoCardY + 37);

      doc.font('Helvetica-Bold').text('Email Address: ', 50, infoCardY + 51);
      doc.font('Helvetica').text(estimate.customerEmail ?? 'N/A', 125, infoCardY + 51);

      // Right Column: Project Technical Specs (without index multiplier)
      const col2X = 310;
      doc.fillColor(TEAL_ACCENT).font('Helvetica-Bold').fontSize(8.5).text('PROJECT SPECIFICATIONS', col2X, infoCardY + 9);
      
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8).text('Plot Location: ', col2X, infoCardY + 23);
      doc.font('Helvetica').text(cleanText(estimate.plotLocation), col2X + 80, infoCardY + 23);

      doc.font('Helvetica-Bold').text('Floors & Plot: ', col2X, infoCardY + 37);
      doc.font('Helvetica').text(`${estimate.floorCount} • Plot: ${estimate.plotAreaSqft} Sq.Ft`, col2X + 80, infoCardY + 37);

      doc.font('Helvetica-Bold').text('Total Built-Up: ', col2X, infoCardY + 51);
      doc.font('Helvetica-Bold').fillColor(ACCENT_GOLD).text(`${Number(estimate.totalBuiltupAreaSqft).toLocaleString('en-IN')} Sq.Ft`, col2X + 80, infoCardY + 51);

      doc.y = infoCardY + cardHeight + 14;

      let sectionNum = 1;

      // ----------------------------------------------------
      // SECTION 1: PACKAGE & BASE CONSTRUCTION COST
      // ----------------------------------------------------
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(10.5).text(`${sectionNum++}. PACKAGE & BASE CONSTRUCTION COST`, 36, doc.y);
      doc.y += 5;

      const tblX = 36;
      const tblW = doc.page.width - 72;
      const pkgTableY = doc.y;

      // Table Header
      doc.roundedRect(tblX, pkgTableY, tblW, 20, 3).fill(TEAL_ACCENT);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('Selected Package Tier', tblX + 8, pkgTableY + 6);
      doc.text('Total Built-up Area', tblX + 160, pkgTableY + 6);
      doc.text('Effective Rate / Sq.Ft', tblX + 280, pkgTableY + 6);
      doc.text('Base Amount (INR)', tblX + tblW - 110, pkgTableY + 6, { align: 'right', width: 100 });

      // Table Row
      const pkgRowY = pkgTableY + 20;
      doc.rect(tblX, pkgRowY, tblW, 20).fill('#FFFFFF').strokeColor(BORDER_COLOR).stroke();
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8);
      doc.text(estimate.packageSlug.toUpperCase() + ' PACKAGE', tblX + 8, pkgRowY + 5);
      doc.font('Helvetica').text(`${Number(estimate.totalBuiltupAreaSqft).toLocaleString('en-IN')} Sq.Ft`, tblX + 160, pkgRowY + 5);
      doc.text(formatINR(estimate.packageRatePerSqft) + ' / sq.ft', tblX + 280, pkgRowY + 5);
      doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(estimate.baseConstructionCost), tblX + tblW - 110, pkgRowY + 5, { align: 'right', width: 100 });

      doc.y = pkgRowY + 26;

      // Helper for dynamic page breaks
      const checkPageBreak = (neededHeight: number = 35) => {
        if (doc.y + neededHeight > doc.page.height - 40) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, 30).fill(NAVY_HEADER);
          doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(9);
          doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
          doc.y = 42;
          return true;
        }
        return false;
      };

      // ----------------------------------------------------
      // SECTION 2: BRAND CUSTOMIZATIONS / UPGRADES (If any)
      // ----------------------------------------------------
      if (items.length > 0) {
        checkPageBreak(40);
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(10.5).text(`${sectionNum++}. BRAND CUSTOMIZATIONS & SPECIFICATION UPGRADES`, 36, doc.y);
        doc.y += 5;

        const custTableY = doc.y;
        doc.roundedRect(tblX, custTableY, tblW, 16, 3).fill('#334155');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
        doc.text('Item Category', tblX + 8, custTableY + 4);
        doc.text('Selected Brand / Option', tblX + 155, custTableY + 4);
        doc.text('Rate Delta', tblX + 355, custTableY + 4, { width: 75, align: 'right' });
        doc.text('Amount Addition', tblX + tblW - 90, custTableY + 4, { align: 'right', width: 80 });

        let curY = custTableY + 16;
        items.forEach((item, idx) => {
          if (curY + 16 > doc.page.height - 40) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 30).fill(NAVY_HEADER);
            doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(9);
            doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
            curY = 42;

            // Redraw table header on continuation page
            doc.roundedRect(tblX, curY, tblW, 16, 3).fill('#334155');
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
            doc.text('Item Category', tblX + 8, curY + 4);
            doc.text('Selected Brand / Option', tblX + 155, curY + 4);
            doc.text('Rate Delta', tblX + 355, curY + 4, { width: 75, align: 'right' });
            doc.text('Amount Addition', tblX + tblW - 90, curY + 4, { align: 'right', width: 80 });
            curY += 16;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(tblX, curY, tblW, 15).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
          doc.fillColor(DARK).font('Helvetica').fontSize(7);
          doc.text(cleanText(item.itemName), tblX + 8, curY + 4, { width: 142, lineBreak: false, ellipsis: true });
          doc.font('Helvetica-Bold').text(cleanText(item.selectedOptionName), tblX + 155, curY + 4, { width: 195, lineBreak: false, ellipsis: true });
          
          const deltaNum = Number(item.unitPriceDelta);
          const deltaText = deltaNum > 0 ? `+${formatINR(deltaNum)} / sq.ft` : 'Included';
          doc.font('Helvetica').text(deltaText, tblX + 355, curY + 4, { width: 75, align: 'right', lineBreak: false });
          
          const priceNum = Number(item.calculatedPrice);
          const priceText = priceNum > 0 ? formatINR(priceNum) : 'Rs. 0';
          doc.font('Helvetica-Bold').text(priceText, tblX + tblW - 90, curY + 4, { align: 'right', width: 80, lineBreak: false });
          curY += 15;
        });

        doc.y = curY + 10;
      }

      // ----------------------------------------------------
      // SECTION 3: SELECTED INFRASTRUCTURE ADD-ONS (If any)
      // ----------------------------------------------------
      if (addons.length > 0) {
        checkPageBreak(40);
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(10.5).text(`${sectionNum++}. SELECTED ADD-ONS & INFRASTRUCTURE`, 36, doc.y);
        doc.y += 5;

        const addonTableY = doc.y;
        doc.roundedRect(tblX, addonTableY, tblW, 16, 3).fill('#334155');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
        doc.text('Add-On Name', tblX + 8, addonTableY + 4);
        doc.text('Variant / Specification', tblX + 155, addonTableY + 4);
        doc.text('Quantity / Unit', tblX + 355, addonTableY + 4, { width: 75, align: 'right' });
        doc.text('Total Cost', tblX + tblW - 90, addonTableY + 4, { align: 'right', width: 80 });

        let addY = addonTableY + 16;
        addons.forEach((addon, idx) => {
          if (addY + 16 > doc.page.height - 40) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 30).fill(NAVY_HEADER);
            doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(9);
            doc.text(`ASTHIWAR • Quotation ${estimate.estimateNumber} (Continued)`, 36, 10);
            addY = 42;

            // Redraw table header on continuation page
            doc.roundedRect(tblX, addY, tblW, 16, 3).fill('#334155');
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
            doc.text('Add-On Name', tblX + 8, addY + 4);
            doc.text('Variant / Specification', tblX + 155, addY + 4);
            doc.text('Quantity / Unit', tblX + 355, addY + 4, { width: 75, align: 'right' });
            doc.text('Total Cost', tblX + tblW - 90, addY + 4, { align: 'right', width: 80 });
            addY += 16;
          }
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(tblX, addY, tblW, 15).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
          doc.fillColor(DARK).font('Helvetica').fontSize(7);
          doc.text(cleanText(addon.addonName), tblX + 8, addY + 4, { width: 142, lineBreak: false, ellipsis: true });
          doc.font('Helvetica-Bold').text(cleanText(addon.selectedVariant.replace(/_/g, ' ').toUpperCase()), tblX + 155, addY + 4, { width: 195, lineBreak: false, ellipsis: true });
          doc.font('Helvetica').text(`${addon.quantity} ${addon.unit.replace(/_/g, ' ')}`, tblX + 355, addY + 4, { width: 75, align: 'right', lineBreak: false });
          doc.font('Helvetica-Bold').text(formatINR(addon.totalPrice), tblX + tblW - 90, addY + 4, { align: 'right', width: 80, lineBreak: false });
          addY += 15;
        });

        doc.y = addY + 10;
      }

      // ----------------------------------------------------
      // COMMERCIAL SUMMARY CARD (Right-Aligned, Non-Overlapping)
      // ----------------------------------------------------
      const sumBoxW = 260;
      const sumBoxX = doc.page.width - 36 - sumBoxW;
      const hasUpgrades = parseFloat(estimate.upgradesCost) > 0;
      const hasAddons = parseFloat(estimate.addonsCost) > 0;
      let sumBoxH = 46;
      if (hasUpgrades) sumBoxH += 14;
      if (hasAddons) sumBoxH += 14;

      checkPageBreak(sumBoxH + 15);
      const sumBoxY = doc.y + 2;

      doc.roundedRect(sumBoxX, sumBoxY, sumBoxW, sumBoxH, 6)
        .strokeColor(BORDER_COLOR)
        .fillAndStroke(LIGHT_BG, BORDER_COLOR);

      let currentSumY = sumBoxY + 7;

      // Base Cost line
      doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Base Construction Cost:', sumBoxX + 10, currentSumY);
      doc.font('Helvetica-Bold').text(formatINR(estimate.baseConstructionCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
      currentSumY += 14;

      // Upgrades line
      if (hasUpgrades) {
        doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Specification Upgrades:', sumBoxX + 10, currentSumY);
        doc.font('Helvetica-Bold').text(formatINR(estimate.upgradesCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
        currentSumY += 14;
      }

      // Add-ons line
      if (hasAddons) {
        doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Add-Ons Subtotal:', sumBoxX + 10, currentSumY);
        doc.font('Helvetica-Bold').text(formatINR(estimate.addonsCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
        currentSumY += 14;
      }

      // Total Project Cost Highlight
      doc.rect(sumBoxX, currentSumY - 2, sumBoxW, 22).fill(GOLD_LIGHT);
      doc.fillColor(NAVY_HEADER).font('Helvetica-Bold').fontSize(8.5).text('TOTAL PROJECT COST:', sumBoxX + 10, currentSumY + 3);
      doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(10.5).text(formatINR(estimate.totalProjectCost), sumBoxX + sumBoxW - 120, currentSumY + 2, { align: 'right', width: 110 });

      // ====================================================
      // NEXT PAGE: 10-STAGE MILESTONES & CIVIL CONTRACT TERMS
      // ====================================================
      doc.addPage();

      // Milestone Page Header
      doc.rect(0, 0, doc.page.width, 50).fill(NAVY_HEADER);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13).text('10-STAGE CIVIL MILESTONE PAYMENT SCHEDULE', 36, 18);

      doc.y = 60;
      doc.fillColor(DARK).font('Helvetica').fontSize(8).text(
        'Payments are strictly linked to on-site civil completion stages with zero front-loading. Each stage requires engineer sign-off:',
        36,
        doc.y
      );
      doc.y += 10;

      // Milestones Table
      const msTableY = doc.y;
      doc.roundedRect(tblX, msTableY, tblW, 16, 3).fill(TEAL_ACCENT);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
      doc.text('Stage', tblX + 8, msTableY + 4);
      doc.text('Milestone Description & Work Scope', tblX + 55, msTableY + 4);
      doc.text('Share %', tblX + 370, msTableY + 4);
      doc.text('Amount (INR)', tblX + tblW - 110, msTableY + 4, { align: 'right', width: 100 });

      let msY = msTableY + 16;
      milestones.forEach((m, idx) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(tblX, msY, tblW, 17).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
        
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5);
        doc.text(`Stage ${m.stageNumber || idx + 1}`, tblX + 8, msY + 4);

        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(7.5);
        const stageTitle = cleanText(m.stageName || m.name || m.title || `Stage ${idx + 1} Completion`);
        doc.text(stageTitle, tblX + 55, msY + 4);

        if (m.keyDeliverables) {
          doc.font('Helvetica').fontSize(6.5).fillColor(TEXT_MUTED);
          doc.text(cleanText(m.keyDeliverables), tblX + 175, msY + 4, { width: 190, lineBreak: false, ellipsis: true });
        }

        doc.font('Helvetica').fontSize(7.5).fillColor(DARK).text(`${m.percentage}%`, tblX + 370, msY + 4);
        doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(m.amount), tblX + tblW - 110, msY + 4, { align: 'right', width: 100 });
        
        msY += 17;
      });

      // Total Milestones Summary Row
      doc.rect(tblX, msY, tblW, 19).fill('#E2E8F0').strokeColor(PRIMARY).stroke();
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8);
      doc.text('TOTAL CONTRACT VALUE', tblX + 55, msY + 5);
      doc.text('100.00%', tblX + 370, msY + 5);
      doc.text(formatINR(estimate.totalProjectCost), tblX + tblW - 110, msY + 5, { align: 'right', width: 100 });

      doc.y = msY + 22;

      // ----------------------------------------------------
      // TERMS & CONDITIONS
      // ----------------------------------------------------
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8.5).text('TERMS & STANDARD CONDITIONS', 36, doc.y);
      doc.y += 4;

      const terms = [
        '1. Quotation Validity: This estimate is valid for 30 calendar days from the date of generation.',
        '2. Rate Basis: Built-up area is calculated outer-to-outer including balconies and parking as specified.',
        '3. Standard Inclusions: 100% material, labor, structural drawings, 3D elevation, site engineer supervision.',
        '4. Standard Exclusions: Government building approval fees, EB permanent connection deposits, borewell depth beyond allowances.',
        '5. Payment Guarantee: Zero advance beyond Stage 1 booking fee; milestone payments only upon site stage verification.',
      ];

      terms.forEach((t) => {
        doc.fillColor(DARK).font('Helvetica').fontSize(6.5).text(t, 42, doc.y);
        doc.y += 8.5;
      });

      // ----------------------------------------------------
      // 11 STANDARD EXCLUSIONS & CLIENT SCOPE
      // ----------------------------------------------------
      doc.y += 3;
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8).text('STANDARD EXCLUSIONS & CLIENT SCOPE (Out of Scope for Civil Contract):', 36, doc.y);
      doc.y += 3;

      const exclusionsCol1 = [
        '• Elevation Work (Special exterior stone/HPL claddings)',
        '• Outer Area Development (Setbacks, paving & landscape)',
        '• Interior Works & Carpentry (Wardrobes, modular units)',
        '• DTCP & Local Body Building Plan Sanction Fees',
        '• Electricity Board (EB) Connection & Meter Deposits',
        '• Gas Connection & Piped Gas Installation Charges',
      ];
      const exclusionsCol2 = [
        '• Drinking Water & Drainage (UGD) Connection Fees',
        '• Borewell Drilling, Casing & Submersible Piping',
        '• Water Pumps & Motors (unless chosen as Add-On)',
        '• Electrical Appliances (TV, Fridge, ACs, Chimney)',
        '• Vacant Land Tax (VLT) & Local Property Taxes',
      ];

      const exclY = doc.y;
      exclusionsCol1.forEach((t, i) => {
        doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(6.5).text(t, 42, exclY + (i * 8));
      });
      exclusionsCol2.forEach((t, i) => {
        doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(6.5).text(t, 290, exclY + (i * 8));
      });
      doc.y = exclY + (exclusionsCol1.length * 8) + 4;

      // ----------------------------------------------------
      // SIGNATURE BLOCK (Fixed within bottom margin)
      // ----------------------------------------------------
      const sigY = 745; // Fixed Y position on A4 (height 841.89)
      doc.strokeColor(BORDER_COLOR).lineWidth(0.8).moveTo(36, sigY).lineTo(doc.page.width - 36, sigY).stroke();

      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5).text('For Asthiwar Design & Build', 36, sigY + 6);
      doc.font('Helvetica').fontSize(6.5).fillColor(TEXT_MUTED).text('Authorized Engineering Signatory', 36, sigY + 16);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PRIMARY).text('Customer Acknowledgment', doc.page.width - 190, sigY + 6);
      doc.font('Helvetica').fontSize(6.5).fillColor(TEXT_MUTED).text('Signature / Acceptance Date: ___________________', doc.page.width - 190, sigY + 16);

      // ----------------------------------------------------
      // DYNAMIC PAGE NUMBERING (With bottom margin set to 0 to prevent ghost pages)
      // ----------------------------------------------------
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.font('Helvetica').fontSize(7).fillColor('#94A3B8');
        doc.text(
          `ASTHIWAR Quotation • ${estimate.estimateNumber} • Page ${i + 1} of ${totalPages}`,
          36,
          doc.page.height - 18,
          { align: 'center', width: doc.page.width - 72, lineBreak: false }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
