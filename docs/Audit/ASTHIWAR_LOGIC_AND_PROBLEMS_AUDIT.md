# ASTHIWAR — Logic & Problems Audit

> **Scope:** Independent re-audit of the current codebase (post "batch resolve audit bugs" commit `4e67d3f`).
> **Method:** Full read of the backend engine, controllers, services, DB schema/migrations, and all frontend calculator + admin components, cross-checked against `docs/Audit/ASTHIWAR_CODE_AUDIT_REPORT.md`.
> **Purpose:** Identify problems that are **still live in the current source** — either missed by, introduced by, or documented-but-not-implemented in the prior batch fix.

---

## Executive Summary

Most of the previously audited 32 bugs (BUG-01 … BUG-32) are genuinely fixed in the current source. However, this re-audit found:

- **3 Critical** issues still live (CORS wide-open, price versioning destroyed, Express 5 `req.query` reassignment).
- **6 High** issues (parking billed at full rate, no persistence transaction, silent config resets, estimate-number race, PDF overflow).
- **Several Medium** issues (KPI math, multi-row updates, unused inputs, PII in audit logs).

See the priority table at the end for a triage-ready ordering.

---

## 🔴 A. Logic Problems (functional / data correctness)

### L1 — Admin price updates violate the project's own immutability rules (no price versioning)
**Files:** `backend/src/modules/admin/admin-config.service.ts`, `database/src/schema/packages.ts`, `database/drizzle/0004_petite_ironclad.sql`

Migration `0004` **dropped** `effectiveFrom`/`effectiveTo`, converting the price model from versioned history to in-place updates. Consequences:

- `updateAdminPackagePrice`, `updateAdminOptionPrice`, `updateAdminAddonPrice` now do `db.update(...).set(...)` **in place**, overwriting the single price row.
- Breaks **Project Rules #7 and #8** (`.agents/rules/asthiwar-project.md`): *"Maintain price history with effective dates"* and *"Never destroy a price used by an existing estimate."*
- `getAdminPackages()` still builds `priceHistory: [activePrice]` and the UI advertises "versioned audit history" — a claim that is now **false**.

```ts
// admin-config.service.ts — overwrites in place, no history
const [newPrice] = await db
  .update(schema.optionPrices)
  .set({ priceDelta: dto.priceDelta.toFixed(2) })
  .where(eq(schema.optionPrices.optionId, optionId)) // ⚠ hits ALL price rows for the option
  .returning();
```

**Sub-bugs:**
1. **No `packageId` scoping** on the `where` — a universal + package-specific price row would both be overwritten.
2. Loss of history contradicts the stated architecture and estimate-reproducibility guarantee.

**Fix direction:** Restore `effective_to` columns via a new migration; make updates INSERT a new active row and close the previous one; scope by `packageId`.

---

### L2 — `updateAdminOptionPrice` / `updateAdminAddonPrice` return only ONE row but may match many
`.update().where(eq(optionId)).returning()` returns an array; destructuring `[newPrice]` silently discards other updated rows and may return the wrong one to the client.

---

### L3 — Editing a package price silently resets the volume-discount threshold
**File:** `frontend/src/components/admin/AdminPricingConfigManager.tsx` → `handleSavePackage`; `frontend/src/services/adminApi.ts`

`updatePackagePrices` is called without `volumeDiscountThresholdSqft`; the `adminApi.ts` wrapper defaults it to `3500` on every save. Editing a package price **silently resets** any previously-configured threshold back to 3,500. UI labels ("≤ 3,500 sqft" / "> 3,500 sqft") are hardcoded.

---

### L4 — `headRoomPricePerSqft` is not editable from the admin UI
Backend `updateAdminPackagePrice` accepts `headRoomPricePerSqft`, but the **frontend never sends it** and there is no input field. Head-room pricing is frozen at seed value forever.

---

### L5 — Car parking area is billed at full construction + upgrade rates
**File:** `backend/src/modules/calculator/calculator.service.ts` (~line 128)

