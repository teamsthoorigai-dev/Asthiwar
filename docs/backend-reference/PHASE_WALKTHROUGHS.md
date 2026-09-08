# ASTHIWAR — Phase Walkthrough Reports

This document tracks the detailed implementation and verification report for each phase.

---

# Phase 1: Project Scaffolding & Architecture Foundation

**Status:** ✅ Completed & Verified

### 1. Implementation Summary
* **Monorepo Structure:** Configured root `package.json` with npm workspaces (`database`, `backend`).
* **Shared Config:** Created `tsconfig.base.json` with path aliases for `@asthiwar/database`, `.env.example`, and `.env`.
* **Database Layer (`database/`):**
  * Integrated **Drizzle ORM** with **`node-postgres`** (`pg`).
  * Automated SSL detection for **Neon PostgreSQL**.
  * Health verification utility (`testDatabaseConnection`) with latency tracking.
* **Backend API Layer (`backend/`):**
  * Built Express factory with `helmet`, `cors`, `cookie-parser`, `morgan`, and graceful shutdown handlers.
  * Zod environment validator (`backend/src/config/env.ts`).
  * Centralized error handler (`backend/src/middleware/errorHandler.ts`).
  * Request validation middleware (`backend/src/middleware/validate.ts`).
  * Health check route at `GET /api/v1/health`.

### 2. Verification Evidence
* `npm run check-types`: **0 Errors**.
* `npm run build`: **0 Errors** across all workspace packages.
* Health Check Execution: Verified graceful 503 response when database is unreachable and structured diagnostics.

---

# Phase 2: Database Schema & Migration Engine (Neon PostgreSQL)

**Status:** ✅ Completed & Verified

### 1. Implementation Summary
* **Schema Modules Designed & Implemented (`database/src/schema/`):**
  1. **`admin.ts`**: `admin_users` (UUID primary key, email, bcrypt hash, role, status) & `admin_sessions` (token, expiry, IP/UserAgent).
  2. **`locations.ts`**: `locations` (city name, slug, price multiplier, sort order, active flag).
  3. **`packages.ts`**: `packages` (4 tiers: Basic, Standard, Premium, Luxury) & `package_prices` (versioned base rates with standard <= 3,500 sq.ft & volume > 3,500 sq.ft rates, effective dates).
  4. **`specifications.ts`**:
     * `categories`: 10 structural & finishing categories.
     * `items`: Specification items with measurement units (`sqft`, `rft`, `fixed`).
     * `options`: Brand choices (e.g. TATA steel, Ultratech cement, Jaquar sanitaryware).
     * `package_items`: Package-level inclusion rules, default brand mappings, and explicit additional cost unit rates.
     * `option_prices`: Versioned price differentials for brand upgrades.
  5. **`addons.ts`**: `addons` (15 add-ons catalog) & `addon_prices` (multi-tier variants: Rs./Litre, Rs./rft, fixed capacity fees).
  6. **`estimates.ts`**: `estimates` (unique human-readable `EST-YYYY-XXXXXX`, customer details, project dimensions, total breakdown, immutable milestone & snapshot JSONs), `estimate_items` (brand customization records), and `estimate_addons` (addon selections).
  7. **`enquiries.ts`**: `enquiries` (consultation leads linked to estimates, status workflow `NEW` → `CONTACTED` → `CLOSED`).
* **Drizzle Migration Generator:** Configured `drizzle-kit generate` and created `database/drizzle/0000_cute_ma_gnuci.sql` with all 16 tables, foreign keys, and indexes.
* **Migration Runner Script:** Created `database/src/migrate.ts` for automated programmatic migration against Neon PostgreSQL.

### 2. Verification Evidence
* `drizzle-kit generate`: **16 tables successfully generated** with full schema constraints.
* Generated migration file: `database/drizzle/0000_cute_ma_gnuci.sql` (240 lines, 16 tables).
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Live Connection Test — Phase 1 + Phase 2 End-to-End

**Date:** 2026-08-18 23:10 IST
**Status:** ✅ Passed

**Setup:**
* `.env` configured with real Neon PostgreSQL credentials.
* Backend compiled to `dist/` and started via `node backend/dist/server.js`.

### Test Results

| Test | Method | Endpoint / Action | Result |
|---|---|---|---|
| Server Startup | — | `node backend/dist/server.js` | ✅ Running on port 4000 |
| Health Check | `GET` | `/api/v1/health` | ✅ HTTP 200 |
| Neon DB Connected | — | Reported by health check | ✅ `connected: true` |
| DB Latency | — | Reported by health check | ✅ 685ms (Neon AP Southeast cold start) |
| 404 Handler | `GET` | `/api/v1/some-invalid-route` | ✅ HTTP 404, structured JSON |

### Health Check Response (Actual Output)

```json
{
  "status": "healthy",
  "timestamp": "2026-08-18T17:40:53.772Z",
  "service": "asthiwar-backend",
  "version": "1.0.0",
  "database": {
    "provider": "Neon PostgreSQL (node-postgres)",
    "connected": true,
    "message": "Database connection healthy",
    "latencyMs": 685
  },
  "uptimeSeconds": 10
}
```

