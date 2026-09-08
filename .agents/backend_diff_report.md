# Backend Files Diff Breakdown

## src/modules/admin/admin.schema.ts (Current: 51 lines, New: 47 lines)

```diff
- export const enquiryPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
- 
-   priority: enquiryPriorityEnum.optional(),
-   priority: enquiryPriorityEnum.optional(),
```

## src/modules/admin/admin.service.ts (Current: 445 lines, New: 438 lines)

```diff
-   if (query.priority) {
-     conditions.push(eq(schema.enquiries.priority, query.priority));
-   }
- 
-     priority: schema.enquiries.priority,
-       priority: schema.enquiries.priority,
-       ...(dto.priority !== undefined && { priority: dto.priority }),
```

## src/modules/admin/admin-config.schema.ts (Current: 106 lines, New: 112 lines)

```diff
-   highlights: z.array(z.string()).optional(),
-   isRecommended: z.boolean().optional(),
-   slug: z.string().min(1, 'Slug is required'),
+   slug: z.string().min(1).optional(),
-   priceDelta: z.coerce.number().min(0, 'Price delta must be non-negative').default(0),
+   prices: z.array(z.object({
+     packageId: z.coerce.number().int().positive('Package ID is required'),
+     priceDelta: z.coerce.number().optional().default(0),
+     isComplimentary: z.boolean().optional(),
+   })).optional(),
-   priceDelta: z.coerce.number().min(0, 'Price delta must be non-negative').optional(),
+   prices: z.array(z.object({
+     packageId: z.coerce.number().int().positive('Package ID is required'),
+     priceDelta: z.coerce.number().optional().default(0),
+     isComplimentary: z.boolean().optional(),
+   })).optional(),
```

## src/modules/admin/admin-config.service.ts (Current: 513 lines, New: 510 lines)

