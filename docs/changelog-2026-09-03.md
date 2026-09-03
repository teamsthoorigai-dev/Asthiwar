# Master Changelog & Feature Log
**Date:** 2026-09-03

This document details all Frontend, Backend, Database, Seed, PDF, and Admin changes implemented across the Asthiwar application on 2026-09-03.

---

## 1. Brand Customisation Per-Package Pricing Architecture & CRUD Overhaul

### Overview
Completely overhauled the brand customizations pricing model and CRUD pipeline in the Admin Portal. The system now enforces strict package-specific pricing (Basic, Standard, Premium, Luxury) with an intuitive **"Free / Included" vs "Upgrade Charge"** toggle across both the admin dashboard and public cost calculator.

### Database & Architecture Impact
- **Table:** `option_prices`
- **Integrity Verified:** Confirmed `option_prices.id` is not referenced by any foreign key. Past customer estimates store immutable JSON snapshots of pricing at calculation time, making clean-slate price set updates 100% safe.
- **Strict Package Joins:** `calculator.controller.ts` now joins `option_prices` strictly on `optionPrices.packageId = pkg.id`, completely removing ambiguous fallback queries.
- **Database Sanitization:** Created `sanitize_option_prices.ts` to purge orphaned null `package_id` rows and floor legacy negative downgrade deltas to `0.00` (Included).

### Backend Changes
- **`admin-config.schema.ts`**:
  - Extended `createOptionSchema` and `updateOptionPriceSchema` to accept `isComplimentary?: boolean` alongside `packageId` and `priceDelta`.
- **`admin-config.service.ts`**:
  - `createAdminOption`: Batch inserts package-specific price rows for all 4 tiers (defaulting to 0.00 for complimentary tiers).
  - `updateAdminOptionPrice`: Cleans existing option prices and batch inserts package-specific price definitions with automatic handling of `isComplimentary`.
- **`admin-config.controller.ts`**:
  - Updated `updateOptionPriceController` response messaging to reflect batch price updates.

### Frontend Changes
- **`AdminPricingConfigManager.tsx`**:
  - **Interactive Free / Upgrade UI:**
    - Replaced raw universal number inputs with responsive 4-tier cards (Basic, Standard, Premium, Luxury).
    - Tiers where a brand is included display a green `✓ Free` button.
    - Clicking `✓ Free` switches into a custom rate input (e.g. `₹15`, `₹45`, `₹95`).
    - Clicking `✕` resets the tier back to `✓ Free`.
    - Applied consistently across both the **Inline Brand Table** and the **Add Brand Option Modal**.
- **`Step4Customizations.tsx`**:
  - Enhanced price badge formatting:
    - Upgrade: `+₹45/sqft`
    - Negative Delta / Downgrade: `−₹20/sqft (Credit)`
    - Complimentary: `✓ Included` (bold emerald badge).

---

## 2. 11 Standard Exclusions & Client Scope (Transparency & PDF Contract)

### Overview
Integrated the formal 11 Standard Construction Exclusions and Client-Scope items across both the client-facing Estimate Report (Step 5) and the downloadable formal PDF estimate summary.

### Frontend Changes (`Step5EstimateReport.tsx`)
- Added a dedicated **"Standard Exclusions & Client Scope"** card with badge and 2-column responsive layout outlining:
  1. **Elevation Work:** Custom architectural facade & exterior stone/HPL claddings beyond standard design.
  2. **Outer Area Development:** Setbacks, perimeter pavers, compound pathways & landscaping.
  3. **Interior Works & Carpentry:** Wardrobes, kitchen cabinets, modular woodwork & loose furniture.
  4. **Building Plan Sanction:** DTCP / Local body building plan approval & government liaison fees.
  5. **Electricity Board (EB):** Permanent line connection charges, meter deposit & statutory tariffs.
  6. **Gas Connection:** Piped gas line connection & municipal pipeline installation charges.
  7. **Water & Drainage (UGD):** Municipal drinking water & underground drainage connection fees.
  8. **Borewell Drilling:** Borewell drilling, PVC casing pipes & submersible pump depth piping.
  9. **Water Motors & Pumps:** Supply & installation of motors (unless chosen in Add-Ons).
  10. **Electrical Appliances:** TV, Refrigerator, Air Conditioners, Chimney, Hob & Geysers.
  11. **Taxes & Levies:** Vacant Land Tax (VLT), property assessment taxes & municipal duties.

### Backend PDF Engine (`pdf.service.ts`)
- Added a 2-column **STANDARD EXCLUSIONS & CLIENT SCOPE (Out of Scope for Civil Contract)** section positioned above the signature block.
- **PDF Layout Optimization & Ghost Page Fix:**
  - Set `doc.page.margins.bottom = 0` during footer rendering to eliminate PDFKit ghost page creation.
  - Adjusted milestone row height (17pt) and typography to ensure complete PDF estimates strictly format into clean 3-page quotation contracts.

---

## 3. Dynamic Add-On Rules & Calculator Clarifications

### Backend Calculator Engine (`calculator.service.ts`)
- Implemented dynamic package-level add-on rules for **Roof Weathering / Cool Roof Tiles**:
  - Automatically complimentary (₹0) for **Premium** and **Luxury** packages.
  - Automatically waived (₹0) for **Basic / Standard** packages when terrace quantity exceeds 2,000 sq.ft.

### Frontend Dimensions Note (`Step1Dimensions.tsx`)
- Added a clarifying microcopy note under **Car Parking Area (Sq.Ft)**:
  `Note: Only if parking is separate from the floor built-up area above.`

---

## 4. Package Tagline Cleanup & Master Data Seed

### Premium Package Tagline
- Updated the Premium package tagline from `"Best Value / Most Popular"` to `"Best Value"` across:
  - Master Seed (`database/src/seeds/seed.ts`)
  - Live Neon PostgreSQL Database (`packages` table)
  - Public Calculator UI (`Step3Packages.tsx`)

### Master Seed (`database/src/seeds/seed.ts`) Sync
- **Add-On Pricing Sync:**
  - Motor Automation: Bore Water OHT (₹12,000), Corporation Water OHT (₹12,000), Both (₹24,000).
  - Pressure Pump: 4 variants (₹57,500 to ₹1,07,000).
  - Water Softener: AO Smith (₹1,05,000).
- **Milestone Stages Seeding:**
  - `seedMilestones()` populating all 10 standard construction milestones with percentage shares and deliverables using `onConflictDoUpdate`.

---

## 5. Verification & Testing

- **TypeScript Typecheck (`npx tsc --noEmit`)**: Passed with 0 errors across frontend and backend.
- **Database Schema Validation**: Verified cascade constraints and query safety.
- **Admin Dashboard Integration**: Tested brand option creation, package-level editing, and deletion flows with the Free/Upgrade toggle.
- **Live Servers**: Verified active development servers on ports 5173 / 3000 / 4000.