### 404 Handler Response (Actual Output)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint GET /api/v1/some-invalid-route not found"
  }
}
```

### Notes
* A `pg` library deprecation warning for SSL mode aliasing (`sslmode=require` treated as `verify-full`) is logged at startup. **Non-breaking.** Does not affect connectivity. Will resolve in `pg` v9.

---

# Phase 3: Master Data Seeding on Neon PostgreSQL

**Date:** 2026-08-18 23:19 IST
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**File created:** `database/src/seeds/seed.ts`

The seed script is fully idempotent — uses `ON CONFLICT DO NOTHING` on all slug-keyed tables. All data traces directly to approved source documents (`temp/asthiwar_requirements_and_packages.md`).

**Data seeded (6 sections, top-down dependency order):**

| # | Section | Rows |
|---|---|---|
| 1 | **Locations** | 6 |
| 2 | **Packages** | 4 |
| 3 | **Package Prices** (versioned, with volume thresholds) | 4 |
| 4 | **Categories** | 10 |
| 5 | **Items** (specification line items across 10 categories) | 49 |
| 6 | **Options** (brand choices per item) | 40 |
| 7 | **Package Items** (4 packages × 49 items = full mapping matrix with defaults & additional cost rates) | 192 |
| 8 | **Option Prices** (upgrade deltas: red brick, RCC basement) | 6 |
| 9 | **Add-Ons** (15 catalog items) | 15 |
| 10 | **Add-On Prices** (all variants: per_litre, per_rft, fixed) | 26 |
| 11 | **Admin User** (bcrypt-hashed, salt rounds = 12) | 1 |

**Total rows seeded: 353**

### 2. Prices Seeded — Package Matrix

| Package | Standard Rate (≤ 3,500 sq.ft) | Volume Rate (> 3,500 sq.ft) |
|---|---|---|
| Basic    | ₹ 2,099 / sq.ft | ₹ 2,000 / sq.ft |
| Standard | ₹ 2,468 / sq.ft | ₹ 2,357 / sq.ft |
| Premium  | ₹ 2,899 / sq.ft | ₹ 2,799 / sq.ft |
| Luxury   | ₹ 3,250 / sq.ft | ₹ 3,200 / sq.ft |

### 3. Key "Additional Cost" Rates Seeded

| Item | Basic | Standard | Premium | Luxury |
|---|---|---|---|---|
| Waterproofing | +₹10/sqft | Included | Included | Included |
| Furniture Layout | +₹4/sqft | +₹4/sqft | Included | Included |
| Structural Drawing | +₹6/sqft | Included | Included | Included |
| Soil Testing | +₹40/sqft | +₹40/sqft | Included | Included |
| Site Assessment | +₹10/sqft | +₹10/sqft | Included | Included |
| Electrical Drawings | +₹6/sqft | +₹6/sqft | Included | Included |
| Plumbing Drawings | +₹6/sqft | +₹6/sqft | Included | Included |
| Isometric Views | +₹8/sqft | +₹8/sqft | Included | Included |
| VR 3D | +₹40/sqft | +₹40/sqft | +₹40/sqft | Included |
| Architect Visit | +₹40/sqft | +₹40/sqft | Included | Included |
| Ceiling Fans | +₹50/sqft | +₹50/sqft | Included | Included |
| Roof Weathering | +₹80/sqft (<2000) | +₹70/sqft (<2000) | Included | Included |
| Lofts & Shelves | +₹12/sqft | +₹12/sqft | Included | Included |
| False Ceiling | +₹12/sqft | +₹12/sqft | Included | Included |
| Red Brick upgrade | +₹120/sqft | +₹100/sqft | +₹100/sqft | Included |
| RCC Basement upgrade | +₹40/sqft | +₹40/sqft | +₹40/sqft | Included |

### 4. Locations Seeded

| City | Slug | Price Multiplier |
|---|---|---|
| Coimbatore | coimbatore | 1.0000 |
| Pollachi   | pollachi   | 0.9600 |
| Tiruppur   | tiruppur   | 0.9800 |
| Erode      | erode      | 0.9800 |
| Chennai    | chennai    | 1.0500 |
| Other TN   | other_tn   | 0.9600 |

### 5. Verification Evidence — Live Row Counts from Neon

Verified via direct `SELECT COUNT(*)` queries post-seed:

```
locations            6
packages             4
package_prices       4
categories           10
items                49
options              40
package_items        192
option_prices        6
addons               15
addon_prices         26
admin_users          1
```

* `npm run check-types`: **0 Errors**
* `npm run db:migrate`: **Migrations applied successfully**
* `npm run db:seed`: **Exit code 0 — All 353 rows seeded**
* **Idempotency confirmed:** Re-running seed produces 0 new rows (ON CONFLICT DO NOTHING).

### 6. Notes

* **Waste Water Recycling Tank** (Add-On #15): Price seeded as ₹0.00. Source document states "Conditional on user input" — no fixed price exists. This is intentional per Rule 3: *Never invent missing prices.* Will be resolved as a custom quote item in the calculator.
* **Admin Password:** Default password used. Must set `ADMIN_SEED_PASSWORD` in `.env` before production deployment.
* **bcrypt** added to `@asthiwar/database` dependencies (salt rounds = 12).

---

# Phase 4: Authoritative Pricing & Calculation Engine

**Date:** 2026-08-18 23:28 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/calculator/calculator.types.ts` — Complete TypeScript interfaces for inputs, intermediate calculations, snapshots, milestone schedules, and final estimate response.
* `backend/src/modules/calculator/calculator.schema.ts` — Zod request validation schema for input payloads.
* `backend/src/modules/calculator/calculator.service.ts` — Authoritative calculation engine with unit conversions, volume threshold triggers, location multipliers, brand delta pricing, add-ons calculation, 10-stage milestone generation, estimate number generation, and immutable database snapshot persistence.
* `backend/src/modules/calculator/calculator.test.ts` — Comprehensive automated verification test suite.
* `database/src/index.ts` — Re-exported Drizzle ORM query operators for unified type resolution across workspaces.

### 2. Core Calculation Rules Implemented

| Rule | Implementation Details |
|---|---|
| **Area Normalization** | Converts `cents` ($\times 435.6$), `sqyards` ($\times 9$), and `sqft` ($\times 1$). |
| **Total Built-up Area** | $\text{Total Sq.Ft} = (\text{Built-up per floor} \times \text{Number of Floors}) + \text{Car Parking Area}$. |
| **Standard vs. Volume Rate** | Automatically toggles to volume rate when total built-up area $> 3,500\text{ sq.ft}$. |
| **Location Multipliers** | Dynamically resolves city multiplier (e.g. Chennai $1.05\times$, Coimbatore $1.00\times$, Pollachi $0.96\times$). |
| **Brand Customizations** | Computes per-sq.ft rate additions (e.g. Red brick $+₹100$/sq.ft or $+₹120$/sq.ft) and additional cost items (Waterproofing $+₹10$/sq.ft). |
| **15 Add-Ons Calculation** | Resolves variant prices with multi-unit support (`per_litre`, `per_rft`, `per_sqft_gate`, `per_sqft_terrace`, `fixed`). |
| **10-Stage Milestones** | Exact percentage breakdown (Stage 1 to 10) with zero-rounding-error balancing to ensure the sum strictly equals `totalProjectCost` to the single rupee. |
| **Human-Readable ID** | Generates unique format: `EST-YYYY-XXXXXX` (e.g. `EST-2026-417145`). |
| **Immutable Snapshots** | When persisted, records full calculation state, individual item selections in `estimate_items`, and addon items in `estimate_addons`. |

### 3. Automated Test Suite Results (`calculator.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/calculator/calculator.test.ts`