```diff
- // A price row is live only while it has not been retired. Retired rows stay in the table as
+ // ----------------------------------------------------
- // history — every read that means "the current price" has to exclude them.
+ // 1. PACKAGES CONFIGURATION & PRICE VERSIONING
- const isActivePrice = (p: { effectiveTo: Date | null }) => p.effectiveTo === null;
- 
- // Default fallback highlights for each package tier
- const DEFAULT_PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
-   basic: [
-     'ISI Fe 550D TMT Steel & ISI Cement',
-     'Solid Concrete Blocks Masonry',
-     '1 Putnam + 2 ISI Emulsion Paint',
-     "2'x2' Vitrified Flooring (Rs. 45/sqft)",
-     'Standard UPVC Sliding Windows',
-     '10-Year Structural Warranty',
-   ],
-   standard: [
-     'SPA / Vizag Steel & JSW / Ramco Cement',
-     'Fly Ash / AAC Blocks Masonry',
-     'Parryware Sanitary Fittings (Rs. 20,000/bath)',
-     "4'x2' Vitrified Tiles (Rs. 50/sqft)",
-     'Dr. Fixit Waterproofing Included',
-     'Readymade Teak Main Door (5"x4")',
-   ],
-   premium: [
-     'ARS / Suryadev Fe 550D & Ultratech Cement',
-     'Jaquar Premium Sanitary (Rs. 30,000/bath)',
-     'Granite Staircase Flooring (Rs. 120/sqft)',
-     "1st Quality Teak Main Door (3.5'x7')",
-     'Asian Apex Weatherproof Exterior Paint',
-     'Soil Testing & Architect Site Visits Included',
-   ],
-   luxury: [
-     'JSW / TATA Fe 550D & Ultratech Cement',
-     '100% Solid Red Bricks & RCC Basement',
-     'Toto / Kohler Luxury Bathrooms (Rs. 45,000/bath)',
-     "1st Quality Burma Teak Doors (3.5'x8')",
-     'Italian / Premium Tiles (Rs. 100/sqft)',
-     'VR 3D Walkthrough & Full Dedicated Site Engineer',
-   ],
- };
- 
- // 1. PACKAGES CONFIGURATION & PRICE VERSIONING
- // ----------------------------------------------------
-     .from(schema.packagePrices)
+     .from(schema.packagePrices);
-     .orderBy(desc(schema.packagePrices.effectiveFrom));
-   const uniquePkgMap = new Map<string, any>();
+   return allPackages.map((pkg) => {
-   for (const pkg of allPackages) {
+     const activePrice = allPrices.find((p) => p.packageId === pkg.id) || null;
-     if (!uniquePkgMap.has(pkg.slug)) {
+     return {
-       const activePrice = allPrices.find((p) => p.packageId === pkg.id && isActivePrice(p)) || null;
+       ...pkg,
-       uniquePkgMap.set(pkg.slug, {
+       activePrice,
-         ...pkg,
+       priceHistory: activePrice ? [activePrice] : [],
-         highlights: (pkg.highlights && Array.isArray(pkg.highlights) && pkg.highlights.length > 0)
+     };
-           ? pkg.highlights
-           : (DEFAULT_PACKAGE_HIGHLIGHTS[pkg.slug] || []),
-         isRecommended: pkg.isRecommended ?? (pkg.slug === 'premium'),
-         activePrice,
-         priceHistory: activePrice ? [activePrice] : [],
-       });
-     }
-   }
- 
-   return Array.from(uniquePkgMap.values());
- }
- 
- export async function updateAdminPackagePrice(packageIdOrSlug: number | string, dto: UpdatePackagePriceDto) {
-   const isNumeric = !isNaN(Number(packageIdOrSlug));
-   const pkg = await db.query.packages.findFirst({
-     where: isNumeric
-       ? eq(schema.packages.id, Number(packageIdOrSlug))
-       : eq(schema.packages.slug, String(packageIdOrSlug)),
+ }
+ export async function updateAdminPackagePrice(packageIdOrSlug: number | string, dto: UpdatePackagePriceDto) {
+   const isNumeric = !isNaN(Number(packageIdOrSlug));
+   const pkg = await db.query.packages.findFirst({
+     where: isNumeric
+       ? eq(schema.packages.id, Number(packageIdOrSlug))
+       : eq(schema.packages.slug, String(packageIdOrSlug)),
+   });
+ 
-       ...(dto.highlights !== undefined && { highlights: dto.highlights }),
-       ...(dto.isRecommended !== undefined && { isRecommended: dto.isRecommended }),
-     .from(schema.addonPrices)
+     .from(schema.addonPrices);
-     .orderBy(desc(schema.addonPrices.effectiveFrom));
-       activePrices: addonPricesList.filter(isActivePrice),
+       activePrices: addonPricesList,
-     .orderBy(desc(schema.optionPrices.effectiveFrom));
+     .orderBy(desc(schema.optionPrices.createdAt));
-             activePrice: optionPricesList.find((p) => p.optionId === opt.id && isActivePrice(p)) || null,
+             activePrice: optionPricesList.find((p) => p.optionId === opt.id) || null,
+   const rawSlug = (dto.slug?.trim() || dto.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;
+ 
-       slug: dto.slug,
+       slug: rawSlug,
-   const [createdPrice] = await db
+   const itemPriceType = item.unit === 'fixed' ? 'fixed' : 'per_sqft';
-     .insert(schema.optionPrices)
+   let createdPrices: any[] = [];
-     .values({
+   if (dto.prices && dto.prices.length > 0) {
-       optionId: createdOption.id,
+     // Deduplicate by packageId to prevent DB issues
-       priceDelta: (dto.priceDelta || 0).toFixed(2),
+     const priceMap = new Map();
-     })
+     for (const p of dto.prices) {
-     .returning();
+       priceMap.set(p.packageId, p);
+     }
+     const inserts = Array.from(priceMap.values()).map((p) => {
+       const isComp = p.isComplimentary === true;
+       const rawDelta = isComp ? 0 : Number(p.priceDelta);
+       const deltaVal = isNaN(rawDelta) ? 0 : rawDelta;
+       return {
+         optionId: createdOption.id,
+         packageId: p.packageId,
+         priceDelta: deltaVal.toFixed(2),
+         priceType: itemPriceType,
+       };
+     });
+     
+     createdPrices = await db.insert(schema.optionPrices).values(inserts).returning();
+   } else {
+     // Default to 0.00 for all active packages
+     const activePkgs = await db.query.packages.findMany({
+       where: eq(schema.packages.isActive, true),
+     });
+     if (activePkgs.length > 0) {
+       const inserts = activePkgs.map((pkg) => ({
+         optionId: createdOption.id,
+         packageId: pkg.id,
+         priceDelta: '0.00',
+         priceType: itemPriceType,
+       }));
+       createdPrices = await db.insert(schema.optionPrices).values(inserts).returning();
+     }
+   }
-     activePrice: createdPrice,
+     activePrice: createdPrices[0] || null,
-     prices: [createdPrice],
+     prices: createdPrices,
+   const parentItem = await db.query.items.findFirst({
+     where: eq(schema.items.id, option.itemId),
+   });
+   const itemPriceType = parentItem?.unit === 'fixed' ? 'fixed' : 'per_sqft';
+ 
-   // Update option prices in-place!
+   // Update option prices strictly per package
-   let newPrice = null;
+   let newPrices: any[] = [];
-   if (dto.priceDelta !== undefined) {
+   
-     const [p] = await db
+   if (dto.prices && dto.prices.length > 0) {
-       .update(schema.optionPrices)
+     // Delete existing prices
-       .set({
+     await db.delete(schema.optionPrices).where(eq(schema.optionPrices.optionId, optionId));
-         priceDelta: dto.priceDelta.toFixed(2),
+     
-       })
+     // Deduplicate by packageId
-       .where(eq(schema.optionPrices.optionId, optionId))
+     const priceMap = new Map();
-       .returning();
+     for (const p of dto.prices) {
-     newPrice = p;
+       priceMap.set(p.packageId, p);
+     }
+     const inserts = Array.from(priceMap.values()).map((p) => {
+       const isComp = p.isComplimentary === true;
+       const rawDelta = isComp ? 0 : Number(p.priceDelta);
+       const deltaVal = isNaN(rawDelta) ? 0 : rawDelta;
+       return {
+         optionId: optionId,
+         packageId: p.packageId,
+         priceDelta: deltaVal.toFixed(2),
+         priceType: itemPriceType,
+       };
+     });
+     
+     newPrices = await db.insert(schema.optionPrices).values(inserts).returning();
-   return { id: optionId, name: dto.name || option.brandName, newPrice };
+   return { id: optionId, name: dto.name || option.brandName, prices: newPrices };
```

## src/modules/admin/admin-config.controller.ts (Current: 429 lines, New: 429 lines)

```diff
-       message: 'Option price delta updated with history versioning',
+       message: 'Option prices updated successfully',
```

## src/modules/calculator/calculator.service.ts (Current: 547 lines, New: 570 lines)

