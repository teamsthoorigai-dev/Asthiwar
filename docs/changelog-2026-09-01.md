# Master Changelog & Feature Log
**Date:** 2026-09-01

This document outlines all Frontend, Backend, and Database changes implemented across the Asthiwar application on 2026-09-01.

---

## 1. Brand Customisation Tab with Full CRUD

### Overview
Added a new tab **"Brand Customisation (10)"** as the **2nd tab** (after "Package Rates (4)") in the Admin Pricing & Matrix Control Center. Enables full CRUD operations (Create, Read, Update, Delete) for specification brand options and upgrade delta rates across all 10 specification categories.

### DB Changes
- Utilized existing `categories`, `items`, `options`, `option_prices`, and `package_items` schema tables in PostgreSQL.
- Hard deletion of brand options safely cascades to `option_prices` without corrupting past estimate records.

### Backend Changes
- **`admin-config.schema.ts`**: Added `createOptionSchema` validating `itemId`, `name`, `slug`, `description`, and `priceDelta`. Updated `updateOptionPriceSchema` to accept optional brand name updates.
- **`admin-config.service.ts`**:
  - Added `createAdminOption(dto)`: Inserts a new row in `options` and initial price in `optionPrices`.
  - Added `deleteAdminOption(optionId)`: Deletes `optionPrices` and `options` records.
  - Updated `updateAdminOptionPrice()`: Supports updating both brand option name and price delta in-place.
- **`admin-config.controller.ts`**: Added `createOptionController` and `deleteOptionController`.
- **`admin-config.routes.ts`**: Registered `POST /api/v1/admin/config/options` and `DELETE /api/v1/admin/config/options/:id`.

### Frontend Changes
- **`adminApi.ts`**: Added `getAdminSpecificationConfigs`, `createAdminOption`, `updateAdminOptionPrice`, and `deleteAdminOption`.
- **`AdminPricingConfigManager.tsx`**:
  - Positioned **`Brand Customisation (10)`** as the 2nd tab in navigation bar.
  - Rendered 10 Category filter pills (Structure & Civil, Flooring, Bathroom, Kitchen, Painting, Electrical, etc.).
  - Added item cards displaying brand options, editable brand names, and editable upgrade delta rates (₹/sq.ft).
  - Added **Modal Popup Form** triggered by `+ Add Brand Option` to create brand options.
  - Added Trash icon button on brand rows for deletion with confirmation (`window.confirm`).

---

## 2. Motor Automation (Auto Cut-Off) Combined Variant

### Overview
Added a combined variant option for the **Motor Automation (Auto Cut-Off)** add-on combining both Bore Water OHT (₹12,000) and Corporation Water OHT (₹12,000) into a single option.

### DB Changes
- **`seed.ts`**: Added `Both (Bore & Corporation Water OHT)` variant (slug: `both`, price: `₹24,000.00`).
- Executed `npm run db:seed` to seed the variant into the `addon_prices` table in Neon PostgreSQL.

### Backend & Frontend Impact
- Automatically fetched and exposed via `GET /api/v1/config/addons`.
- Rendered in Step 4: Add-Ons catalog in the public Cost Calculator and under the Add-Ons tab in the Admin Portal.

---

## 3. Remove / Delete City Feature

### Overview
Added the ability for administrators to delete cities/locations from the Admin Portal under the **City Factors** tab.

### DB Changes
- Verified `estimates.location_id` foreign key constraint (`onDelete: 'set null'`) so deleting a location safely unlinks estimates without errors.

### Backend Changes
- **`admin-config.service.ts`**: Added `deleteAdminLocation(locationId)`.
- **`admin-config.controller.ts`**: Added `deleteLocationController` with audit logging (`DELETE_LOCATION`).
- **`admin-config.routes.ts`**: Registered `DELETE /api/v1/admin/config/locations/:id`.

### Frontend Changes
- **`adminApi.ts`**: Added `deleteAdminLocation(id)`.
- **`AdminPricingConfigManager.tsx`**: Added a Trash icon button on each city card under the **City Factors** tab with a confirmation prompt.

---

## 4. Editable Volume Discount Threshold

### Overview
Made the 3,500 sq.ft volume discount threshold editable for each package tier in the Admin Portal.

### DB & Backend
- Utilized existing `volumeDiscountThresholdSqft` column in `packages` table and pricing controllers/services.

### Frontend Changes
- **`AdminPricingConfigManager.tsx`**:
  - Rendered a 3-column input grid (`Standard Rate`, `Volume Threshold`, `Volume Rate`).
  - Equalized label heights (`h-9 flex flex-col justify-end`) for horizontal alignment across cards.
  - Added `sqft` badge suffix and updated rate badge subtitles.