```ts
if (carParkingAreaSqft > 0) {
  totalBuiltupAreaSqft = Number((totalBuiltupAreaSqft + carParkingAreaSqft).toFixed(2));
}
```

`totalBuiltupAreaSqft` is also compared against the **volume-discount threshold** and used as the multiplier for **every per-sqft brand upgrade**. So parking area:
- inflates the volume-discount trigger, and
- is charged the full package rate **and** every per-sqft customization delta — as if it were finished living space.

**Fix direction:** Give parking its own rate, or exclude it from the upgrade multiplier and threshold comparison.

---

### L6 — `builtupAreaUnit` and `carCount` are never sent from the frontend
**Files:** `frontend/src/types/index.ts`, `frontend/src/services/api.ts`, `CalculatorWizard.tsx`

Backend accepts `builtupAreaUnit` and `carCount`, but `EstimateFormState` has no such fields and the wizard never sets them. Engine falls back to defaults (`'sqft'`, `carCount=1`). Latent bug: `carCount` is always stored as `1`; any future built-up unit conversion would diverge.

---

### L7 — Fuzzy location fallback can mis-match
**File:** `calculator.service.ts` (location fallback)

Primary path uses `locationId` (correct). The fallback still uses `normalizedLoc.includes(l.name.toLowerCase())`, so a location named "Other" matches "Coimbatore Other Zone". Low risk today but order-dependent and non-deterministic across overlapping names.

---

### L8 — `compoundWallPerimeter` and `gateAreaSqft` are collected but never used
**Files:** `frontend/src/components/calculator/Step1Dimensions.tsx`, `frontend/src/types/index.ts`

Captured in the form and validated in the "Next" guard, but **never sent to the backend** and no corresponding engine pricing. Users enter data that does nothing. Wire to the relevant add-ons or remove the fields.

---

### L9 — Dashboard "Lead Conversion" KPI is mislabeled math
**File:** `frontend/src/components/admin/AdminDashboardOverview.tsx`

```tsx
{metrics.totalEstimates > 0
  ? `${((metrics.totalEnquiries / metrics.totalEstimates) * 100).toFixed(1)}%` : '0%'}
```

Backend already computes a proper `conversionRate` (closedWon / totalEnquiries). Frontend instead shows `enquiries / estimates`, which can exceed 100% and has no business meaning. Use `kpis.conversionRate`.

---

### L10 — Estimate-number generation still has a residual collision race
**File:** `calculator.service.ts` → `generateEstimateNumber()`

Retry loop exists, but the generator is `Math.random()` over 900k values and the check-then-insert is **not atomic** (race between `findFirst` and the later `insert`). Under concurrency two requests can pass the check with the same number; one insert then throws on the UNIQUE constraint. Use `crypto.randomBytes` (larger space) and/or catch the unique-violation and retry the insert.

---

## 🟠 B. Other Problems (security, contract, robustness)

### O1 — CORS whitelist is dead code; all origins allowed (BUG-07 NOT actually fixed)
**File:** `backend/src/app.ts`

```ts
if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
return callback(null, true); // ⚠ still allows ALL origins
```

The unconditional `return callback(null, true)` is still present. Combined with `credentials: true`, every origin can make credentialed requests — a live CSRF exposure in production. **Severity: Critical.**

### O2 — `req.query` reassignment will crash on Express 5
**File:** `backend/src/middleware/validate.ts` → `req.query = await schema.query.parseAsync(...)`

In Express 5, `req.query` is getter-only; assignment throws `TypeError: Cannot set property query`. Every validated GET route (`/admin/enquiries`, `/admin/estimates`) would 500. Confirm Express major in `package.json`; if 5.x, write parsed values to `res.locals` instead of reassigning `req.query`.

### O3 — Estimates explorer under-uses the API surface
`getAdminEstimates` accepts `status`/`locationId` filters that the frontend wrappers never expose. Not breaking; inconsistent with the enquiries manager.