```diff
+   enquiries,
-       const unitPrice = Number(matchedPriceRow.price);
+       let unitPrice = Number(matchedPriceRow.price);
+       // Dynamic rule: Roof Weathering is complimentary in Premium & Luxury, and free for Basic/Standard if terrace > 2000 sq.ft
+       if (add.slug === 'cool_roof_tiles' || add.slug === 'roof_weathering') {
+         if (input.packageSlug === 'premium' || input.packageSlug === 'luxury') {
+           unitPrice = 0;
+         } else if (qty > 2000) {
+           unitPrice = 0;
+         }
+       }
+ 
-   }
+     // Auto-create CRM Lead Enquiry for this authoritative estimate
+     await db.insert(enquiries).values({
+       estimateId: insertedEstimate.id,
+       estimateNumber: estimateNumber,
+       fullName: input.customerName,
+       phone: input.customerPhone,
+       email: input.customerEmail ?? '',
+       plotLocation: input.plotLocation,
+       preferredContactTime: 'Anytime',
+       requirementNotes: `Generated estimate for ${pkg.name} (${totalBuiltupAreaSqft.toFixed(0)} sq.ft, ${input.floorCount === 0 ? 'Ground Floor' : `G+${input.floorCount}`}) in ${input.plotLocation}. Total: ₹${totalProjectCost.toLocaleString('en-IN')}`,
+       status: 'NEW',
+     });
+   }
+ 
```

## src/modules/calculator/calculator.controller.ts (Current: 504 lines, New: 396 lines)

```diff
-   desc,
-   sql,
- export const DEFAULT_PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
-   basic: [
-     'ISI Fe 550D TMT Steel & ISI Cement',
-     'Solid Concrete Blocks Masonry',
-     '1 Putnam + 2 ISI Emulsion Paint',
-     "2'x2' Vitrified Flooring (Rs. 45/sqft)",
-     'Standard UPVC Sliding Windows',
-     '10-Year Structural Warranty',
-   ],
-   standard: [
-     'SPA / Vizag Steel & JSW / Ramco Cement',
-     'Fly Ash / AAC Blocks Masonry',
-     'Parryware Sanitary Fittings (Rs. 20,000/bath)',
-     "4'x2' Vitrified Tiles (Rs. 50/sqft)",
-     'Dr. Fixit Waterproofing Included',
-     'Readymade Teak Main Door (5"x4")',
-   ],
-   premium: [
-     'ARS / Suryadev Fe 550D & Ultratech Cement',
-     'Jaquar Premium Sanitary (Rs. 30,000/bath)',
-     'Granite Staircase Flooring (Rs. 120/sqft)',
-     "1st Quality Teak Main Door (3.5'x7')",
-     'Asian Apex Weatherproof Exterior Paint',
-     'Soil Testing & Architect Site Visits Included',
-   ],
-   luxury: [
-     'JSW / TATA Fe 550D & Ultratech Cement',
-     '100% Solid Red Bricks & RCC Basement',
-     'Toto / Kohler Luxury Bathrooms (Rs. 45,000/bath)',
-     "1st Quality Burma Teak Doors (3.5'x8')",
-     'Italian / Premium Tiles (Rs. 100/sqft)',
-     'VR 3D Walkthrough & Full Dedicated Site Engineer',
-   ],
- };
- 
-     // Deduplicate by slug
-     const uniqueLocsMap = new Map<string, typeof locRows[0]>();
-     for (const l of locRows) {
-       if (!uniqueLocsMap.has(l.slug)) {
-         uniqueLocsMap.set(l.slug, l);
-       }
-     }
- 
-       data: Array.from(uniqueLocsMap.values()).map((l) => ({
+       data: locRows.map((l) => ({
-         highlights: packages.highlights,
-         isRecommended: packages.isRecommended,
-       .innerJoin(
+       .innerJoin(packagePrices, eq(packagePrices.packageId, packages.id))
-         packagePrices,
-         and(
-           eq(packagePrices.packageId, packages.id),
-           or(isNull(packagePrices.effectiveTo), sql`${packagePrices.effectiveTo} > NOW()`)
-         )
-       )
-       .orderBy(asc(packages.sortOrder), desc(packagePrices.id));
+       .orderBy(asc(packages.sortOrder));
-     // Deduplicate by slug to ensure exactly one package card per tier
-     const uniquePkgsMap = new Map<string, any>();
-     for (const p of pkgRows) {
-       if (!uniquePkgsMap.has(p.slug)) {
-         const highlights = (p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0)
-           ? p.highlights
-           : (DEFAULT_PACKAGE_HIGHLIGHTS[p.slug] || []);
- 
-         uniquePkgsMap.set(p.slug, {
-           id: p.id,
-           slug: p.slug,
-           name: p.name,
-           tagline: p.tagline,
-           description: p.description,
-           highlights,
-           isRecommended: p.isRecommended ?? (p.slug === 'premium'),
-           colorTheme: p.colorTheme,
-           sortOrder: p.sortOrder,
-           standardPricePerSqft: Number(p.pricePerSqft),
-           volumePricePerSqft: Number(p.volumePricePerSqft),
-           volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
-           pricing: {
-             standardRatePerSqft: Number(p.pricePerSqft),
-             volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
-             volumeRatePerSqft: Number(p.volumePricePerSqft),
-           },
-         });
-       }
-     }
- 
-       data: Array.from(uniquePkgsMap.values()),
+       data: pkgRows.map((p) => ({
+         id: p.id,
+         slug: p.slug,
+         name: p.name,
+         tagline: p.tagline,
+         description: p.description,
+         colorTheme: p.colorTheme,
+         sortOrder: p.sortOrder,
+         standardPricePerSqft: Number(p.pricePerSqft),
+         volumePricePerSqft: Number(p.volumePricePerSqft),
+         volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
+         pricing: {
+           standardRatePerSqft: Number(p.pricePerSqft),
+           volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
+           volumeRatePerSqft: Number(p.volumePricePerSqft),
+         },
+       })),
-     // Fetch options for customizable items (including universal prices, active only)
+     // Fetch options for customizable items for the active package tier
-           or(eq(optionPrices.packageId, pkg.id), isNull(optionPrices.packageId)),
+           eq(optionPrices.packageId, pkg.id)
-           or(isNull(optionPrices.effectiveTo), sql`${optionPrices.effectiveTo} > NOW()`)
-     // Prioritize package-specific option price over universal price
+     const deduplicatedOptRows = optRows;
-     const optionPricePriorityMap = new Map<number, typeof optRows[0]>();
-     for (const opt of optRows) {
-       const existing = optionPricePriorityMap.get(opt.id);
-       if (!existing || (opt.packageId !== null && existing.packageId === null)) {
-         optionPricePriorityMap.set(opt.id, opt);
-       }
-     }
-     const deduplicatedOptRows = Array.from(optionPricePriorityMap.values());
-     // Deduplicate itemRows by itemId to guarantee no duplicate specification rows
-     const seenItemIds = new Set<number>();
-     const deduplicatedItemRows = itemRows.filter((it) => {
-       if (seenItemIds.has(it.itemId)) return false;
-       seenItemIds.add(it.itemId);
-       return true;
-     });
- 
-       const catItems = deduplicatedItemRows
+       const catItems = itemRows
-           const seenOptionSlugs = new Set<string>();
-             .filter((opt) => {
-               if (seenOptionSlugs.has(opt.slug)) return false;
-               seenOptionSlugs.add(opt.slug);
-               return true;
-             })
-     // Fetch 15 Add-Ons with active prices only
+     // Fetch 15 Add-Ons with active prices
-       .from(addonPrices)
+       .from(addonPrices);
-       .where(or(isNull(addonPrices.effectiveTo), sql`${addonPrices.effectiveTo} > NOW()`));
-       const matchingPrices = addonPriceRows
+       const variants = addonPriceRows
-         .filter((p) => p.addonId === ad.id && tierFilter.includes(p.packageTier));
+         .filter((p) => p.addonId === ad.id && tierFilter.includes(p.packageTier))
+         .map((p) => ({
+           variantSlug: p.variantSlug,
+           variantName: p.variantName,
+           packageTier: p.packageTier,
+           price: Number(p.price),
+         }));
-       // Strictly deduplicate variants by variantSlug:
-       // If a tier-specific price exists (e.g. 'basic_standard'), it takes precedence over 'all'
-       const variantMap = new Map<string, {
-         variantSlug: string;
-         variantName: string;
-         packageTier: string;
-         price: number;
-       }>();
- 
-       for (const p of matchingPrices) {
-         const existing = variantMap.get(p.variantSlug);
-         if (!existing || (p.packageTier !== 'all' && existing.packageTier === 'all')) {
-           variantMap.set(p.variantSlug, {
-             variantSlug: p.variantSlug,
-             variantName: p.variantName,
-             packageTier: p.packageTier,
-             price: Number(p.price),
-           });
-         }
-       }
- 
-       const variants = Array.from(variantMap.values());
- 
```