```
📐 ASTHIWAR Calculation Engine Test Suite — Phase 4
----------------------------------------------------

[Test 1] Area Unit Conversions
  ✅ PASS: 3 Cents converts to 1306.8 sq.ft
  ✅ PASS: 200 Sq.Yards converts to 1800 sq.ft
  ✅ PASS: 1500 Sq.Ft converts directly to 1500 sq.ft

[Test 2] Standard Rate Calculation (<= 3,500 sq.ft)
  ✅ PASS: Total builtup area is 2000 sqft
  ✅ PASS: Standard rate is applied (not volume)
  ✅ PASS: Base rate is ₹2,468 / sqft
  ✅ PASS: Base cost is exactly ₹49,36,000
  ✅ PASS: Total project cost matches subtotal without add-ons

[Test 3] Volume Rate Trigger (> 3,500 sq.ft)
  ✅ PASS: Total builtup area is 4000 sqft
  ✅ PASS: Volume discount rate is applied
  ✅ PASS: Volume base rate is ₹2,000 / sqft (standard is ₹2,099)
  ✅ PASS: Base cost is exactly ₹80,00,000

[Test 4] City Location Multipliers
  ✅ PASS: Chennai location multiplier is 1.05
  ✅ PASS: Effective rate in Chennai is ₹2,591.40 / sqft
  ✅ PASS: Base cost in Chennai is ₹25,91,400
  ✅ PASS: Pollachi location multiplier is 0.96
  ✅ PASS: Effective rate in Pollachi is ₹2,369.28 / sqft

[Test 5] Customizations & Brand Upgrades
  ✅ PASS: 1 customization recognized
  ✅ PASS: Red brick upgrade delta is ₹100/sqft
  ✅ PASS: Red brick calculated price is ₹2,00,000 (2000 sqft * ₹100)
  ✅ PASS: Total upgrades cost is ₹2,00,000
  ✅ PASS: Total project cost includes upgrades (₹51,36,000)

[Test 6] Add-Ons Calculations
  ✅ PASS: 3 add-ons recognized
  ✅ PASS: 5000L Flyash Sump is ₹1,30,000 (@ ₹26/L)
  ✅ PASS: 3kW Solar is ₹1,80,000
  ✅ PASS: 4-Pax Lift is ₹12,50,000
  ✅ PASS: Addons cost is exactly ₹15,60,000

[Test 7] 10-Stage Milestone Phase Breakdown
  ✅ PASS: 10 milestones generated
  ✅ PASS: Sum of all 10 milestone amounts (₹4936000) exactly equals totalProjectCost (₹4936000)
  ✅ PASS: Total milestone percentages sum to exactly 100%

[Test 8] Estimate Number Format
  ✅ PASS: Estimate Number 'EST-2026-417145' matches 'EST-YYYY-XXXXXX' format

[Test 9] Live Neon PostgreSQL Persistence & Snapshot Verification
  ✅ PASS: Estimate successfully saved with UUID: 29a9d84d-5c20-47e1-bc66-052cadd52553
  ✅ PASS: Estimate found in database
  ✅ PASS: DB Estimate number matches
  ✅ PASS: DB Total cost matches calculation
  ✅ PASS: 1 Customization item saved in DB (Red Bricks)
  ✅ PASS: 2 Add-ons saved in DB (Sump & Solar)

----------------------------------------------------
Results: 37 Passed, 0 Failed
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 5: Public API Endpoints (`/api/v1/calculator/*` & `/api/v1/enquiries`)

**Date:** 2026-08-18 23:31 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/calculator/calculator.controller.ts` — Handlers for active locations, packages with two-tier pricing, package-specific configuration with brand options and 15 add-ons, on-the-fly preview calculation, authoritative DB-persisted estimate creation, and historical estimate snapshot lookup by estimate number.
* `backend/src/modules/enquiries/enquiries.schema.ts` — Zod schema validating consultation lead submissions.
* `backend/src/modules/enquiries/enquiries.controller.ts` — Handler saving consultation requests linked to estimate numbers.
* `backend/src/routes/calculator.routes.ts` — Express router with validation middleware for all calculator routes.
* `backend/src/routes/enquiries.routes.ts` — Express router for consultation lead capture.
* `backend/src/routes/index.ts` — Mounted `/calculator` and `/enquiries` in API v1 router.
* `backend/src/modules/calculator/api.test.ts` — Complete automated integration test suite testing all REST API endpoints.

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/calculator/locations` | Returns active cities with location price multipliers (Coimbatore, Pollachi, Tiruppur, Erode, Chennai, Other TN). | Public |
| `GET` | `/api/v1/calculator/packages` | Returns 4 packages with summaries, descriptions, taglines, color themes, and active two-tier rates. | Public |
| `GET` | `/api/v1/calculator/config/:packageSlug` | Returns category-grouped specification items, package default brands, upgrade options, and 15 add-on variants. | Public |
| `POST` | `/api/v1/calculator/preview` | Calculates complete estimate on the fly without database persistence (for real-time frontend sliders). | Public |
| `POST` | `/api/v1/calculator/estimate` | Authoritative calculation + generates `EST-YYYY-XXXXXX` + creates immutable snapshot in Neon DB. | Public |
| `GET` | `/api/v1/calculator/estimate/:estimateNumber` | Retrieves historical immutable snapshot by estimate number for sharing / PDF rendering. | Public |
| `POST` | `/api/v1/enquiries` | Submits customer consultation lead linked to estimate number. | Public |

### 3. Automated API Integration Test Suite Results (`api.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/calculator/api.test.ts`

```
🌐 ASTHIWAR Public REST API Test Suite — Phase 5
----------------------------------------------------

[Test 1] GET /api/v1/calculator/locations
  ✅ PASS: Status code is 200
  ✅ PASS: Response has success: true
  ✅ PASS: Returns data array
  ✅ PASS: Returns 6 active locations
  ✅ PASS: Chennai multiplier is 1.05

[Test 2] GET /api/v1/calculator/packages
  ✅ PASS: Status code is 200
  ✅ PASS: Returns 4 packages
  ✅ PASS: Basic standard rate is ₹2,099/sqft
  ✅ PASS: Basic volume rate is ₹2,000/sqft

[Test 3] GET /api/v1/calculator/config/standard
  ✅ PASS: Status code is 200
  ✅ PASS: Package slug is standard
  ✅ PASS: Returns specifications array
  ✅ PASS: Contains 10 category groups
  ✅ PASS: Returns addons array
  ✅ PASS: Contains 15 add-ons catalog items

[Test 4] GET /api/v1/calculator/config/non-existent-package (404)
  ✅ PASS: Status code is 404
  ✅ PASS: Returns PACKAGE_NOT_FOUND error code

[Test 5] POST /api/v1/calculator/preview
  ✅ PASS: Status code is 200
  ✅ PASS: Calculated total cost is ₹49,36,000
  ✅ PASS: No estimateId generated (preview only, no DB save)

[Test 6] POST /api/v1/calculator/estimate (DB Persist)
  ✅ PASS: Status code is 201 (Created)
  ✅ PASS: Estimate ID generated: dc918968-64d7-4781-b3fc-05473534b8dc
  ✅ PASS: Estimate Number: EST-2026-936396

[Test 7] GET /api/v1/calculator/estimate/:estimateNumber
  ✅ PASS: Status code is 200
  ✅ PASS: Fetched estimate number matches
  ✅ PASS: Customer name matches
  ✅ PASS: Contains 10 milestone stages in snapshot

[Test 8] POST /api/v1/enquiries
  ✅ PASS: Status code is 201
  ✅ PASS: Enquiry status is NEW
  ✅ PASS: Enquiry linked to estimate number

[Test 9] Validation Failure Handling (400 Bad Request)
  ✅ PASS: Status code is 400 (Bad Request)
  ✅ PASS: Returns VALIDATION_ERROR code
  ✅ PASS: Returns array of validation details
  ✅ PASS: Captured 8 validation errors

----------------------------------------------------
Results: 34 Passed, 0 Failed
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 6: Admin Authentication & Security (`/api/v1/admin/auth/*`)

**Date:** 2026-08-18 23:34 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/auth/auth.types.ts` — TypeScript interfaces for `AdminUserDto`, `SessionResult`, and global Express `req.user` & `req.sessionToken` augmentations.
* `backend/src/modules/auth/auth.schema.ts` — Zod request validation schemas for login and password change.
* `backend/src/modules/auth/auth.service.ts` — Core authentication service managing bcrypt password verification, 7-day session tokens in Neon PostgreSQL (`admin_sessions`), session verification, session invalidation on logout, and password change with multi-session revocation.
* `backend/src/middleware/auth.ts` — `requireAdminAuth` guard middleware supporting both HttpOnly cookies (`asthiwar_session`) and `Authorization: Bearer <token>` headers.
* `backend/src/modules/auth/auth.controller.ts` — Express controllers for login (sets HttpOnly cookie), logout (clears cookie & deletes session in DB), current user verification (`/me`), and password change.
* `backend/src/routes/auth.routes.ts` — Express router with brute-force rate-limiting on login (10 attempts per 15 mins).
* `backend/src/routes/index.ts` — Mounted `/admin/auth` in API v1 router.
* `backend/src/modules/auth/auth.test.ts` — Complete automated integration test suite testing all authentication flows.

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth Requirement |
|---|---|---|---|
| `POST` | `/api/v1/admin/auth/login` | Authenticates with email & bcrypt password, returns user & session token, sets HttpOnly cookie (Rate-limited: 10/15min). | Public |
| `POST` | `/api/v1/admin/auth/logout` | Revokes current session from `admin_sessions` in Neon DB and clears cookie. | Admin Auth |
| `GET` | `/api/v1/admin/auth/me` | Returns current authenticated admin user profile (`super_admin`). | Admin Auth |
| `POST` | `/api/v1/admin/auth/change-password` | Verifies current password, hashes new password with bcrypt (12 rounds), updates DB, and revokes all user sessions. | Admin Auth |

### 3. Automated Authentication Test Suite Results (`auth.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/auth/auth.test.ts`

```
🔐 ASTHIWAR Admin Authentication & Security Test Suite — Phase 6
-----------------------------------------------------------------

[Test 1] POST /api/v1/admin/auth/login (Valid credentials)
  ✅ PASS: Status code is 200
  ✅ PASS: Response has success: true
  ✅ PASS: Returns session token
  ✅ PASS: Returns correct admin email
  ✅ PASS: Role is super_admin
  ✅ PASS: Sets session cookie in response
  ✅ PASS: Cookie name is asthiwar_session
  ✅ PASS: Cookie has HttpOnly flag

[Test 2] POST /api/v1/admin/auth/login (Non-existent email)
  ✅ PASS: Status code is 401 (Unauthorized)
  ✅ PASS: Returns INVALID_CREDENTIALS

[Test 3] POST /api/v1/admin/auth/login (Wrong password)
  ✅ PASS: Status code is 401 (Unauthorized)
  ✅ PASS: Returns INVALID_CREDENTIALS

[Test 4] GET /api/v1/admin/auth/me (Using HttpOnly Cookie)
  ✅ PASS: Status code is 200
  ✅ PASS: User profile verified via cookie

[Test 5] GET /api/v1/admin/auth/me (Using Authorization: Bearer Header)
  ✅ PASS: Status code is 200
  ✅ PASS: User profile verified via Bearer header

[Test 6] GET /api/v1/admin/auth/me (Missing token - Guard Check)
  ✅ PASS: Status code is 401 (Unauthorized)
  ✅ PASS: Returns UNAUTHORIZED code

[Test 7] GET /api/v1/admin/auth/me (Invalid session token)
  ✅ PASS: Status code is 401
  ✅ PASS: Returns SESSION_EXPIRED code

[Test 8] POST /api/v1/admin/auth/logout (Session Revocation)
  ✅ PASS: Status code is 200 (Logged out)
  ✅ PASS: Session token was deleted from Neon PostgreSQL
  ✅ PASS: Revoked token correctly returns 401

[Test 9] Password Change Workflow & All-Sessions Revocation
  ✅ PASS: Password changed successfully
  ✅ PASS: Login with old password fails
  ✅ PASS: Login with new password succeeds
  ✅ PASS: Original admin password restored for dev convenience

-----------------------------------------------------------------
Results: 27 Passed, 0 Failed
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 7: Admin Management APIs & Analytics Engine (`/api/v1/admin/*`)

**Date:** 2026-08-18 23:49 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/admin/admin.schema.ts` — Zod request validation schemas for enquiries filtering & mutation, estimates filtering & mutation, and pagination.
* `backend/src/modules/admin/admin.service.ts` — Comprehensive admin service providing:
  * **Enquiries Management:** Full-text search (name, phone, email, estimate #), status filtering, pagination, relational left joins with estimate calculations, and status/notes mutations.
  * **Estimates Management:** Multi-filter query engine (package slug, location, status, search), deep relational lookup fetching customer inputs, milestone schedules, `estimate_items` (brand upgrades), and `estimate_addons` (15 variants), plus status/PDF URL attachments.
  * **Analytics & Dashboard Engine:** SQL aggregations computing total estimates, total pipeline value (INR), average project ticket size, average built-up area, lead conversion rates, and multi-dimensional distributions (by package tier and geographical location).
* `backend/src/modules/admin/admin.controller.ts` — Standardized REST API controllers for all admin operations.
* `backend/src/routes/admin.routes.ts` — Protected Express router guarded by `requireAdminAuth` middleware.
* `backend/src/routes/index.ts` — Mounted `/admin` in the central API router.
* `backend/src/modules/admin/admin.test.ts` — Automated end-to-end integration test suite verifying authentication guards, lead management, estimate auditing, and analytics accuracy.

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/v1/admin/enquiries` | Returns paginated list of leads with search, status filtering, and joined estimate summary. | Admin Auth |
| `GET` | `/api/v1/admin/enquiries/:id` | Returns single lead detail with complete linked estimate record. | Admin Auth |
| `PATCH` | `/api/v1/admin/enquiries/:id` | Updates lead status (`NEW` → `CONTACTED` → `CLOSED_WON` / `CLOSED_LOST`) & appends admin notes. | Admin Auth |
| `GET` | `/api/v1/admin/estimates` | Returns paginated estimates list with search, package, location, and status filters. | Admin Auth |
| `GET` | `/api/v1/admin/estimates/:idOrNumber` | Returns full estimate detail with 10 milestone stages, snapshot, items, and add-ons. | Admin Auth |
| `PATCH` | `/api/v1/admin/estimates/:id` | Updates estimate workflow status (`DRAFT`, `GENERATED`, `SENT`) and attaches PDF link. | Admin Auth |
| `GET` | `/api/v1/admin/analytics/dashboard` | Computes live KPIs, pipeline valuation, conversion rate, and package/city distribution metrics. | Admin Auth |

### 3. Automated Admin Management Test Suite Results (`admin.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/admin/admin.test.ts`

```
👑 ASTHIWAR Admin Management & Analytics Test Suite — Phase 7
-----------------------------------------------------------------

[Test 1] Security Guard: Unauthorized Access Blocking (401)
  ✅ PASS: GET /admin/enquiries without auth returns 401
  ✅ PASS: Returns UNAUTHORIZED code
  ✅ PASS: GET /admin/estimates without auth returns 401
  ✅ PASS: GET /admin/analytics/dashboard without auth returns 401

[Test 2] Admin Login & Session Acquisition
  ✅ PASS: Admin login returns 200 OK
  ✅ PASS: Admin login success is true
  ✅ PASS: Bearer token successfully obtained
  ✅ PASS: Session cookie successfully captured

[Test 3] Seed Sample Estimate & Enquiry via Public API
  ✅ PASS: Public estimate created with 201 Created
  ✅ PASS: Created test estimate ID
  ✅ PASS: Public enquiry created with 201 Created
  ✅ PASS: Created test enquiry ID

[Test 4] Admin Enquiries: List, Filter & Pagination
  ✅ PASS: GET /admin/enquiries returns 200 OK
  ✅ PASS: Returns data array
  ✅ PASS: Total enquiries >= 1
  ✅ PASS: Current page is 1
  ✅ PASS: Search enquiries by name returns 200 OK
  ✅ PASS: Found matching enquiry
  ✅ PASS: Full name matches search query

[Test 5] Admin Enquiries: Detail Lookup & Workflow Mutation
  ✅ PASS: GET /admin/enquiries/:id returns 200 OK
  ✅ PASS: Fetched enquiry ID matches
  ✅ PASS: Includes linked estimate details
  ✅ PASS: Linked estimate number matches
  ✅ PASS: PATCH /admin/enquiries/:id returns 200 OK
  ✅ PASS: Enquiry status transitioned to CONTACTED
  ✅ PASS: Admin notes successfully updated

[Test 6] Admin Estimates: List, Filter & Deep Relation Lookup
  ✅ PASS: GET /admin/estimates returns 200 OK
  ✅ PASS: Returns estimates array
  ✅ PASS: Total estimates >= 1
  ✅ PASS: GET /admin/estimates/:id returns 200 OK
  ✅ PASS: Estimate number matches
  ✅ PASS: Returns addons array
  ✅ PASS: Includes saved addon items
  ✅ PASS: GET /admin/estimates/:estimateNumber returns 200 OK
  ✅ PASS: Estimate lookup by human number returns correct ID
  ✅ PASS: PATCH /admin/estimates/:id returns 200 OK
  ✅ PASS: Estimate status updated to GENERATED
  ✅ PASS: PDF URL attached

[Test 7] Admin Analytics Dashboard & Pipeline Valuation
  ✅ PASS: GET /admin/analytics/dashboard returns 200 OK
  ✅ PASS: Analytics response is successful
  ✅ PASS: KPI: totalEstimates >= 1
  ✅ PASS: KPI: totalPipelineValue > 0
  ✅ PASS: KPI: totalEnquiries >= 1
  ✅ PASS: Returns estimatesByPackage distribution
  ✅ PASS: Returns estimatesByLocation distribution
  ✅ PASS: Returns recentEstimates list
  ✅ PASS: Returns recentEnquiries list

-----------------------------------------------------------------
Results: All Phase 7 Admin Management & Analytics Tests Passed!
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 8: Admin Calculator Configuration & Pricing Engine (`/api/v1/admin/config/*`)

**Date:** 2026-08-18 23:52 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/admin/admin-config.schema.ts` — Zod request schemas enforcing strict validation on standard and volume rate inputs, location multipliers (0.5–2.0), add-on variant prices, and brand upgrade differentials.
* `backend/src/modules/admin/admin-config.service.ts` — Core configuration and price versioning engine enforcing:
  * **Rule 7 & 8 (Immutable Price History):** Modifying a package rate, add-on price, or brand upgrade delta automatically stamps the previous active record with `effectiveTo = new Date()` and inserts a fresh record with `effectiveFrom = new Date()`. Historical estimates retain their exact rates at time of creation.
  * **Locations Management:** Dynamic location multipliers CRUD with slug validation and sort ordering.
  * **Add-Ons Catalog:** Full 15 add-ons management with variant price history.
  * **Specifications & Inclusions Matrix:** Category-item-option tree with package inclusion flags and additional cost rates.
* `backend/src/modules/admin/admin-config.controller.ts` — Standardized REST API controllers for all configuration endpoints.
* `backend/src/routes/admin-config.routes.ts` — Modular router guarded by `requireAdminAuth`.
* `backend/src/routes/index.ts` — Mounted `/admin/config` in API v1 router.
* `backend/src/modules/admin/admin-config.test.ts` — Automated integration test suite validating authentication guards, rate updates, price history versioning, location creation/updates, and add-on mutations.

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/v1/admin/config/packages` | Lists all 4 packages with active prices, volume rates, and complete price audit history. | Admin Auth |
| `PUT` | `/api/v1/admin/config/packages/:id/price` | Updates standard/volume rates by closing old record (`effectiveTo`) and inserting new price version. | Admin Auth |
| `PATCH` | `/api/v1/admin/config/packages/:id` | Updates package metadata (name, tagline, description, colorTheme, sortOrder, isActive). | Admin Auth |
| `GET` | `/api/v1/admin/config/locations` | Lists all configured city locations with price multipliers. | Admin Auth |
| `POST` | `/api/v1/admin/config/locations` | Creates a new city location (e.g. Salem) with custom multiplier. | Admin Auth |
| `PATCH` | `/api/v1/admin/config/locations/:id` | Updates city name, multiplier, sort order, or active status. | Admin Auth |
| `GET` | `/api/v1/admin/config/addons` | Returns 15 add-ons catalog with active variant prices and audit trail. | Admin Auth |
| `PUT` | `/api/v1/admin/config/addons/:id/price` | Updates add-on variant price with versioned effective date. | Admin Auth |
| `PATCH` | `/api/v1/admin/config/addons/:id` | Updates add-on name, description, sort order, or active status. | Admin Auth |
| `GET` | `/api/v1/admin/config/specifications` | Returns full specifications tree (10 categories, items, brand options, price deltas). | Admin Auth |
| `PUT` | `/api/v1/admin/config/options/:id/price` | Updates brand upgrade delta rate with versioning. | Admin Auth |
| `PATCH` | `/api/v1/admin/config/package-items/:id` | Updates package-level inclusions and additional cost unit rates. | Admin Auth |

### 3. Automated Configuration Test Suite Results (`admin-config.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/admin/admin-config.test.ts`

```
⚙️ ASTHIWAR Admin Calculator Configuration & Pricing Test Suite — Phase 8
-----------------------------------------------------------------

[Test 1] Security Guard: Unauthorized Access Blocking (401)
  ✅ PASS: GET /admin/config/packages without auth returns 401
  ✅ PASS: Returns UNAUTHORIZED code

[Test 2] Admin Login & Session Acquisition
  ✅ PASS: Admin login returns 200 OK
  ✅ PASS: Session cookie captured

[Test 3] Packages Config & Versioned Pricing Mutation
  ✅ PASS: GET /admin/config/packages returns 200 OK
  ✅ PASS: Returns 4 packages
  ✅ PASS: Standard package exists
  ✅ PASS: PUT /admin/config/packages/:id/price returns 200 OK
  ✅ PASS: New standard price is ₹2,499.00
  ✅ PASS: New versioned price ID created (old price kept for history)
  ✅ PASS: PATCH /admin/config/packages/:id returns 200 OK
  ✅ PASS: Package tagline updated

[Test 4] Locations Config: List, Create & Multiplier Update
  ✅ PASS: GET /admin/config/locations returns 200 OK
  ✅ PASS: Returns 6+ locations
  ✅ PASS: POST /admin/config/locations returns 201 Created
  ✅ PASS: Multiplier is 0.9700
  ✅ PASS: PATCH /admin/config/locations/:id returns 200 OK
  ✅ PASS: Location multiplier updated to 0.9900

[Test 5] Add-Ons Config & Variant Pricing History
  ✅ PASS: GET /admin/config/addons returns 200 OK
  ✅ PASS: Returns 15 add-ons
  ✅ PASS: Underground Sump add-on found
  ✅ PASS: PUT /admin/config/addons/:id/price returns 200 OK
  ✅ PASS: Addon price updated to ₹28.00/L

[Test 6] Specifications & Package Inclusion Matrix
  ✅ PASS: GET /admin/config/specifications returns 200 OK
  ✅ PASS: Returns 10 specification categories

-----------------------------------------------------------------
Results: All Phase 8 Admin Configuration & Pricing Tests Passed!
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 9: Quotation PDF Generation & Document Streaming Engine

**Date:** 2026-08-18 23:55 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `backend/src/modules/pdf/pdf.service.ts` — High-performance PDF generation engine built with `pdfkit` (pure JS, 0 binary dependencies, universal portability). Renders multi-page branded quotation documents with:
  * **Branding & Header:** Asthiwar Design & Build identity, Tamil Nadu office references, and dynamic estimate reference badge (`EST-YYYY-XXXXXX`, creation date, 30-day validity).
  * **Client & Project Specifications Card:** Customer details, plot location with dynamic location multiplier, total built-up sq.ft, floor configuration, and plot area.
  * **Package Breakdown Table:** Base construction cost with rate per sq.ft and built-up area.
  * **Brand Customizations Table:** Itemized brand upgrade deltas and calculated line additions.
  * **Selected Add-Ons Table:** Variant specifications, quantities, unit prices, and line totals.
  * **Commercial Summary Box:** Base cost, upgrades, add-ons subtotal, and total estimated project value in Indian Rupee format (`Rs. XX,XX,XXX`).
  * **10-Stage Milestone Payment Schedule Table:** Multi-page table detailing all 10 construction milestones with exact percentage shares and balanced rupee amounts matching the total contract value.
  * **Terms, Inclusions & Standard Exclusions:** 5-point contractual terms, rate basis, and payment guarantee notes.
  * **Signatory Footers & Pagination:** Authorized signatory badge, client acceptance line, and dynamic `Page X of Y` footers.
* `backend/src/modules/pdf/pdf.controller.ts` — Controller supporting both inline browser viewing (`Content-Disposition: inline`) and forced download (`Content-Disposition: attachment; filename="ASTHIWAR-EST-..."`) via `?download=true`.
* `backend/src/routes/calculator.routes.ts` — Mounted public endpoint `GET /api/v1/calculator/estimate/:estimateNumber/pdf`.
* `backend/src/routes/admin.routes.ts` — Mounted admin protected endpoint `GET /api/v1/admin/estimates/:id/pdf`.
* `backend/src/modules/pdf/pdf.test.ts` — Automated integration test suite validating PDF creation, HTTP headers, `%PDF-` magic binary headers, and size benchmarks (>5KB).

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth Requirement |
|---|---|---|---|
| `GET` | `/api/v1/calculator/estimate/:estimateNumber/pdf` | Streams branded multi-page quotation PDF for customer viewing or download (`?download=true`). | Public |
| `GET` | `/api/v1/admin/estimates/:id/pdf` | Generates / downloads estimate quotation PDF for admin dispatch. | Admin Auth |

### 3. Automated PDF Generation Test Suite Results (`pdf.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/pdf/pdf.test.ts`

```
📄 ASTHIWAR Estimate PDF Generator Test Suite — Phase 9
-----------------------------------------------------------------

[Test 1] Create Test Estimate Snapshot with Customizations & Add-Ons
  ✅ PASS: Public estimate created with 201 Created
  ✅ PASS: Created estimate: EST-2026-768249

[Test 2] Public PDF Quotation Generation & Binary Validation
  ✅ PASS: GET estimate PDF returns 200 OK
  ✅ PASS: Content-Type is application/pdf
  ✅ PASS: Content-Disposition contains correct filename
  ✅ PASS: PDF size is valid (8 KB)
  ✅ PASS: Buffer starts with valid %PDF- magic header

[Test 3] Admin PDF Download via Protected Route
  ✅ PASS: Admin login returns 200 OK
  ✅ PASS: GET /admin/estimates/:id/pdf returns 200 OK
  ✅ PASS: Admin response is application/pdf
  ✅ PASS: Content-Disposition is attachment when ?download=true is passed

[Test 4] Non-existent Estimate PDF 404 Error Handling
  ✅ PASS: Non-existent estimate returns 404
  ✅ PASS: Returns ESTIMATE_NOT_FOUND code

-----------------------------------------------------------------
Results: All Phase 9 PDF Generation Tests Passed!
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 10: Notification Engine & Lead Alert Dispatcher

**Date:** 2026-08-18 23:58 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `database/src/schema/notifications.ts` — Created `notifications` table schema tracking multi-channel dispatches (`EMAIL`, `WHATSAPP`, `SMS`), delivery status (`PENDING`, `SENT`, `FAILED`), recipients, payloads, and execution timestamps.
* `database/drizzle/0001_worthless_earthquake.sql` — Applied Neon PostgreSQL schema migration for the `notifications` table.
* `backend/src/modules/notifications/notifications.types.ts` — TypeScript interfaces for channel options, templates (`ESTIMATE_QUOTATION`, `NEW_LEAD_ALERT`, `FOLLOW_UP`), and log results.
* `backend/src/modules/notifications/notifications.service.ts` — Core dispatch service:
  * **Customer Estimate Dispatch:** Formats HTML quotation emails and WhatsApp text templates with cost breakdowns, dimensions, milestone highlights, and direct PDF download links.
  * **Admin Lead Alerts:** Dispatches instant alerts to internal sales / engineering teams whenever a consultation lead is submitted.
  * **Audit Trail & Resend:** Queries delivery history with pagination and provides single-click re-dispatch.
* `backend/src/modules/notifications/notifications.controller.ts` — Express controllers for dispatch, auditing, and resending.
* `backend/src/routes/admin.routes.ts` — Mounted notification management endpoints.
* `backend/src/modules/notifications/notifications.test.ts` — Automated integration test suite validating customer quotation dispatches, admin alerts, log audits, and resend operations.

### 2. Endpoints Exposed & Tested

| Method | Route | Description | Auth Requirement |
|---|---|---|---|
| `POST` | `/api/v1/admin/estimates/:id/notify` | Dispatches customer quotation via selected channels (`EMAIL`, `WHATSAPP`). | Admin Auth |
| `POST` | `/api/v1/admin/enquiries/:id/notify` | Dispatches internal lead alert to sales team. | Admin Auth |
| `GET` | `/api/v1/admin/notifications` | Retrieves paginated notification audit logs with channel and status filtering. | Admin Auth |
| `POST` | `/api/v1/admin/notifications/:id/resend` | Retries / resends a specific notification record. | Admin Auth |

### 3. Automated Notification Test Suite Results (`notifications.test.ts`)

**Execution Command:** `npx tsx backend/src/modules/notifications/notifications.test.ts`

```
📬 ASTHIWAR Notification & Lead Alert Engine Test Suite — Phase 10
-----------------------------------------------------------------

[Test 1] Admin Authentication
  ✅ PASS: Admin login returns 200 OK
  ✅ PASS: Session cookie captured

[Test 2] Seed Estimate & Enquiry for Dispatch
  ✅ PASS: Public estimate created with 201 Created
  ✅ PASS: Public enquiry created with 201 Created

[Test 3] Dispatch Customer Estimate Quotation (Email + WhatsApp)
  ✅ PASS: POST /admin/estimates/:id/notify returns 200 OK
  ✅ PASS: Returns notifications array
  ✅ PASS: Generated 2 notifications (Email & WhatsApp)
  ✅ PASS: Email notification status is SENT
  ✅ PASS: WhatsApp notification status is SENT

[Test 4] Dispatch Admin Instant Lead Alert
  ✅ PASS: POST /admin/enquiries/:id/notify returns 200 OK
  ✅ PASS: Template is NEW_LEAD_ALERT
  ✅ PASS: Alert status is SENT

[Test 5] Notification Audit Logs & Pagination
  ✅ PASS: GET /admin/notifications returns 200 OK
  ✅ PASS: Returns log items array
  ✅ PASS: Total logged notifications >= 3

[Test 6] Resend Notification
  ✅ PASS: POST /admin/notifications/:id/resend returns 200 OK
  ✅ PASS: Resent notification ID matches
  ✅ PASS: Status confirmed SENT

-----------------------------------------------------------------
Results: All Phase 10 Notification Engine Tests Passed!
```

### 4. Build & Type Verification
* `npm run check-types`: **0 Errors** across all packages.
* `npm run build`: **0 Errors** compiling all TypeScript code to `dist/`.

---

# Phase 11: Frontend Scaffolding & Public 5-Step Interactive Cost Calculator

**Date:** 2026-08-19 00:05 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `package.json` — Added `frontend` workspace and monorepo scripts (`dev:frontend`, `build:frontend`).
* `frontend/package.json` — Configured React 18, Vite 6, TypeScript 5, Lucide Icons, and Canvas Confetti.
* `frontend/vite.config.ts` — Configured local proxying to backend (`/api` $\rightarrow$ `http://localhost:4000`).
* `frontend/src/index.css` — Built comprehensive Design System:
  * Brand tokens (Deep Slate, Gold/Amber gradients, Indigo highlights).
  * Typography (`Outfit` for headings, `Plus Jakarta Sans` for body).
  * Glassmorphic cards, elevation shadows, range sliders, custom scrollbars, and micro-animations.
* `frontend/src/types/index.ts` — Strongly typed models for locations, packages, custom specifications, add-on variants, calculation requests, and estimate results.
* `frontend/src/services/api.ts` — Typed client communicating directly with `/api/v1/calculator/*` and `/api/v1/enquiries`.
* `frontend/src/components/Header.tsx` & `Footer.tsx` — Navigation bar with hotline CTA, trust guarantee badges, office locations, and legal disclosures.
* `frontend/src/components/calculator/` — 5-Step Interactive Cost Calculator Wizard:
  * **Step 0 (`Step0LeadCapture.tsx`):** Lead input gate (Full Name, 10-digit Phone, Email, Tamil Nadu City dropdown).
  * **Step 1 (`Step1Dimensions.tsx`):** Plot area with unit switcher (`sqft`, `cents`, `sqyards`), built-up area per floor slider & preset chips (`1,000`–`3,000` sqft), and car parking count.
  * **Step 2 (`Step2Floors.tsx`):** Ground, G+1, G+2, G+3 elevation cards with building height preview, estimated timeline badges, and volume discount threshold indicator.
  * **Step 3 (`Step3Packages.tsx`):** Basic, Standard, Premium, Luxury package cards showing dynamic rates per sq.ft and comprehensive material specifications.
  * **Step 4 (`Step4Customizations.tsx`):** Item-by-item brand upgrade selector (+₹/sqft deltas) and 15 Add-Ons Catalog with quantity sliders.
  * **Step 5 (`Step5EstimateReport.tsx`):** Authoritative estimate breakdown, 10-Stage Milestone Phase schedule with progress bars, Interactive EMI Calculator slider, direct Quotation PDF download, WhatsApp sharing, and Free Site Assessment booking modal.
  * **Wizard Container (`CalculatorWizard.tsx`):** Multi-step stepper with animated progress bar and data fetching.
* `frontend/src/App.tsx` & `main.tsx` — Root application container.

### 2. Build & Type Verification
* `npm run check-types`: **0 Errors** across all 3 workspaces (`@asthiwar/database`, `@asthiwar/backend`, `@asthiwar/frontend`).
* `npm run build:frontend`: **0 Errors** — Vite compiled production bundle in **2.55s** (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`).
* `npm run build`: **0 Errors** compiling entire monorepo.

---

# Phase 12: Admin Management & Pricing Control Center UI (`/admin`)

**Date:** 2026-08-19 00:10 IST  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary

**Files Created / Modified:**
* `frontend/src/services/adminApi.ts` — Strongly-typed Admin API client connecting to:
  * Admin Authentication (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`)
  * Executive Dashboard Analytics (`GET /analytics/dashboard`)
  * Leads & Enquiries CRM (`GET /enquiries`, `PATCH /enquiries/:id`, `POST /enquiries/:id/notify`)
  * Estimates Explorer (`GET /estimates`, `GET /estimates/:id`, `POST /estimates/:id/notify`)
  * Pricing & Matrix Config (`GET/PUT /config/packages`, `GET/PUT /config/addons`, `GET/PUT /config/locations`)
* `frontend/src/components/admin/AdminLogin.tsx` — Secure Admin Login screen with session verification, password masking, error alerts, and credentials assistance.
* `frontend/src/components/admin/AdminDashboardOverview.tsx` — Executive KPI Dashboard:
  * Key Metrics (Pipeline Value in Crores/Lakhs, Total Estimates, Total Leads, Lead Conversion Rate).
  * Recent Consultation Leads table with real-time status badges.
  * Package Popularity Share breakdown bars.
* `frontend/src/components/admin/AdminEnquiriesManager.tsx` — Leads & Enquiries CRM:
  * Search by client name, phone number, and estimate reference.
  * Filter by lead status (`ALL`, `NEW`, `CONTACTED`, `IN_PROGRESS`, `CLOSED`, `ARCHIVED`).
  * Live status changer dropdown with immediate database sync.
  * 1-Click "Alert Sales" internal notification trigger.
  * Lead Details modal with linked estimate PDF download.
* `frontend/src/components/admin/AdminEstimatesExplorer.tsx` — Estimates Explorer:
  * Search and filter estimates by package tier.
  * Detailed snapshot inspection modal displaying exact itemized specifications, brand upgrades, and chosen add-ons.
  * 1-Click official Quotation PDF download.
  * 1-Click customer quotation dispatch (WhatsApp & Email).
* `frontend/src/components/admin/AdminPricingConfigManager.tsx` — Dynamic Pricing & Matrix Control Center:
  * **Package Rates Editor:** Update standard and volume ₹/sq.ft rates with mandatory audit change reasons (Rule 7 & 8 immutable versioning).
  * **15 Add-Ons Editor:** Update variant prices for sumps, solar, lifts, and compound walls.
  * **City Factors Editor:** Update location multipliers (Coimbatore, Chennai, Tiruppur, Erode, Pollachi).
* `frontend/src/components/admin/AdminPortal.tsx` — Master Admin container managing session verification, tab navigation, and logout.
* `frontend/src/App.tsx` — Integrated Admin Portal toggle in main navigation.

### 2. Build & Type Verification
* `npm run check-types`: **0 Errors** across all 3 workspaces (`@asthiwar/database`, `@asthiwar/backend`, `@asthiwar/frontend`).
* `npm run build:frontend`: **0 Errors** — Vite compiled production bundle in **2.35s** (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-BPfYz1MX.js`).
* `npm run build`: **0 Errors** compiling entire monorepo (`database`, `backend`, `frontend`).

---

# Phase 13: 10-Stage Milestone Payment Schedule & Admin Editor

**Date:** 2026-08-25  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary
* **Database Layer:** Created `milestone_stages` table storing the 10 sequential construction phases, percentage allocations, and deliverables scope.
* **Backend API Layer:**
  * Added `GET /api/v1/admin/config/milestones` to retrieve active stage configurations.
  * Added `PUT /api/v1/admin/config/milestones` with 100.00% total validation guard.
* **Admin Portal UI (`AdminPricingConfigManager.tsx`):**
  * Added **Milestones (10)** tab with visual multi-color progress bar and interactive table editor.
  * Live dynamic recalculation of project stage amounts (e.g. ₹50L project share).
* **Public Calculator Integration:** Embedded dynamic 10-stage payment schedule into Step 5 Estimate Report and backend calculation snapshot.

---

# Phase 14: Brand Customisation Per-Package Pricing, 11 Exclusions & PDF Contract

**Date:** 2026-09-03  
**Status:** ✅ Completed & Verified

### 1. Implementation Summary
* **Brand Customisations Full CRUD & Package Pricing:**
  * Overhauled `option_prices` schema to bind upgrade deltas strictly to package tiers (`Basic`, `Standard`, `Premium`, `Luxury`).
  * Upgraded Admin Portal with interactive **✓ Free** vs **Upgrade Extra** rate toggles.
  * Added `POST /api/v1/admin/config/options`, `PUT /api/v1/admin/config/options/:id/price`, and `DELETE /api/v1/admin/config/options/:id`.
* **11 Standard Exclusions & Client Scope:**
  * Integrated formal 11-point statutory, interior, and elevation exclusion cards in Step 5 Estimate Report.
  * Embedded clean 2-column legal exclusion scope into the downloadable PDF contract in `pdf.service.ts`.
* **PDF Vector Engine Layout Optimization:**
  * Fixed footer bottom margins (`doc.page.margins.bottom = 0`) preventing ghost pages.
  * Optimized table typography and spacing to guarantee strict 3-page quotation contract output.
* **Dynamic Add-On Rules & Microcopy:**
  * Automated complimentary roof weathering for Premium/Luxury and terrace > 2,000 sq.ft.
  * Added contextual parking area helper note in Step 1 Dimensions.

### 2. Verification Evidence
* `npx tsc --noEmit`: **0 Errors** across all packages (`database`, `backend`, `frontend`).
* Verified end-to-end estimation flow and admin dashboard configuration.

