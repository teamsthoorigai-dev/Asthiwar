# ASTHIWAR — Complete Code Audit Report

> **Project:** ASTHIWAR Design & Build — Residential Construction Estimation Platform  
> **Audit Date:** 2026  
> **Auditor:** AI Code Analysis (Exhaustive — All Files Read)  
> **Scope:** Full-stack — Backend (Node/Express/TypeScript), Frontend (React/TypeScript), Database (PostgreSQL/Drizzle)  
> **Total Issues Found:** 32  
> **Status:** BUG-01..06, BUG-08..10, BUG-12..13, BUG-15..31 — ✅ FIXED  |  BUG-11 — ⏭️ DEFERRED (Out of Scope)  |  BUG-07, BUG-14, BUG-32 — ⚠️ Open / Skipped

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Severity Legend](#2-severity-legend)
3. [Issue Index Table](#3-issue-index-table)
4. [🔴 Critical Issues (7)](#4--critical-issues)
   - [BUG-01 — Estimate Report Never Renders](#bug-01--estimate-report-step-5-never-renders)
   - [BUG-02 — Package Price Query Missing Active Filter](#bug-02--package-price-query-missing-isnulleffectiveto-filter)
   - [BUG-03 — Volume Rate Always Multiplier 2](#bug-03--volume-rate-detection-uses-wrong-type-lookup)
   - [BUG-04 — Option Price Update Drops packageId and priceType](#bug-04--updateadminoptionprice-drops-packageid-and-pricetype)
   - [BUG-05 — Package Price Update Drops headRoomPricePerSqft](#bug-05--updateadminpackageprice-drops-headroompricepersqft)
   - [BUG-06 — Estimate Number Collision at ~1,100 Estimates](#bug-06--estimate-number-collision-at-1100-estimates)
   - [BUG-07 — CORS Whitelist Is Dead Code](#bug-07--cors-whitelist-is-dead-code--all-origins-allowed)
5. [🟠 High Issues (10)](#5--high-issues)
   - [BUG-08 — All Step Badge Labels Wrong](#bug-08--all-step-badge-labels-are-completely-wrong)
   - [BUG-09 — sortBy Parameter Ignored in Admin Queries](#bug-09--sortby-query-parameter-completely-ignored)
   - [BUG-10 — Audit Trail Always Anonymous](#bug-10--audit-trail-always-logs-anonymous-actor)
   - [BUG-11 — No Actual Notification Dispatch](#bug-11--no-actual-emailwhatsapp-dispatch)
   - [BUG-12 — Infinite Re-Render Risk in Customizations](#bug-12--auto-default-effect-infinite-re-render-risk)
   - [BUG-13 — Two Admin API URLs Return 404](#bug-13--two-admin-api-urls-do-not-match-backend-routes)
   - [BUG-14 — Real Credentials Hardcoded in Frontend](#bug-14--real-admin-credentials-hardcoded-in-frontend-source)
   - [BUG-15 — adminGetMe Response Shape Mismatch](#bug-15--admingetme-response-shape-mismatch)
   - [BUG-16 — Dashboard KPIs Always Show Zero](#bug-16--dashboard-kpi-key-mismatch--all-values-show-zero)
   - [BUG-17 — PDF Page 1 Can Overflow](#bug-17--pdf-page-1-content-can-overflow-with-no-page-break)
6. [🟡 Medium Issues (15)](#6--medium-issues)
   - [BUG-18 — Car Parking Not in Built-Up Area Cost](#bug-18--car-parking-area-excluded-from-base-construction-cost)
   - [BUG-19 — Universal Option Prices Not Fetched in Config](#bug-19--getpackageconfig-misses-universal-option-prices)
   - [BUG-20 — locationId Never Set in Lead Capture](#bug-20--locationid-never-set-in-form-data)
   - [BUG-21 — Volume Threshold Hardcoded in Frontend](#bug-21--volume-discount-threshold-hardcoded-in-frontend)
   - [BUG-22 — Stack Traces Stored in Database](#bug-22--full-stack-traces-stored-in-database)
   - [BUG-23 — Audit Log Pagination Missing total Field](#bug-23--audit-log-pagination-missing-total-field)
   - [BUG-24 — Progress Bar Hits 100% Early](#bug-24--progress-bar-formula-wrong)
   - [BUG-25 — Hardcoded Default Session Secret](#bug-25--hardcoded-default-session-secret)
   - [BUG-26 — Enquiry Status Filters Don't Match Backend Enum](#bug-26--enquiry-status-filter-values-dont-match-backend-enum)
   - [BUG-27 — onLogout Prop Never Used](#bug-27--onlogout-prop-accepted-but-never-wired)
   - [BUG-28 — floorMultiplier Column Stores Floor Count](#bug-28--floormultiplier-column-stores-floor-count-not-a-multiplier)
   - [BUG-29 — isNaN Guards Never Trigger](#bug-29--isnan-disabled-guards-never-trigger)
   - [BUG-30 — N+3 DB Queries Per Customization](#bug-30--n3-database-queries-per-customization-item)
   - [BUG-31 — Missing credentials in Fetch Calls](#bug-31--missing-credentials-include-in-admin-fetch-calls)
   - [BUG-32 — Dual Deployment Config Files](#bug-32--dual-deployment-configuration-files)
7. [Fix Priority Roadmap](#7-fix-priority-roadmap)
8. [Files Audited](#8-files-audited)

---

## 1. Executive Summary

A full, line-by-line audit of every file in the ASTHIWAR monorepo identified **32 issues** across critical logic failures, high-severity functional defects, and medium-severity design and security concerns.

| Severity | Count | Description |
|---|---|---|
| 🔴 Critical | 7 | Broken core business logic — wizard never completes, pricing corrupts on update, CORS disabled |
| 🟠 High | 10 | Significant functional defects — all KPIs show 0, admin URLs return 404, credentials in source |
| 🟡 Medium | 15 | Design, security, UX and performance issues |
| **Total** | **32** | |

**Most severe finding:** The public-facing cost estimator wizard is completely broken end-to-end — the estimate report screen (Step 5) never renders because of a step index mismatch (`setCurrentStep(5)` but renders at `currentStep === 4`). Every customer who completes the 4-step wizard sees a blank white page.

**Second most severe:** Every admin pricing configuration update silently corrupts the pricing database — `updateAdminOptionPrice()` drops `packageId` and `priceType` from the new price version, making package-specific pricing apply universally.

---

## 2. Severity Legend

| Icon | Level | Criteria |
|---|---|---|
| 🔴 | **Critical** | Core business logic broken, data corruption, or complete feature failure |
| 🟠 | **High** | Significant functional defect — feature partially or completely non-functional |
| 🟡 | **Medium** | Security weakness, UX confusion, data quality issue, or performance problem |

---

## 3. Issue Index Table

| ID | Severity | File(s) | Category | Title |
|---|---|---|---|---|
| BUG-01 | 🔴 Critical | `CalculatorWizard.tsx` | Logic | Estimate report never renders — step index mismatch |
| BUG-02 | 🔴 Critical | `calculator.service.ts` | Logic | Package price query missing `isNull(effectiveTo)` |
| BUG-03 | 🔴 Critical | `Step3Packages.tsx` | Logic | Volume rate type lookup — always returns multiplier 2 |
| BUG-04 | 🔴 Critical | `admin-config.service.ts` | Data Corruption | Option price update drops `packageId` + `priceType` |
| BUG-05 | 🔴 Critical | `admin-config.service.ts` | Data Corruption | Package price update drops `headRoomPricePerSqft` |
| BUG-06 | 🔴 Critical | `calculator.service.ts` | Reliability | Estimate number collision crashes DB at ~1,100 estimates |
| BUG-07 | 🔴 Critical | `app.ts` | Security | CORS whitelist completely bypassed — all origins allowed |
| BUG-08 | 🟠 High | All step components | UX | All wizard step badge labels are wrong |
| BUG-09 | 🟠 High | `admin.service.ts` | Logic | `sortBy` query parameter silently ignored |
| BUG-10 | 🟠 High | `errorHandler.ts`, `admin-config.controller.ts` | Audit | Audit trail always records anonymous actor |
| BUG-11 | ⏭️ Deferred | `notifications.service.ts` | Integration | No actual email or WhatsApp dispatch (Out of Scope for Current Phase) |
| BUG-12 | 🟠 High | `Step4Customizations.tsx` | React | Auto-default effect has infinite re-render risk |
| BUG-13 | 🟠 High | `adminApi.ts` | API | Two admin API URLs don't match backend routes (404) |
| BUG-14 | 🟠 High | `AdminLogin.tsx` | Security | Real admin credentials hardcoded in frontend source |
| BUG-15 | 🟠 High | `adminApi.ts`, `auth.controller.ts` | API | `adminGetMe` response shape mismatch |
| BUG-16 | 🟠 High | `AdminDashboardOverview.tsx`, `admin.service.ts` | API | Dashboard KPI key mismatch — all values show zero |
| BUG-17 | 🟠 High | `pdf.service.ts` | Rendering | PDF page 1 overflow — no dynamic page breaks |
| BUG-18 | 🟡 Medium | `calculator.service.ts`, `Step3Packages.tsx` | Logic | Car parking area excluded from base construction cost |
| BUG-19 | 🟡 Medium | `calculator.controller.ts` | Logic | `getPackageConfig` misses universal option prices |
| BUG-20 | 🟡 Medium | `Step0LeadCapture.tsx` | Logic | `locationId` never set — fuzzy text match may fail |
| BUG-21 | 🟡 Medium | `Step3Packages.tsx` | Logic | Volume threshold hardcoded as 3,500 in frontend |
| BUG-22 | 🟡 Medium | `audit.service.ts`, `errorHandler.ts` | Security | Full stack traces stored in database |
| BUG-23 | 🟡 Medium | `admin.controller.ts` | API | Audit log pagination missing `total` / `totalPages` |
| BUG-24 | 🟡 Medium | `CalculatorWizard.tsx` | UX | Progress bar reaches 100% before user submits |
| BUG-25 | 🟡 Medium | `env.ts` | Security | Insecure hardcoded default session secret |
| BUG-26 | 🟡 Medium | `AdminEnquiriesManager.tsx` | API | Status filter values don't match backend enum |
| BUG-27 | 🟡 Medium | `AdminPortal.tsx` | UX | `onLogout` prop accepted but never wired to UI |
| BUG-28 | 🟡 Medium | `calculator.service.ts` | Data Quality | `floorMultiplier` column stores floor count, not a multiplier |
| BUG-29 | 🟡 Medium | `Step1Dimensions.tsx` | Logic | `isNaN()` disabled guards never trigger |
| BUG-30 | 🟡 Medium | `calculator.service.ts` | Performance | N+3 DB queries per customization item |
| BUG-31 | 🟡 Medium | `adminApi.ts` | Auth | Missing `credentials: 'include'` in fetch calls |
| BUG-32 | 🟡 Medium | `vercel.json`, `_redirects` | DevOps | Dual conflicting deployment configuration files |

---

## 4. 🔴 Critical Issues

---

### BUG-01 — Estimate Report (Step 5) Never Renders

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `frontend/src/components/calculator/CalculatorWizard.tsx` |
| **Lines** | `handleFinalCalculate()` → `setCurrentStep(5)` / render block → `currentStep === 4` |
| **Impact** | The entire estimation wizard is broken. Every user who completes 4 steps sees a blank white page. The estimate report is never displayed. |

**Root Cause:**

After the API call succeeds, `handleFinalCalculate()` sets the step counter to `5`. But the JSX render block only checks for `currentStep === 4`. These two values never match simultaneously, so `<Step5EstimateReport>` never mounts.

```tsx
// ❌ BROKEN — in handleFinalCalculate():
const result = await createAuthoritativeEstimate(formData);
setEstimateResult(result);
setCurrentStep(5);          // ← sets step to 5

// ❌ BROKEN — in JSX render:
{currentStep === 4 && estimateResult && (
  <Step5EstimateReport result={estimateResult} onReset={handleReset} />
  // ↑ This condition is NEVER true when step is 5
)}
```

**Fix (Option A — change the setter):**
```tsx
// ✅ Change setCurrentStep(5) → setCurrentStep(4)
setCurrentStep(4);
```

**Fix (Option B — change the condition):**
```tsx
// ✅ Change render condition to match what the setter uses
{currentStep === 5 && estimateResult && (
  <Step5EstimateReport result={estimateResult} onReset={handleReset} />
)}
```

Also update the stepper hide condition from `currentStep < 4` to `currentStep < 5` if using Option B.

---

### BUG-02 — Package Price Query Missing `isNull(effectiveTo)` Filter

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `backend/src/modules/calculator/calculator.service.ts` |
| **Lines** | `calculateEstimate()` → Package fetch query (~line 115) |
| **Impact** | After any admin price update, the calculation engine may pick up an old (expired) price row non-deterministically. Customer estimates use wrong pricing. |

**Root Cause:**

The package query joins `packagePrices` but has no filter on `effectiveTo IS NULL`. The `LIMIT 1` picks whichever row the DB returns first — which can be either the old or new price, depending on internal storage order. In contrast, the `getPackages()` controller endpoint correctly includes `isNull(packagePrices.effectiveTo)`.

```ts
// ❌ BROKEN — calculator.service.ts:
const pkgRows = await db
  .select({ ... })
  .from(packages)
  .innerJoin(packagePrices, eq(packagePrices.packageId, packages.id))
  .where(and(
    eq(packages.slug, input.packageSlug),
    eq(packages.isActive, true)
    // ← isNull(packagePrices.effectiveTo) is MISSING
  ))
  .limit(1);

// ✅ FIX — add the active price filter:
.where(and(
  eq(packages.slug, input.packageSlug),
  eq(packages.isActive, true),
  isNull(packagePrices.effectiveTo)    // ← add this
))
```

---

### BUG-03 — Volume Rate Detection Uses Wrong Type Lookup

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `frontend/src/components/calculator/Step3Packages.tsx` |
| **Impact** | Volume discount badge on package cards is always computed with `multiplier = 2`, regardless of actual floor count. UI shows wrong pricing information on every package card. |

**Root Cause:**

`formData.floorCount` is always a **number** (0, 1, 2, 3). The `floorMultipliers` object has string keys (`"Ground"`, `"G+1"`, etc.). Looking up a number key in a string-keyed Record returns `undefined`, so the `|| 2` fallback always fires.

```tsx
// ❌ BROKEN:
const floorMultipliers: Record<string, number> = {
  Ground: 1, 'G+1': 2, 'G+2': 3, 'G+3': 4
};
const multiplier = floorMultipliers[formData.floorCount] || 2;
//                                  ^^^^^^^^^^^^^^^^^^^
//                 floorCount is NUMBER 0/1/2/3, not a string key
//                 → floorMultipliers[0] === undefined → fallback 2 always

// ✅ FIX — derive multiplier directly from the number:
const multiplier = (formData.floorCount || 0) + 1;
// floorCount=0 → multiplier=1 (Ground only)
// floorCount=1 → multiplier=2 (G+1 = 2 floors)
// floorCount=3 → multiplier=4 (G+3 = 4 floors)
```

---

### BUG-04 — `updateAdminOptionPrice()` Drops `packageId` and `priceType`

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `backend/src/modules/admin/admin-config.service.ts` |
| **Lines** | `updateAdminOptionPrice()` function |
| **Impact** | Any admin price update on a package-specific option (e.g., red brick pricing for `basic` package only) creates a new version that applies universally to ALL packages. Pricing tier separation is permanently destroyed for that option. |

**Root Cause:**

The `INSERT` for the new price version is missing `packageId` (defaults to `NULL` = universal) and `priceType` (defaults to schema default `'per_sqft'`, cannot preserve `'fixed'` type options).

```ts
// ❌ BROKEN — admin-config.service.ts, updateAdminOptionPrice():
const [newPrice] = await db
  .insert(schema.optionPrices)
  .values({
    optionId,
    priceDelta: dto.priceDelta.toFixed(2),
    effectiveFrom: now,
    effectiveTo: null,
    // ← packageId: MISSING → NULL → universal (breaks package-specific scoping)
    // ← priceType: MISSING → schema default 'per_sqft' (breaks 'fixed' type options)
  })
  .returning();

// ✅ FIX — fetch old price row first, carry forward packageId and priceType:
const existingPrice = await db.query.optionPrices.findFirst({
  where: and(
    eq(schema.optionPrices.optionId, optionId),
    isNull(schema.optionPrices.effectiveTo)
  ),
});

const [newPrice] = await db
  .insert(schema.optionPrices)
  .values({
    optionId,
    packageId: existingPrice?.packageId ?? null,          // ← carry forward
    priceType: existingPrice?.priceType ?? 'per_sqft',    // ← carry forward
    priceDelta: dto.priceDelta.toFixed(2),
    effectiveFrom: now,
    effectiveTo: null,
  })
  .returning();
```

---

### BUG-05 — `updateAdminPackagePrice()` Drops `headRoomPricePerSqft`

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `backend/src/modules/admin/admin-config.service.ts` |
| **Lines** | `updateAdminPackagePrice()` function |
| **Impact** | Every admin package price update silently resets `headRoomPricePerSqft` to `'0.00'`. All future estimates for customers who add headroom area get it priced at ₹0. |

**Root Cause:**

`headRoomPricePerSqft` is not in the `updatePackagePriceSchema` Zod validation, not in the DTO type, and not in the `INSERT` values. The database schema default `'0.00'` is applied on every new version row.

```ts
// ❌ BROKEN — admin-config.service.ts, updateAdminPackagePrice():
const [newPrice] = await db
  .insert(schema.packagePrices)
  .values({
    packageId,
    pricePerSqft: dto.pricePerSqft.toFixed(2),
    volumePricePerSqft: dto.volumePricePerSqft.toFixed(2),
    volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
    effectiveFrom: now,
    effectiveTo: null,
    // ← headRoomPricePerSqft MISSING → resets to '0.00' on every update
  })
  .returning();

// ✅ FIX — Step 1: Add to Zod schema (admin-config.schema.ts):
headRoomPricePerSqft: z.number().min(0).optional(),

// ✅ FIX — Step 2: Carry forward existing value if not in DTO:
const existingPrice = await db.query.packagePrices.findFirst({
  where: and(
    eq(schema.packagePrices.packageId, packageId),
    isNull(schema.packagePrices.effectiveTo)
  ),
});

const [newPrice] = await db
  .insert(schema.packagePrices)
  .values({
    packageId,
    pricePerSqft: dto.pricePerSqft.toFixed(2),
    volumePricePerSqft: dto.volumePricePerSqft.toFixed(2),
    volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
    headRoomPricePerSqft: dto.headRoomPricePerSqft?.toFixed(2)
      ?? existingPrice?.headRoomPricePerSqft
      ?? '0.00',               // ← carry forward or accept from DTO
    effectiveFrom: now,
    effectiveTo: null,
  })
  .returning();
```

---

### BUG-06 — Estimate Number Collision Crashes DB at ~1,100 Estimates

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `backend/src/modules/calculator/calculator.service.ts` |
| **Lines** | `generateEstimateNumber()` |
| **Impact** | After ~1,100 estimates per year, ~50% of new estimate creation requests fail with a PostgreSQL UNIQUE constraint violation (unhandled → 500 response to user). |

**Root Cause:**

The function generates a random 6-digit number from a pool of 900,000. By the birthday paradox, the probability of collision hits 50% at approximately √(2 × 900,000 × ln 2) ≈ 1,116 estimates. The `estimates.estimateNumber` column has a `UNIQUE` constraint. There is no retry logic.

```ts
// ❌ BROKEN:
export function generateEstimateNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `EST-${year}-${randomNum}`;
  // No collision handling — DB UNIQUE constraint throws on duplicate
}

// ✅ FIX — Option A: Use crypto for much larger range (4 billion):
import { randomBytes } from 'crypto';
export function generateEstimateNumber(): string {
  const year = new Date().getFullYear();
  const hex = randomBytes(4).toString('hex').toUpperCase(); // 4,294,967,296 values
  return `EST-${year}-${hex}`;
}

// ✅ FIX — Option B: Add retry loop in calculateEstimate():
let estimateNumber = generateEstimateNumber();
let retries = 0;
while (retries < 5) {
  const existing = await db.query.estimates.findFirst({
    where: eq(estimates.estimateNumber, estimateNumber)
  });
  if (!existing) break;
  estimateNumber = generateEstimateNumber();
  retries++;
}
```

---

### BUG-07 — CORS Whitelist Is Dead Code — All Origins Allowed

| Field | Value |
|---|---|
| **Severity** | 🔴 Critical |
| **File** | `backend/src/app.ts` |
| **Lines** | CORS `origin` callback (~line 18) |
| **Impact** | Any website on the internet can make credentialed cross-origin requests to the API in production. Combined with HttpOnly session cookies, this enables CSRF attacks from malicious third-party sites. |

**Root Cause:**

The CORS origin callback has three `return` branches. The first two correctly handle the whitelist. But there is a third `return callback(null, true)` fallback that **always executes** for any origin not in the whitelist — making the whitelist effectively dead code.

```ts
// ❌ BROKEN — app.ts:
origin: (origin, callback) => {
  if (!origin) return callback(null, true);                         // ← allow no-origin
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return callback(null, true);                                    // ← allow whitelist
  }
  return callback(null, true); // Allow dev flexibility             // ← allows EVERYTHING
  //     ↑ This line makes the entire whitelist pointless
},

// ✅ FIX — reject unknown origins in production:
origin: (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return callback(null, true);
  }
  // ← remove the fallback allow, or:
  if (env.NODE_ENV === 'development') return callback(null, true);
  return callback(new Error(`CORS: origin ${origin} not allowed`));
},
```

---

## 5. 🟠 High Issues

---

### BUG-08 — All Wizard Step Badge Labels Are Completely Wrong

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `CalculatorWizard.tsx` and all step components |
| **Impact** | Users see incoherent step numbers (e.g., "Step 4 of 5" immediately followed by "Step 5 of 5"). Completely breaks user trust in the wizard flow. |

**Root Cause:**

Components are named Step0, Step1, Step3, Step4, Step5 but rendered in a completely different order by the wizard. The badge text inside each component reflects the component name, not the actual wizard position.

| `currentStep` value | Component Mounted | Badge Inside Component |
|---|---|---|
| 0 | `Step1Dimensions` | "Step 2 of 4" |
| 1 | `Step3Packages` | "Step 4 of 5" |
| 2 | `Step4Customizations` | "Step 5 of 5" |
| 3 | `Step0LeadCapture` | "Step 4 of 4" |

**Fix:** Update each step component's badge text to reflect its actual wizard position (1 of 4, 2 of 4, 3 of 4, 4 of 4).

---

### BUG-09 — `sortBy` Query Parameter Completely Ignored

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `backend/src/modules/admin/admin.service.ts` |
| **Lines** | `getAdminEnquiries()` and `getAdminEstimates()` |
| **Impact** | Admin users who try to sort enquiries or estimates by any field other than `createdAt` silently receive `createdAt`-sorted results. |

**Root Cause:**

The Zod schema accepts and validates a `sortBy` field, but the service hardcodes `schema.enquiries.createdAt` in the `orderByClause` regardless of what `sortBy` contains.

```ts
// ❌ BROKEN — admin.service.ts (same pattern in both functions):
const orderByClause = query.sortOrder === 'asc'
  ? asc(schema.enquiries.createdAt)    // always createdAt
  : desc(schema.enquiries.createdAt);  // always createdAt
// query.sortBy is never read

// ✅ FIX:
const sortableColumns: Record<string, any> = {
  createdAt: schema.enquiries.createdAt,
  fullName: schema.enquiries.fullName,
  status: schema.enquiries.status,
  plotLocation: schema.enquiries.plotLocation,
};
const sortColumn = sortableColumns[query.sortBy || 'createdAt'] || schema.enquiries.createdAt;
const orderByClause = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
```

---

### BUG-10 — Audit Trail Always Logs Anonymous Actor

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `backend/src/middleware/errorHandler.ts`, `backend/src/modules/admin/admin-config.controller.ts` |
| **Impact** | All admin audit log entries — including every pricing change and configuration update — record `actorType: 'ANONYMOUS_USER'` and `actorId: null`. It is impossible to trace which admin made any change. |

**Root Cause:**

The auth middleware (`auth.ts`) attaches the authenticated user to `req.user`. But `errorHandler.ts` and `admin-config.controller.ts` read from `req.adminUser`, which is never set anywhere. So the actor reference is always `undefined`.

```ts
// ✅ Auth middleware sets:
req.user = user;          // auth.ts line ~45

// ❌ errorHandler.ts reads:
actorType: (req as any).adminUser ? 'ADMIN' : 'ANONYMOUS_USER',
actorId: (req as any).adminUser?.id || null,
//                    ^^^^^^^^^^  → always undefined → always 'ANONYMOUS_USER'

// ❌ admin-config.controller.ts reads:
actorId: (req as any).adminUser?.email || (req as any).adminUser?.id,
//                    ^^^^^^^^^^  → always undefined → actorId always null

// ✅ FIX — change all references from adminUser to user:
actorType: (req as any).user ? 'ADMIN' : 'ANONYMOUS_USER',
actorId: (req as any).user?.id || (req as any).user?.email || null,
```

---

### BUG-11 — No Actual Email or WhatsApp Dispatch (⏭️ Deferred / Out of Scope)

| Field | Value |
|---|---|
| **Severity** | ⏭️ Deferred / Out of Scope |
| **File** | `backend/src/modules/notifications/notifications.service.ts` |
| **Status Note** | Deferred for future phase when live production messaging credentials (SMTP / WhatsApp Business API / Twilio) are provisioned. The database notification queue functions as designed for development/staging. |

**Root Cause:**

Both `sendEstimateQuotationNotification()` and `sendAdminNewLeadAlert()` only insert a record into the `notifications` table with `status: 'SENT'` immediately. There is no SMTP client, no Twilio/WhatsApp Business API call, no HTTP request to any messaging provider. `resendNotification()` just flips the `status` field in the DB.

```ts
// ❌ BROKEN — entire "send" is just a DB insert:
const [emailRecord] = await db
  .insert(schema.notifications)
  .values({
    status: 'SENT',       // ← marked SENT before anything was actually sent
    sentAt: new Date(),
    // no actual SMTP or API call anywhere
  })
  .returning();

// ✅ FIX — integrate a real provider, e.g. Nodemailer for email:
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({ ... });
await transporter.sendMail({ to: estimate.customerEmail, subject, html });
// Then insert DB record with actual status

// ✅ FIX — integrate Twilio for WhatsApp:
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
await client.messages.create({ from: 'whatsapp:+...', to: `whatsapp:${phone}`, body: message });
```

---

### BUG-12 — Auto-Default Effect Has Infinite Re-Render Risk

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `frontend/src/components/calculator/Step4Customizations.tsx` |
| **Impact** | In React StrictMode (which is enabled in `main.tsx`), the component double-mounts, causing defaults to be applied twice. In edge cases, this creates an infinite state update loop. |

**Root Cause:**

`onChange` (which is `handleUpdateForm` in the parent) is a new function reference on every parent render. It is listed in the `useEffect` dependency array. When the effect calls `onChange(...)`, the parent re-renders, creating a new `onChange` reference, which triggers the effect again.

```tsx
// ❌ BROKEN — Step4Customizations.tsx:
useEffect(() => {
  if (config && formData.customizations.length === 0) {
    const defaults = buildDefaults(config);
    onChange({ customizations: defaults });  // triggers parent render
  }
}, [config, formData.customizations.length, onChange]);
//                                           ^^^^^^^^
//  onChange is a new ref every render → effect re-runs → infinite loop risk

// ✅ FIX — wrap onChange in useCallback in parent (CalculatorWizard.tsx):
const handleUpdateForm = useCallback((fields: Partial<EstimateFormState>) => {
  setFormData((prev) => ({ ...prev, ...fields }));
}, []); // stable reference

// ✅ FIX — alternatively, remove onChange from deps and use eslint-disable:
useEffect(() => {
  if (config && formData.customizations.length === 0) {
    const defaults = buildDefaults(config);
    onChange({ customizations: defaults });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [config, formData.customizations.length]); // onChange intentionally omitted
```

---

### BUG-13 — Two Admin API URLs Don't Match Backend Routes (404)

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `frontend/src/services/adminApi.ts` |
| **Impact** | `updatePackagePrices()` and `updateAddonVariantPrice()` always return 404. Admin users cannot save any pricing changes through the UI. |

**Root Cause:**

Frontend uses URL patterns that don't match what the backend actually exposes.

| Function | Frontend URL | Backend Route | Problem |
|---|---|---|---|
| `updatePackagePrices(slug, ...)` | `PUT /admin/config/packages/${slug}/prices` | `PUT /admin/config/packages/:id/price` | slug vs id; "prices" vs "price" |
| `updateAddonVariantPrice(slug, variant, ...)` | `PUT /admin/config/addons/${slug}/variants/${variant}/price` | `PUT /admin/config/addons/:id/price` | completely different structure |
| `updateLocationMultiplier(id, ...)` | `PATCH /admin/config/locations/${id}` | `PATCH /admin/config/locations/:id` | ✅ correct |

```ts
// ❌ BROKEN — adminApi.ts:
export async function updatePackagePrices(packageSlug: string, payload: { ... }) {
  const res = await fetch(`${API_BASE}/config/packages/${packageSlug}/prices`, {
  //                                                    ^^^^^^^^^ "slug" not "id"
  //                                                                      ^^^^^^^ "prices" not "price"
    method: 'PUT',

// ✅ FIX — use numeric ID and correct path:
export async function updatePackagePrices(packageId: number, payload: { ... }) {
  const res = await fetch(`${API_BASE}/config/packages/${packageId}/price`, {
    method: 'PUT',

// ❌ BROKEN:
export async function updateAddonVariantPrice(addonSlug: string, variantSlug: string, ...) {
  const res = await fetch(`${API_BASE}/config/addons/${addonSlug}/variants/${variantSlug}/price`, {

// ✅ FIX:
export async function updateAddonVariantPrice(addonId: number, payload: { variantSlug: string; price: number; ... }) {
  const res = await fetch(`${API_BASE}/config/addons/${addonId}/price`, {
```

---

### BUG-14 — Real Admin Credentials Hardcoded in Frontend Source

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `frontend/src/components/admin/AdminLogin.tsx` |
| **Lines** | `useState<string>('admin@asthiwar.com')` and `useState<string>('ChangeMe@2026!')` |
| **Impact** | Default admin email and password are pre-filled in the login form and compiled into the production JavaScript bundle. Anyone who views the page source or network requests can extract these credentials and log into the admin panel. |

```tsx
// ❌ BROKEN — AdminLogin.tsx:
const [email, setEmail] = useState<string>('admin@asthiwar.com');
const [password, setPassword] = useState<string>('ChangeMe@2026!');
//                                                 ^^^^^^^^^^^^^^^ real credentials in source

// ✅ FIX — use empty defaults:
const [email, setEmail] = useState<string>('');
const [password, setPassword] = useState<string>('');
```

---

### BUG-15 — `adminGetMe()` Response Shape Mismatch

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `frontend/src/services/adminApi.ts` |
| **Impact** | Admin portal may appear to load but `user.email`, `user.fullName`, and `user.role` are all `undefined`. The admin header shows blank user info. |

**Root Cause:**

The backend `GET /admin/auth/me` returns `{ success: true, data: { user: { ... } } }`. `handleAdminResponse` extracts `json.data`, yielding `{ user: { ... } }`. But `adminGetMe()` is typed to return the user object directly (flat `{ id, email, fullName, role }`).

```ts
// Backend returns:
res.json({ success: true, data: { user: req.user } });
//                                ^^^^ nested under 'user'

// ❌ BROKEN — adminApi.ts expects flat shape:
return handleAdminResponse<{ id: string; email: string; fullName: string; role: string; }>(res);
// After handleAdminResponse extracts json.data → { user: {...} }
// Caller receives { user: {...} } instead of { id, email, fullName, role }

// ✅ FIX — Option A: adjust the return type:
return handleAdminResponse<{ user: { id: string; email: string; fullName: string; role: string } }>(res);
// Then update callers to use res.user.email etc.

// ✅ FIX — Option B: change the backend to flatten the response:
res.json({ success: true, data: { id: req.user.id, email: req.user.email, ... } });
```

---

### BUG-16 — Dashboard KPI Key Mismatch — All Values Show Zero

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `frontend/src/components/admin/AdminDashboardOverview.tsx`, `backend/src/modules/admin/admin.service.ts` |
| **Impact** | All 4 KPI cards on the admin dashboard show ₹0 / 0. The recent enquiries and package breakdown sections also render empty. |

**Root Cause:**

The backend `getAdminDashboardAnalytics()` returns `{ kpis: { ... }, recentEnquiries, estimatesByPackage }`. But `handleAdminResponse` extracts `json.data` which is the entire object. The frontend reads `data?.metrics` (which is `undefined`) and `data?.recentEnquiries` (which is correct). The KPI card for `averageEstimateValue` reads from `metrics.averageEstimateValue` but the backend sends it as `kpis.avgProjectValue`.

```ts
// Backend sends:
return { kpis: { totalEstimates, totalPipelineValue, avgProjectValue, ... }, recentEnquiries, ... }
//        ^^^^

// ❌ BROKEN — AdminDashboardOverview.tsx reads:
const metrics = data?.metrics || { ... };   // data.metrics is undefined → fallback all-zeros
//                    ^^^^^^^   Backend uses 'kpis', not 'metrics'

// ❌ Also:
metrics.averageEstimateValue    // Backend sends avgProjectValue, not averageEstimateValue

// ✅ FIX — frontend:
const metrics = data?.kpis || { totalPipelineValue: 0, ... };
// and use: metrics.avgProjectValue

// ✅ OR fix — backend (rename for consistency):
return { metrics: { totalEstimates, totalPipelineValue, averageEstimateValue: avgProjectValue, ... } }
```

---

### BUG-17 — PDF Page 1 Content Can Overflow With No Page Break

| Field | Value |
|---|---|
| **Severity** | 🟠 High |
| **File** | `backend/src/modules/pdf/pdf.service.ts` |
| **Impact** | Customers with many brand customizations and add-ons receive a corrupted PDF where content is clipped off-page or the commercial summary box overlaps the sections above it. |

**Root Cause:**

The PDF service hardcodes `totalPages = 2` and renders all sections (Package, Customizations, Add-Ons, Summary) sequentially on Page 1 without checking `doc.y` against the page height (`~842pt`). With 10+ customization rows (18pt each = 180pt) and 15 add-on rows (18pt each = 270pt) plus headers and padding, `doc.y` can easily exceed 800pt.

```ts
// ❌ BROKEN — pdf.service.ts:
const totalPages = 2; // hardcoded, no overflow detection

// Renders sections with no page break check:
customizations.forEach(c => {
  doc.text(c.itemName, ...);
  doc.y += 18; // accumulates unchecked
});

// ✅ FIX — add page break guard before each section:
function checkPageBreak(doc: PDFDocument, neededHeight: number = 60) {
  if (doc.y + neededHeight > doc.page.height - 60) {
    doc.addPage();
  }
}

// Use before each section:
checkPageBreak(doc, customizations.length * 18 + 40);
```

---

## 6. 🟡 Medium Issues

---

### BUG-18 — Car Parking Area Excluded From Base Construction Cost

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/modules/calculator/calculator.service.ts`, `frontend/src/components/calculator/Step3Packages.tsx` |
| **Impact** | Frontend adds car parking to the displayed built-up total for volume discount detection; backend excludes it from `totalBuiltupAreaSqft` for pricing. If the discrepancy is intentional (parking priced separately), there is no separate parking rate applied. Either way, car parking cost is ₹0 for customers. |

The backend spec in `BACKEND_ARCHITECTURE_AND_FLOW.md` states:
> Total Built-Up Sq.Ft = (Built-Up Area Per Floor × Number of Floors) + Car Parking Area Sq.Ft

This is not implemented. `carParkingAreaSqft` is captured and stored in the DB snapshot but never added to `totalBuiltupAreaSqft` before pricing is calculated.

**Fix:** After computing `totalBuiltupAreaSqft`, add:
```ts
totalBuiltupAreaSqft = Number((totalBuiltupAreaSqft + carParkingAreaSqft).toFixed(2));
```

---

### BUG-19 — `getPackageConfig` Misses Universal Option Prices

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/modules/calculator/calculator.controller.ts` |
| **Impact** | Options with universal pricing (`packageId IS NULL`) always show `priceDelta: 0` in `Step4Customizations`. They appear as "Included" when they should show a cost. The calculation engine handles these correctly, so display is wrong but math is right. |

```ts
// ❌ BROKEN — only matches this package's prices:
.leftJoin(optionPrices, and(
  eq(optionPrices.optionId, options.id),
  eq(optionPrices.packageId, pkg.id),   // ← misses packageId IS NULL rows
  isNull(optionPrices.effectiveTo)
))

// ✅ FIX — include universal prices:
.leftJoin(optionPrices, and(
  eq(optionPrices.optionId, options.id),
  or(eq(optionPrices.packageId, pkg.id), isNull(optionPrices.packageId)),
  isNull(optionPrices.effectiveTo)
))
```

---

### BUG-20 — `locationId` Never Set in Form Data

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/calculator/Step0LeadCapture.tsx` |
| **Impact** | The backend falls back to fuzzy text matching for location. "Other TN" may not match `slug: 'other_tn'` because `"other tn".includes("other_tn")` is `false`. The "Other TN" location multiplier would silently not apply. |

```tsx
// ❌ BROKEN — only sets string name:
onChange({ plotLocation: e.target.value });

// ✅ FIX — set both name and ID:
const selectedLocation = locations.find(l => l.name === e.target.value);
onChange({
  plotLocation: e.target.value,
  locationId: selectedLocation?.id ?? null,
});
// Also add locationId to EstimateFormState type in types/index.ts
```

---

### BUG-21 — Volume Discount Threshold Hardcoded in Frontend

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/calculator/Step3Packages.tsx` |
| **Impact** | If an admin changes the volume threshold via `PUT /admin/config/packages/:id/price`, the frontend still shows 3,500 sqft as the threshold. UI/backend mismatch. |

```tsx
// ❌ BROKEN:
const isVolume = totalBuiltup > 3500; // ignores pkg.volumeDiscountThresholdSqft from API

// ✅ FIX:
const isVolume = totalBuiltup > (pkg.volumeDiscountThresholdSqft ?? 3500);
```

---

### BUG-22 — Full Stack Traces Stored in Database

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/services/audit.service.ts`, `backend/src/middleware/errorHandler.ts` |
| **Impact** | Internal Node.js file paths, function names, and library versions are stored in the `audit_logs` table and are accessible via `GET /admin/audit-logs`. In a data breach, this exposes system internals. |

**Fix:** In `errorHandler.ts`, strip or truncate the stack before passing to audit:
```ts
errorStack: env.NODE_ENV === 'production' ? undefined : err.stack,
```

---

### BUG-23 — Audit Log Pagination Missing `total` Field

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/modules/admin/admin.controller.ts` (getAuditLogs handler) |
| **Impact** | Any frontend implementing pagination on audit logs cannot compute the total page count because `total` and `totalPages` are not returned. All other paginated endpoints return these fields. |

**Fix:** Add a `COUNT(*)` query to `queryAuditLogs()` in `audit.service.ts` and return `{ page, limit, total, totalPages }` from the controller.

---

### BUG-24 — Progress Bar Formula Wrong

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/calculator/CalculatorWizard.tsx` |
| **Impact** | Progress bar shows 0% on the first step and reaches 100% before the user submits (on step 3, while still filling in lead details). |

```tsx
// ❌ BROKEN:
style={{ width: `${(currentStep / 3) * 100}%` }}
// Step 0 = 0%, Step 1 = 33%, Step 2 = 67%, Step 3 = 100% (still on last step)

// ✅ FIX:
style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
// Step 0 = 25%, Step 1 = 50%, Step 2 = 75%, Step 3 = 100% (on submit)
```

---

### BUG-25 — Hardcoded Default Session Secret

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/config/env.ts` |
| **Impact** | If `.env` is missing `SESSION_SECRET`, a known public default key is used. Session tokens signed with a known secret can be forged. |

```ts
// ❌ BROKEN:
SESSION_SECRET: z.string().min(16).default('asthiwar-dev-secret-session-key-minimum-32chars'),

// ✅ FIX — no default; fail fast in production:
SESSION_SECRET: z.string().min(32),
// Ensure it's set in all environments. Use .env.example as reminder.
```

---

### BUG-26 — Enquiry Status Filter Values Don't Match Backend Enum

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/admin/AdminEnquiriesManager.tsx` |
| **Impact** | Selecting `IN_PROGRESS`, `CLOSED`, or `ARCHIVED` from the filter tabs sends invalid values to the backend. Zod validation rejects them with 400 or they return 0 results. |

```tsx
// ❌ BROKEN — frontend filter values:
const STATUS_FILTERS = ['ALL', 'NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'];

// Backend enquiryStatusEnum (enquiries.schema.ts):
z.enum(['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTATION_SENT', 'CLOSED_WON', 'CLOSED_LOST'])
// ↑ IN_PROGRESS, CLOSED, ARCHIVED don't exist

// ✅ FIX — align frontend to backend enum:
const STATUS_FILTERS = ['ALL', 'NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTATION_SENT', 'CLOSED_WON', 'CLOSED_LOST'];

// Also fix the status <select> inside the table row:
// <option value="IN_PROGRESS"> → <option value="MEETING_SCHEDULED">
```

---

### BUG-27 — `onLogout` Prop Accepted But Never Wired

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/admin/AdminPortal.tsx` |
| **Impact** | The logout callback passed from `App.tsx` is accepted by `AdminPortal` but not forwarded to any button inside the portal. There is no sign-out button accessible from within the admin panel. |

**Fix:** Forward `onLogout` to the portal header/sidebar and wire it to a "Sign Out" button.

---

### BUG-28 — `floorMultiplier` Column Stores Floor Count, Not a Multiplier

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/modules/calculator/calculator.service.ts` |
| **Impact** | Analytics queries using `floor_multiplier` as a rate coefficient produce wrong results. The column name is misleading. For G+3, it stores `4.0000` (floor count), not a pricing multiplier coefficient. |

```ts
// ❌ MISLEADING:
floorMultiplier: numberOfFloors.toFixed(4),  // stores count (4.0000 for G+3)
// Should be named: numberOfFloors or floorCount

// ✅ FIX — either rename the DB column via migration:
// ALTER TABLE estimates RENAME COLUMN floor_multiplier TO number_of_floors;
// Or store a real multiplier value from the location/package rates
```

---

### BUG-29 — `isNaN()` Disabled Guards Never Trigger

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/components/calculator/Step1Dimensions.tsx` |
| **Impact** | Button disable guards for `carParkingAreaSqft`, `headRoomAreaSqft`, `compoundWallPerimeter`, and `gateAreaSqft` are always `false`. Invalid/missing inputs do not disable the Next button. |

```tsx
// ❌ BROKEN:
disabled={
  ... ||
  isNaN(formData.carParkingAreaSqft) || isNaN(formData.headRoomAreaSqft) ||
  isNaN(formData.compoundWallPerimeter) || isNaN(formData.gateAreaSqft)
}
// onChange always sets: parseFloat(e.target.value) || 0
// So values are always numbers. isNaN(0) === false. Guards never fire.

// ✅ FIX — validate range instead:
disabled={
  ... ||
  formData.carParkingAreaSqft < 0 || formData.headRoomAreaSqft < 0
}
```

---

### BUG-30 — N+3 Database Queries Per Customization Item

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `backend/src/modules/calculator/calculator.service.ts` |
| **Impact** | With 10 brand customizations, the estimate calculation makes 30–40 individual SQL queries. Under concurrent load, this causes significant response time degradation. |

The loop in `calculateEstimate()` makes per-customization queries for `items`, `options`, `optionPrices`, and `packageItems`. These can be replaced with batch queries before the loop.

**Fix:** Batch all item, option, and price lookups into 3 queries before the loop:
```ts
const allItemSlugs = input.customizations.map(c => c.itemSlug);
const allItems = await db.select().from(items).where(inArray(items.slug, allItemSlugs));
// then map into a Record<slug, item> for O(1) lookup in the loop
```

---

### BUG-31 — Missing `credentials: 'include'` in Admin Fetch Calls

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/src/services/adminApi.ts` |
| **Impact** | In production with separate frontend (Vercel) and backend (Render) domains, the HttpOnly session cookie is never sent with admin API requests. All admin API calls return 401 Unauthorized. Admin panel is completely non-functional in production cross-domain deployment. |

```ts
// ❌ BROKEN — no credentials option:
const res = await fetch(`${API_BASE}/auth/me`);

// ✅ FIX — add credentials to every admin fetch call:
const res = await fetch(`${API_BASE}/auth/me`, {
  credentials: 'include',    // ← sends HttpOnly cookies cross-origin
});

// ✅ Better FIX — create a shared admin fetch wrapper:
async function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
}
```

---

### BUG-32 — Dual Conflicting Deployment Configuration Files

| Field | Value |
|---|---|
| **Severity** | 🟡 Medium |
| **File** | `frontend/vercel.json`, `frontend/public/_redirects` |
| **Impact** | `vercel.json` (Vercel-specific) and `_redirects` (Netlify-specific) both exist with proxy rules pointing to the same backend URL. This creates confusion about the intended deployment platform and neither file handles cookie forwarding for cross-origin admin auth. |

**Fix:**
1. Decide on one deployment platform (Vercel or Netlify) and remove the other config.
2. For cross-origin session auth, configure the backend `CORS_ORIGIN` to include the frontend URL, and ensure `credentials: 'include'` is used in all admin fetches (BUG-31).

---

## 7. Fix Priority Roadmap

### Phase 1 — Fix Immediately (Production Blocking)

| Priority | Bug ID | Estimated Effort |
|---|---|---|
| P0 | BUG-01 — Estimate report never renders | 2 min (1 line change) |
| P0 | BUG-07 — CORS bypass | 5 min (remove 1 line) |
| P0 | BUG-14 — Credentials in source | 2 min (clear useState defaults) |
| P1 | BUG-02 — Package price filter missing | 5 min (add 1 condition) |
| P1 | BUG-04 — Option price drops packageId | 30 min |
| P1 | BUG-05 — Package price drops headRoom | 20 min |
| P1 | BUG-13 — Admin API 404 on price save | 30 min |
| P1 | BUG-16 — Dashboard all zeros | 10 min (rename key) |
| P1 | BUG-15 — adminGetMe shape mismatch | 15 min |
| P1 | BUG-31 — Missing credentials in fetch | 30 min (all fetch calls) |

### Phase 2 — Fix This Sprint (Functional Defects)

| Priority | Bug ID | Estimated Effort |
|---|---|---|
| P2 | BUG-03 — Volume rate wrong multiplier | 5 min |
| P2 | BUG-06 — Estimate number collision | 30 min |
| P2 | BUG-08 — Wrong step badge labels | 20 min |
| P2 | BUG-09 — sortBy ignored | 30 min |
| P2 | BUG-10 — Audit trail always anonymous | 10 min |
| P2 | BUG-11 — No real notification dispatch | 2–4 days (provider integration) |
| P2 | BUG-12 — Infinite re-render risk | 15 min |
| P2 | BUG-17 — PDF overflow | 2 hours |
| P2 | BUG-18 — Car parking not in cost | 5 min |
| P2 | BUG-26 — Wrong enquiry status filters | 10 min |

### Phase 3 — Fix Next Sprint (Polish & Security)

| Priority | Bug ID | Estimated Effort |
|---|---|---|
| P3 | BUG-19 — Universal option prices | 15 min |
| P3 | BUG-20 — locationId never set | 20 min |
| P3 | BUG-21 — Volume threshold hardcoded | 5 min |
| P3 | BUG-22 — Stack traces in DB | 10 min |
| P3 | BUG-23 — Audit log pagination | 30 min |
| P3 | BUG-24 — Progress bar formula | 2 min |
| P3 | BUG-25 — Hardcoded session secret | 5 min |
| P3 | BUG-27 — onLogout not wired | 15 min |
| P3 | BUG-28 — floorMultiplier mislabeled | 30 min (migration) |
| P3 | BUG-29 — isNaN guards useless | 5 min |
| P3 | BUG-30 — N+3 DB queries | 2 hours |
| P3 | BUG-32 — Dual deploy configs | 10 min |

---

## 8. Files Audited

Every file in the repository was read and cross-referenced.

### Backend
- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/config/env.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/validate.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.schema.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/admin-config.controller.ts`
- `backend/src/modules/admin/admin-config.schema.ts`
- `backend/src/modules/admin/admin-config.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.schema.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.types.ts`
- `backend/src/modules/calculator/calculator.controller.ts`
- `backend/src/modules/calculator/calculator.schema.ts`
- `backend/src/modules/calculator/calculator.service.ts`
- `backend/src/modules/calculator/calculator.types.ts`
- `backend/src/modules/enquiries/enquiries.controller.ts`
- `backend/src/modules/enquiries/enquiries.schema.ts`
- `backend/src/modules/notifications/notifications.controller.ts`
- `backend/src/modules/notifications/notifications.service.ts`
- `backend/src/modules/notifications/notifications.types.ts`
- `backend/src/modules/pdf/pdf.controller.ts`
- `backend/src/modules/pdf/pdf.service.ts`
- `backend/src/routes/index.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/routes/admin-config.routes.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/src/routes/calculator.routes.ts`
- `backend/src/routes/enquiries.routes.ts`
- `backend/src/services/audit.service.ts`

### Frontend
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/components/calculator/CalculatorWizard.tsx`
- `frontend/src/components/calculator/Step0LeadCapture.tsx`
- `frontend/src/components/calculator/Step1Dimensions.tsx`
- `frontend/src/components/calculator/Step3Packages.tsx`
- `frontend/src/components/calculator/Step4Customizations.tsx`
- `frontend/src/components/calculator/Step5EstimateReport.tsx`
- `frontend/src/components/admin/AdminLogin.tsx`
- `frontend/src/components/admin/AdminPortal.tsx`
- `frontend/src/components/admin/AdminDashboardOverview.tsx`
- `frontend/src/components/admin/AdminEnquiriesManager.tsx`
- `frontend/src/components/admin/AdminEstimatesExplorer.tsx`
- `frontend/src/components/admin/AdminPricingConfigManager.tsx`
- `frontend/src/components/common/ErrorBoundary.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/services/adminApi.ts`
- `frontend/src/types/index.ts`
- `frontend/vercel.json`
- `frontend/public/_redirects`

### Database
- `database/src/schema/*.ts` (all 11 schema files)
- `database/src/seeds/seed.ts`
- `database/src/db.ts`

---

*End of ASTHIWAR Code Audit Report*