---

## 5. UI & Bug Fixes

- **Header Component (`Header.tsx`)**: Removed redundant "Sign Out" button from main navbar.
- **Backend Controller Fix (`admin-config.controller.ts`)**: Fixed `parseInt` parameter parsing that converted package text slugs (e.g., `'basic'`, `'standard'`) to `NaN`.

---

## 6. Modal Viewport Portaling & Body Scroll Lock Fix

### Overview
Fixed all modal popups across the application that were previously trapped in parent scrolling container stacking contexts (`fixed inset-0` scrolling with the page).

### Frontend Changes
- **`Modal.tsx`**: Created a reusable `Modal` wrapper component utilizing `ReactDOM.createPortal(..., document.body)`. Mounts popups directly to `document.body` to un-attach them from scrolling parent elements, automatically locks body scrolling (`document.body.style.overflow = 'hidden'`), and adds `ESC` keypress and backdrop overlay click dismissal handlers.
- **Refactored Components**:
  - **`AdminPricingConfigManager.tsx`**: Refactored Add Brand Option modal.
  - **`AdminEstimatesExplorer.tsx`**: Refactored Estimate Snapshot Inspection modal.
  - **`AdminEnquiriesManager.tsx`**: Refactored Consultation Lead Details modal.
  - **`Step5EstimateReport.tsx`**: Refactored Free Site Assessment Booking modal.

---

## 7. Moved Gate Area & Compound Wall from Step 1 to Step 4 Add-Ons Catalog

### Overview
Removed input fields for **Gate Area (Sq.Ft)** and **Compound Wall (R.Ft)** from **Step 1 (Dimensions)** to eliminate duplication and streamline the initial plot dimension input process.

### Frontend Changes
- **`Step1Dimensions.tsx`**: Removed Gate Area (Sq.Ft) and Compound Wall (R.Ft) input fields. Step 1 now exclusively collects core construction areas (Car Parking Area & Head Room Area).
- **Step 4 (Add-Ons Catalog)**: `Main Gate` (per sq.ft) and `Compound Wall (up to 5'6" Height)` (per rft) are configured exclusively as optional add-ons in Step 4 where customers select variants and running length / gate dimensions.

---

## 8. Added Cents Conversion Display for Plot Area

### Overview
Updated the Total Plot Area input field badge in Step 1 to dynamically display the equivalent **Cents** value when **Sq.Ft** is selected.

### Frontend Changes
- **`Step1Dimensions.tsx`**: 
  - When `Sq.Ft` is selected as the plot unit, the badge header now displays `≈ X Cents` (e.g. `2400 Sq.Ft` $\rightarrow$ `≈ 5.51 Cents`).
  - When `Cents`, `Sq.Yards`, or `Sq.Meter` is selected, the badge displays `≈ X Sq.Ft`.

---

## 9. Renamed Compound Wall Add-On Title

### Overview
Updated the display title of the Compound Wall add-on from `"Compound Wall (up to 5'6")"` to `"Compound Wall (up to 5'6" Height)"`.

### Database & Seed Changes
- **`seed.ts`**: Updated add-on definition name to `Compound Wall (up to 5'6" Height)` and added `onConflictDoUpdate` to synchronize name changes on Neon PostgreSQL. Re-seeded master data.

---

## 10. Fixed Brand Customisation Blank Inputs & Database Option Seeding

### Overview
Investigated and resolved an issue where Brand Customisation input fields rendered empty/blank in the Admin Portal.

### Root Cause & Resolution
1. **Schema Field Mismatch**: In the PostgreSQL `options` table, the column for brand option name is defined as `brandName` (not `name`). The frontend UI (`AdminPricingConfigManager.tsx`) was attempting to read `opt.name`, which evaluated to `undefined`.
2. **Backend & Frontend Fix**:
   - **`AdminPricingConfigManager.tsx`**: Updated state initialization and form rendering to read `opt.brandName || opt.name`.
   - **`admin-config.service.ts`**: Updated `createAdminOption`, `deleteAdminOption`, and `updateAdminOptionPrice` to map `brandName` correctly.
3. **Database Seeding**:
   - **`seed.ts`**: Fixed options upsert logic and executed `npm run db:seed` to seed **40 master brand options** (Any ISI Brand, SPA/Vizag, ARS/Suryadev, JSW/TATA, Ramco/Dalmia, Ultratech/Chettinad, Dr. Fixit, Parryware, Jaquar, Asian Paints, Philips, Legrand, etc.) into Neon PostgreSQL.