### O4 — PDF milestone table on the final page has no page-break guard
**File:** `backend/src/modules/pdf/pdf.service.ts`

Sections 1–3 use `checkPageBreak`. The 10-stage milestone loop (`milestones.forEach`) draws 19pt rows with no overflow check and can run under the fixed signature block at `y=740`. Add the same guard used in the customization loops.

### O5 — PII written to audit logs on every error
**File:** `backend/src/middleware/errorHandler.ts` → `metadata: { body: req.body, query, params }`

`sanitizePayload` redacts password/token keys, but the entire request body (name, phone, email, location) is persisted to `audit_logs` and retrievable via `GET /admin/audit-logs`. PII-retention concern. Store only shape/keys or a size-capped subset.

### O6 — Permissive `CORS_ORIGIN` default (moot due to O1)
`env.ts` defaults `CORS_ORIGIN` to localhost. Fine on its own, but irrelevant while O1 allows all origins anyway.

### O7 — Dead/misleading analytics return type
**File:** `frontend/src/services/adminApi.ts` + `AdminDashboardOverview.tsx`

The `{ kpis?…; metrics?… }` union and `data?.kpis || data?.metrics` fallback are dead code — backend only returns `kpis`. The `avgProjectValue || averageEstimateValue` alias is the only working part.

### O8 — `getDurationForFloors` conflates floor count with schedule duration
**File:** `calculator.service.ts`

`getDurationForFloors(input.floorCount)` drives both `numberOfFloors` and the schedule. Works, but the naming is a maintainability trap — the same value drives area math. Rename/split.

### O9 — No transaction on estimate persistence
**File:** `calculator.service.ts` persistence block

`estimates`, `estimateItems`, and `estimateAddons` inserts are three separate awaits with **no `db.transaction`**. A failure on insert 2/3 leaves an orphaned estimate with missing line items. Wrap all three in a transaction. **Severity: High.**

---

## ✅ Confirmed Already Fixed (prior audit)

BUG-01 (step index → `setCurrentStep(4)`), BUG-02 (`getPackages` active filter; single-row model post-0004), BUG-03 (`multiplier = floorCount+1`), BUG-08 (step labels 1–4 of 4), BUG-09 (`sortBy` map), BUG-10 (`req.user`), BUG-12 (`useCallback` + deps), BUG-13/15/31 (`adminFetch` wrapper, `/price` paths, `credentials: 'include'`), BUG-16 (`kpis`), BUG-19 (universal option prices via `or(...isNull)`), BUG-20 (`locationId` set), BUG-21 (threshold from `pkg`), BUG-22 (stack gated by env), BUG-23 (`total`/`totalPages`), BUG-24 (progress formula), BUG-25 (`SESSION_SECRET` min 32, no default), BUG-26 (enquiry enum aligned), BUG-27 (`onLogout` wired), BUG-28 (column renamed), BUG-30 (batch queries).

---

## Recommended Fix Priority

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| O1 | CORS still allows all origins | 🔴 Critical | 2 min |
| L1 | Price versioning destroyed (Rules 7/8) | 🔴 Critical | 1–2 hrs (migration + service) |
| O2 | `req.query` reassignment on Express 5 | 🔴 Critical (if v5) | 15 min |
| L5 | Parking billed at full rate + upgrades | 🟠 High | 30 min |
| O9 | No transaction on estimate persistence | 🟠 High | 20 min |
| L3/L4 | Volume threshold reset / headroom uneditable | 🟠 High | 30 min |
| L10/O4 | Estimate-number race; PDF milestone overflow | 🟠 High | 30 min each |
| L9/L2/L6/L7/L8 | KPI math, multi-row return, unused inputs | 🟡 Medium | small each |
| O5/O7/O8 | PII in audit, dead types, naming | 🟡 Medium | small each |

---

*Generated as an independent re-audit. Line references are approximate and reflect the state of commit `4e67d3f`.*