## src/modules/enquiries/enquiries.controller.ts (Current: 54 lines, New: 94 lines)

```diff
-     const [newEnquiry] = await db
+     // Check if an enquiry record already exists for this estimate
-       .insert(enquiries)
+     if (estimateId || data.estimateNumber) {
-       .values({
+       const existingEnquiry = await db.query.enquiries.findFirst({
-         fullName: data.fullName,
+         where: data.estimateNumber
-         phone: data.phone,
+           ? eq(enquiries.estimateNumber, data.estimateNumber.toUpperCase().trim())
-         email: data.email,
+           : eq(enquiries.estimateId, estimateId!),
-         plotLocation: data.plotLocation,
+       });
-         estimateId,
-         estimateNumber: data.estimateNumber ? data.estimateNumber.toUpperCase().trim() : null,
-         preferredContactTime: data.preferredContactTime ?? null,
-         requirementNotes: data.requirementNotes ?? null,
-         status: 'NEW',
-       })
-       .returning();
-     res.status(201).json({
+       if (existingEnquiry) {
-       success: true,
+         const [updated] = await db
-       message: 'Consultation request submitted successfully. Our team will contact you shortly.',
+           .update(enquiries)
-       data: {
+           .set({
-         id: newEnquiry.id,
+             fullName: data.fullName || existingEnquiry.fullName,
-         fullName: newEnquiry.fullName,
+             phone: data.phone || existingEnquiry.phone,
-         phone: newEnquiry.phone,
+             email: data.email || existingEnquiry.email,
-         email: newEnquiry.email,
+             plotLocation: data.plotLocation || existingEnquiry.plotLocation,
-         estimateNumber: newEnquiry.estimateNumber,
+             preferredContactTime: data.preferredContactTime ?? existingEnquiry.preferredContactTime,
-         status: newEnquiry.status,
+             requirementNotes: data.requirementNotes ?? existingEnquiry.requirementNotes,
-         createdAt: newEnquiry.createdAt,
+             updatedAt: new Date(),
-       },
+           })
-     });
+           .where(eq(enquiries.id, existingEnquiry.id))
-   } catch (error) {
+           .returning();
-     next(error);
-   }
- }
+         res.status(200).json({
+           success: true,
+           message: 'Consultation request submitted successfully. Our team will contact you shortly.',
+           data: {
+             id: updated.id,
+             fullName: updated.fullName,
+             phone: updated.phone,
+             email: updated.email,
+             estimateNumber: updated.estimateNumber,
+             status: updated.status,
+             createdAt: updated.createdAt,
+           },
+         });
+         return;
+       }
+     }
+ 
+     const [newEnquiry] = await db
+       .insert(enquiries)
+       .values({
+         fullName: data.fullName,
+         phone: data.phone,
+         email: data.email,
+         plotLocation: data.plotLocation,
+         estimateId,
+         estimateNumber: data.estimateNumber ? data.estimateNumber.toUpperCase().trim() : null,
+         preferredContactTime: data.preferredContactTime ?? null,
+         requirementNotes: data.requirementNotes ?? null,
+         status: 'NEW',
+       })
+       .returning();
+ 
+     res.status(201).json({
+       success: true,
+       message: 'Consultation request submitted successfully. Our team will contact you shortly.',
+       data: {
+         id: newEnquiry.id,
+         fullName: newEnquiry.fullName,
+         phone: newEnquiry.phone,
+         email: newEnquiry.email,
+         estimateNumber: newEnquiry.estimateNumber,
+         status: newEnquiry.status,
+         createdAt: newEnquiry.createdAt,
+       },
+     });
+   } catch (error) {
+     next(error);
+   }
+ }
+ 
```

## src/modules/pdf/pdf.service.ts (Current: 404 lines, New: 469 lines)

```diff
- // Currency Formatter Helper (Indian Rupee Numbering Format)
+ // Sanitizes text strings to replace Unicode Rupee symbol with 'Rs. ' (prevents PDFKit WinAnsi glyph encoding artifacts)
+ function cleanText(text: string | null | undefined): string {
+   if (!text) return '';
+   return String(text).replace(/₹\s?/g, 'Rs. ');
+ }
+ 
+ // Currency Formatter Helper (Indian Rupee Numbering Format with Rs. prefix)
-   if (amount === undefined || amount === null) return '₹ 0';
+   if (amount === undefined || amount === null) return 'Rs. 0';
-   if (isNaN(num)) return '₹ 0';
+   if (isNaN(num)) return 'Rs. 0';
-   return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
+   return 'Rs. ' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
-         margin: 36,
+         margins: { top: 36, bottom: 36, left: 36, right: 36 },
-       doc.fillColor('#FBBF24').font('Helvetica-Bold').fontSize(8).text('OFFICIAL ESTIMATE QUOTATION', badgeX + 10, 24);
+       doc.fillColor('#FBBF24').font('Helvetica-Bold').fontSize(8).text('OFFICIAL QUOTATION', badgeX + 10, 24);
-       doc.font('Helvetica').fillColor(DARK).text(estimate.customerName, 125, infoCardY + 23);
+       doc.font('Helvetica').fillColor(DARK).text(cleanText(estimate.customerName), 125, infoCardY + 23);
-       // Right Column: Project Technical Specs
+       // Right Column: Project Technical Specs (without index multiplier)
-       doc.font('Helvetica').text(`${estimate.plotLocation} (${estimate.locationMultiplier}x Index)`, col2X + 80, infoCardY + 23);
+       doc.font('Helvetica').text(cleanText(estimate.plotLocation), col2X + 80, infoCardY + 23);
-       doc.text('Selected Package Tier', tblX + 10, pkgTableY + 6);
+       doc.text('Selected Package Tier', tblX + 8, pkgTableY + 6);
-       doc.text('Total Built-up Area', tblX + 180, pkgTableY + 6);
+       doc.text('Total Built-up Area', tblX + 160, pkgTableY + 6);
-       doc.text('Effective Rate / Sq.Ft', tblX + 300, pkgTableY + 6);
+       doc.text('Effective Rate / Sq.Ft', tblX + 280, pkgTableY + 6);
-       doc.text('Base Amount (INR)', tblX + tblW - 120, pkgTableY + 6, { align: 'right', width: 110 });
+       doc.text('Base Amount (INR)', tblX + tblW - 110, pkgTableY + 6, { align: 'right', width: 100 });
-       doc.rect(tblX, pkgRowY, tblW, 22).fill('#FFFFFF').strokeColor(BORDER_COLOR).stroke();
+       doc.rect(tblX, pkgRowY, tblW, 20).fill('#FFFFFF').strokeColor(BORDER_COLOR).stroke();
-       doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5);
+       doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8);
-       doc.text(estimate.packageSlug.toUpperCase() + ' PACKAGE', tblX + 10, pkgRowY + 6);
+       doc.text(estimate.packageSlug.toUpperCase() + ' PACKAGE', tblX + 8, pkgRowY + 5);
-       doc.font('Helvetica').text(`${Number(estimate.totalBuiltupAreaSqft).toLocaleString('en-IN')} Sq.Ft`, tblX + 180, pkgRowY + 6);
+       doc.font('Helvetica').text(`${Number(estimate.totalBuiltupAreaSqft).toLocaleString('en-IN')} Sq.Ft`, tblX + 160, pkgRowY + 5);
-       doc.text(formatINR(estimate.packageRatePerSqft) + ' / sq.ft', tblX + 300, pkgRowY + 6);
+       doc.text(formatINR(estimate.packageRatePerSqft) + ' / sq.ft', tblX + 280, pkgRowY + 5);
-       doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(estimate.baseConstructionCost), tblX + tblW - 120, pkgRowY + 6, { align: 'right', width: 110 });
+       doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(estimate.baseConstructionCost), tblX + tblW - 110, pkgRowY + 5, { align: 'right', width: 100 });
-       doc.y = pkgRowY + 30;
+       doc.y = pkgRowY + 26;
-       const checkPageBreak = (neededHeight: number = 40) => {
+       const checkPageBreak = (neededHeight: number = 35) => {
-         if (doc.y + neededHeight > doc.page.height - 50) {
+         if (doc.y + neededHeight > doc.page.height - 40) {
+           return true;
+         return false;
-         doc.roundedRect(tblX, custTableY, tblW, 18, 3).fill('#334155');
+         doc.roundedRect(tblX, custTableY, tblW, 16, 3).fill('#334155');
-         doc.text('Item Category', tblX + 10, custTableY + 5);
+         doc.text('Item Category', tblX + 8, custTableY + 4);
-         doc.text('Selected Brand / Option', tblX + 180, custTableY + 5);
+         doc.text('Selected Brand / Option', tblX + 155, custTableY + 4);
-         doc.text('Rate Delta', tblX + 320, custTableY + 5);
+         doc.text('Rate Delta', tblX + 355, custTableY + 4, { width: 75, align: 'right' });
-         doc.text('Amount Addition', tblX + tblW - 120, custTableY + 5, { align: 'right', width: 110 });
+         doc.text('Amount Addition', tblX + tblW - 90, custTableY + 4, { align: 'right', width: 80 });
-         let curY = custTableY + 18;
+         let curY = custTableY + 16;
-           if (curY + 20 > doc.page.height - 50) {
+           if (curY + 16 > doc.page.height - 40) {
+ 
+             // Redraw table header on continuation page
+             doc.roundedRect(tblX, curY, tblW, 16, 3).fill('#334155');
+             doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
+             doc.text('Item Category', tblX + 8, curY + 4);
+             doc.text('Selected Brand / Option', tblX + 155, curY + 4);
+             doc.text('Rate Delta', tblX + 355, curY + 4, { width: 75, align: 'right' });
+             doc.text('Amount Addition', tblX + tblW - 90, curY + 4, { align: 'right', width: 80 });
+             curY += 16;
-           doc.rect(tblX, curY, tblW, 18).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
+           doc.rect(tblX, curY, tblW, 15).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
-           doc.fillColor(DARK).font('Helvetica').fontSize(7.5);
+           doc.fillColor(DARK).font('Helvetica').fontSize(7);
-           doc.text(item.itemName, tblX + 10, curY + 5);
+           doc.text(cleanText(item.itemName), tblX + 8, curY + 4, { width: 142, lineBreak: false, ellipsis: true });
-           doc.font('Helvetica-Bold').text(item.selectedOptionName, tblX + 180, curY + 5);
+           doc.font('Helvetica-Bold').text(cleanText(item.selectedOptionName), tblX + 155, curY + 4, { width: 195, lineBreak: false, ellipsis: true });
-           doc.font('Helvetica').text(`+${formatINR(item.unitPriceDelta)} / sq.ft`, tblX + 320, curY + 5);
+           
-           doc.font('Helvetica-Bold').text(formatINR(item.calculatedPrice), tblX + tblW - 120, curY + 5, { align: 'right', width: 110 });
+           const deltaNum = Number(item.unitPriceDelta);
-           curY += 18;
+           const deltaText = deltaNum > 0 ? `+${formatINR(deltaNum)} / sq.ft` : 'Included';
+           doc.font('Helvetica').text(deltaText, tblX + 355, curY + 4, { width: 75, align: 'right', lineBreak: false });
+           
+           const priceNum = Number(item.calculatedPrice);
+           const priceText = priceNum > 0 ? formatINR(priceNum) : 'Rs. 0';
+           doc.font('Helvetica-Bold').text(priceText, tblX + tblW - 90, curY + 4, { align: 'right', width: 80, lineBreak: false });
+           curY += 15;
-         doc.roundedRect(tblX, addonTableY, tblW, 18, 3).fill('#334155');
+         doc.roundedRect(tblX, addonTableY, tblW, 16, 3).fill('#334155');
-         doc.text('Add-On Name', tblX + 10, addonTableY + 5);
+         doc.text('Add-On Name', tblX + 8, addonTableY + 4);
-         doc.text('Variant / Specification', tblX + 180, addonTableY + 5);
+         doc.text('Variant / Specification', tblX + 155, addonTableY + 4);
-         doc.text('Quantity / Unit', tblX + 320, addonTableY + 5);
+         doc.text('Quantity / Unit', tblX + 355, addonTableY + 4, { width: 75, align: 'right' });
-         doc.text('Total Cost', tblX + tblW - 120, addonTableY + 5, { align: 'right', width: 110 });
+         doc.text('Total Cost', tblX + tblW - 90, addonTableY + 4, { align: 'right', width: 80 });
-         let curY = addonTableY + 18;
+         let addY = addonTableY + 16;
-           if (curY + 20 > doc.page.height - 50) {
+           if (addY + 16 > doc.page.height - 40) {
-             curY = 42;
+             addY = 42;
+ 
+             // Redraw table header on continuation page
+             doc.roundedRect(tblX, addY, tblW, 16, 3).fill('#334155');
+             doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
+             doc.text('Add-On Name', tblX + 8, addY + 4);
+             doc.text('Variant / Specification', tblX + 155, addY + 4);
+             doc.text('Quantity / Unit', tblX + 355, addY + 4, { width: 75, align: 'right' });
+             doc.text('Total Cost', tblX + tblW - 90, addY + 4, { align: 'right', width: 80 });
+             addY += 16;
-           doc.rect(tblX, curY, tblW, 18).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
+           doc.rect(tblX, addY, tblW, 15).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
-           doc.fillColor(DARK).font('Helvetica').fontSize(7.5);
+           doc.fillColor(DARK).font('Helvetica').fontSize(7);
-           doc.text(addon.addonName, tblX + 10, curY + 5);
+           doc.text(cleanText(addon.addonName), tblX + 8, addY + 4, { width: 142, lineBreak: false, ellipsis: true });
-           doc.font('Helvetica-Bold').text(addon.selectedVariant.replace(/_/g, ' ').toUpperCase(), tblX + 180, curY + 5);
+           doc.font('Helvetica-Bold').text(cleanText(addon.selectedVariant.replace(/_/g, ' ').toUpperCase()), tblX + 155, addY + 4, { width: 195, lineBreak: false, ellipsis: true });
-           doc.font('Helvetica').text(`${addon.quantity} ${addon.unit}`, tblX + 320, curY + 5);
+           doc.font('Helvetica').text(`${addon.quantity} ${addon.unit.replace(/_/g, ' ')}`, tblX + 355, addY + 4, { width: 75, align: 'right', lineBreak: false });
-           doc.font('Helvetica-Bold').text(formatINR(addon.totalPrice), tblX + tblW - 120, curY + 5, { align: 'right', width: 110 });
+           doc.font('Helvetica-Bold').text(formatINR(addon.totalPrice), tblX + tblW - 90, addY + 4, { align: 'right', width: 80, lineBreak: false });
-           curY += 18;
+           addY += 15;
-         doc.y = curY + 10;
+         doc.y = addY + 10;
-       let sumBoxH = 50;
+       let sumBoxH = 46;
-       if (hasUpgrades) sumBoxH += 16;
+       if (hasUpgrades) sumBoxH += 14;
-       if (hasAddons) sumBoxH += 16;
+       if (hasAddons) sumBoxH += 14;
-       checkPageBreak(sumBoxH + 20);
+       checkPageBreak(sumBoxH + 15);
-       const sumBoxY = doc.y + 4;
+       const sumBoxY = doc.y + 2;
-       let currentSumY = sumBoxY + 8;
+       let currentSumY = sumBoxY + 7;
-       doc.fillColor(DARK).font('Helvetica').fontSize(8.5).text('Base Construction Cost:', sumBoxX + 12, currentSumY);
+       doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Base Construction Cost:', sumBoxX + 10, currentSumY);
-       doc.font('Helvetica-Bold').text(formatINR(estimate.baseConstructionCost), sumBoxX + sumBoxW - 120, currentSumY, { align: 'right', width: 108 });
+       doc.font('Helvetica-Bold').text(formatINR(estimate.baseConstructionCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
-       currentSumY += 16;
+       currentSumY += 14;
-         doc.fillColor(DARK).font('Helvetica').fontSize(8.5).text('Specification Upgrades:', sumBoxX + 12, currentSumY);
+         doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Specification Upgrades:', sumBoxX + 10, currentSumY);
-         doc.font('Helvetica-Bold').text(formatINR(estimate.upgradesCost), sumBoxX + sumBoxW - 120, currentSumY, { align: 'right', width: 108 });
+         doc.font('Helvetica-Bold').text(formatINR(estimate.upgradesCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
-         currentSumY += 16;
+         currentSumY += 14;
-         doc.fillColor(DARK).font('Helvetica').fontSize(8.5).text('Add-Ons Subtotal:', sumBoxX + 12, currentSumY);
+         doc.fillColor(DARK).font('Helvetica').fontSize(8).text('Add-Ons Subtotal:', sumBoxX + 10, currentSumY);
-         doc.font('Helvetica-Bold').text(formatINR(estimate.addonsCost), sumBoxX + sumBoxW - 120, currentSumY, { align: 'right', width: 108 });
+         doc.font('Helvetica-Bold').text(formatINR(estimate.addonsCost), sumBoxX + sumBoxW - 110, currentSumY, { align: 'right', width: 100 });
-         currentSumY += 16;
+         currentSumY += 14;
-       doc.rect(sumBoxX, currentSumY - 2, sumBoxW, 24).fill(GOLD_LIGHT);
+       doc.rect(sumBoxX, currentSumY - 2, sumBoxW, 22).fill(GOLD_LIGHT);
-       doc.fillColor(NAVY_HEADER).font('Helvetica-Bold').fontSize(9.5).text('TOTAL PROJECT COST:', sumBoxX + 12, currentSumY + 4);
+       doc.fillColor(NAVY_HEADER).font('Helvetica-Bold').fontSize(8.5).text('TOTAL PROJECT COST:', sumBoxX + 10, currentSumY + 3);
-       doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(11).text(formatINR(estimate.totalProjectCost), sumBoxX + sumBoxW - 130, currentSumY + 3, { align: 'right', width: 118 });
+       doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(10.5).text(formatINR(estimate.totalProjectCost), sumBoxX + sumBoxW - 120, currentSumY + 2, { align: 'right', width: 110 });
-       doc.y = 62;
+       doc.y = 60;
-       doc.roundedRect(tblX, msTableY, tblW, 18, 3).fill(TEAL_ACCENT);
+       doc.roundedRect(tblX, msTableY, tblW, 16, 3).fill(TEAL_ACCENT);
-       doc.text('Stage', tblX + 8, msTableY + 5);
+       doc.text('Stage', tblX + 8, msTableY + 4);
-       doc.text('Milestone Description & Work Scope', tblX + 55, msTableY + 5);
+       doc.text('Milestone Description & Work Scope', tblX + 55, msTableY + 4);
-       doc.text('Share %', tblX + 370, msTableY + 5);
+       doc.text('Share %', tblX + 370, msTableY + 4);
-       doc.text('Amount (INR)', tblX + tblW - 110, msTableY + 5, { align: 'right', width: 100 });
+       doc.text('Amount (INR)', tblX + tblW - 110, msTableY + 4, { align: 'right', width: 100 });
-       let msY = msTableY + 18;
+       let msY = msTableY + 16;
-         doc.rect(tblX, msY, tblW, 19).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
+         doc.rect(tblX, msY, tblW, 17).fill(rowBg).strokeColor(BORDER_COLOR).stroke();
-         doc.text(`Stage ${m.stageNumber || idx + 1}`, tblX + 8, msY + 5);
+         doc.text(`Stage ${m.stageNumber || idx + 1}`, tblX + 8, msY + 4);
-         const stageTitle = m.stageName || m.name || m.title || `Stage ${idx + 1} Completion`;
+         const stageTitle = cleanText(m.stageName || m.name || m.title || `Stage ${idx + 1} Completion`);
-         doc.text(stageTitle, tblX + 55, msY + 5);
+         doc.text(stageTitle, tblX + 55, msY + 4);
-           doc.text(m.keyDeliverables, tblX + 175, msY + 5, { width: 190, lineBreak: false });
+           doc.text(cleanText(m.keyDeliverables), tblX + 175, msY + 4, { width: 190, lineBreak: false, ellipsis: true });
-         doc.font('Helvetica').fontSize(7.5).fillColor(DARK).text(`${m.percentage}%`, tblX + 370, msY + 5);
+         doc.font('Helvetica').fontSize(7.5).fillColor(DARK).text(`${m.percentage}%`, tblX + 370, msY + 4);
-         doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(m.amount), tblX + tblW - 110, msY + 5, { align: 'right', width: 100 });
+         doc.font('Helvetica-Bold').fillColor(PRIMARY).text(formatINR(m.amount), tblX + tblW - 110, msY + 4, { align: 'right', width: 100 });
-         msY += 19;
+         msY += 17;
-       doc.rect(tblX, msY, tblW, 22).fill('#E2E8F0').strokeColor(PRIMARY).stroke();
+       doc.rect(tblX, msY, tblW, 19).fill('#E2E8F0').strokeColor(PRIMARY).stroke();
-       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8.5);
+       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8);
-       doc.text('TOTAL CONTRACT VALUE', tblX + 55, msY + 6);
+       doc.text('TOTAL CONTRACT VALUE', tblX + 55, msY + 5);
-       doc.text('100.00%', tblX + 370, msY + 6);
+       doc.text('100.00%', tblX + 370, msY + 5);
-       doc.text(formatINR(estimate.totalProjectCost), tblX + tblW - 110, msY + 6, { align: 'right', width: 100 });
+       doc.text(formatINR(estimate.totalProjectCost), tblX + tblW - 110, msY + 5, { align: 'right', width: 100 });
-       doc.y = msY + 30;
+       doc.y = msY + 22;
-       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9.5).text('TERMS & STANDARD CONDITIONS', 36, doc.y);
+       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8.5).text('TERMS & STANDARD CONDITIONS', 36, doc.y);
-       doc.y += 5;
+       doc.y += 4;
-         doc.fillColor(DARK).font('Helvetica').fontSize(7.5).text(t, 42, doc.y);
+         doc.fillColor(DARK).font('Helvetica').fontSize(6.5).text(t, 42, doc.y);
-         doc.y += 11;
+         doc.y += 8.5;
+       // 11 STANDARD EXCLUSIONS & CLIENT SCOPE
+       // ----------------------------------------------------
+       doc.y += 3;
+       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8).text('STANDARD EXCLUSIONS & CLIENT SCOPE (Out of Scope for Civil Contract):', 36, doc.y);
+       doc.y += 3;
+ 
+       const exclusionsCol1 = [
+         '• Elevation Work (Special exterior stone/HPL claddings)',
+         '• Outer Area Development (Setbacks, paving & landscape)',
+         '• Interior Works & Carpentry (Wardrobes, modular units)',
+         '• DTCP & Local Body Building Plan Sanction Fees',
+         '• Electricity Board (EB) Connection & Meter Deposits',
+         '• Gas Connection & Piped Gas Installation Charges',
+       ];
+       const exclusionsCol2 = [
+         '• Drinking Water & Drainage (UGD) Connection Fees',
+         '• Borewell Drilling, Casing & Submersible Piping',
+         '• Water Pumps & Motors (unless chosen as Add-On)',
+         '• Electrical Appliances (TV, Fridge, ACs, Chimney)',
+         '• Vacant Land Tax (VLT) & Local Property Taxes',
+       ];
+ 
+       const exclY = doc.y;
+       exclusionsCol1.forEach((t, i) => {
+         doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(6.5).text(t, 42, exclY + (i * 8));
+       });
+       exclusionsCol2.forEach((t, i) => {
+         doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(6.5).text(t, 290, exclY + (i * 8));
+       });
+       doc.y = exclY + (exclusionsCol1.length * 8) + 4;
+ 
+       // ----------------------------------------------------
-       const sigY = 740; // Fixed Y position on A4 (height 841.89)
+       const sigY = 745; // Fixed Y position on A4 (height 841.89)
-       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8).text('For Asthiwar Design & Build', 36, sigY + 8);
+       doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5).text('For Asthiwar Design & Build', 36, sigY + 6);
-       doc.font('Helvetica').fontSize(7).fillColor(TEXT_MUTED).text('Authorized Engineering Signatory', 36, sigY + 20);
+       doc.font('Helvetica').fontSize(6.5).fillColor(TEXT_MUTED).text('Authorized Engineering Signatory', 36, sigY + 16);
-       doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY).text('Customer Acknowledgment', doc.page.width - 190, sigY + 8);
+       doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PRIMARY).text('Customer Acknowledgment', doc.page.width - 190, sigY + 6);
-       doc.font('Helvetica').fontSize(7).fillColor(TEXT_MUTED).text('Signature / Acceptance Date: ___________________', doc.page.width - 190, sigY + 20);
+       doc.font('Helvetica').fontSize(6.5).fillColor(TEXT_MUTED).text('Signature / Acceptance Date: ___________________', doc.page.width - 190, sigY + 16);
-       // DYNAMIC PAGE NUMBERING
+       // DYNAMIC PAGE NUMBERING (With bottom margin set to 0 to prevent ghost pages)
+         doc.page.margins.bottom = 0;
-           doc.page.height - 25,
+           doc.page.height - 18,
```

