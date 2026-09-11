# ASTHIWAR — pricing / admin work in progress

Handoff written 2026-09-11. Everything below is verified against the running app
and the live database unless a line says otherwise. Pick this up cold; no prior
conversation is needed.

**Status at handoff:** `npm run check-types` exits **0** across all three
workspaces. `npm run test:offline` is **12/12**. `npm run test:backend` is
**7/7 suites**. The owner committed the earlier half of this work as `5507d21
"admin pricing fix"`; `AdminUsersManager.tsx` is no longer broken, so the
constraint against touching it is lifted.

**One thing is badly broken and it is not from this work — read §3 first.**

---

## 0. Hard constraints — read before touching anything

| Rule | Why |
|---|---|
| **Do not edit `backend/src/modules/pdf/pdf.service.ts`** | Being edited concurrently outside this workstream. It has intermittently shown ~60 type errors (`MARGIN`, `NAVY_HEADER`, `BORDER_COLOR` undefined). Not ours. |
| **Do not touch the notification-dispatch messaging** | Audit item #8. The admin UI reports a notification was dispatched and flips status to SENT when it was not. The owner explicitly deferred this. Leave it. |
| **`database/src/seed.ts` is the price baseline** | Never assert a price from a live DB you happened to look at. Seed rates: Basic 2099/1999, Standard 2468/2357, Premium 2899/2799, Luxury 3250/3200 (standard/volume ₹ per sq.ft). |
| **Restore every probe** | If you mutate data to test, put it back. Baseline row counts: estimates 36, enquiries 36. Delete any probe admin accounts you create. |
| **No sugarcoating** | `AGENTS.md` requires blunt, verified critique. Do not report something as fixed that you did not watch work. |

Stack: npm workspaces monorepo — Next.js 16 App Router (root), Express 4 (`backend/`),
Drizzle + Postgres 18 on **port 5433**, db `AsthivarDb` (`database/`).

---

## 1. What is already done (do not redo)

All of the following typechecks clean, and was verified end-to-end in the browser
or via the API. The earlier half is already committed as `5507d21`; the rest is in
the working tree, uncommitted.

**Security**
- Estimate PII enumeration closed. Estimates now carry an `access_token`
  (migration `database/drizzle/0014_add_estimate_access_token.sql`, journal idx 14).
  Public fetch by quotation number alone → 404; wrong token → *identical* 404
  (no oracle, `crypto.timingSafeEqual`). See
  `backend/src/modules/calculator/quotation.ts` → `resolveEstimateForPublicAccess`.
- Admin role enforcement. `backend/src/middleware/auth.ts` gained
  `ADMIN_ROLES`, `roleRank` (unknown → -1), `hasAtLeastRole`, `requireRole(min)`.
  Verified with a real `viewer` account: 200 on reads, 403 on repricing / deletion / lead edits.
- Admin account CRUD added (`backend/src/modules/auth/users.{schema,service,controller}.ts`)
  with self-lockout and last-super-admin guards. Password change UI:
  `src/components/admin/AdminChangePasswordDialog.tsx`.
- Estimate writes rate-limited. Verified: 12 rapid posts → `201 ×10, 429 ×2`.
- CSV export escapes `= + - @` with a leading `'` (formula injection),
  RFC 4180 CRLF, UTF-8 BOM — `src/lib/csv.ts`.

**Pricing correctness (all verified)**
- Head room now takes the city multiplier. Chennai ×1.05 → `floors @ 3412.5 | head room @ 1050` (was 1000).
- Head room counts toward the volume threshold. `built-up 3400 + head room 200 = enclosed 3600 → volume applied: true`.
- All-in rate divides by enclosed area, not built-up: `₹53,75,000 / 2000 = ₹2687.50/sq.ft` (was ₹3583.33 — an overstatement).
- Package cards quote the **location-adjusted** rate (`StepPackages.tsx`), and use
  enclosed area for the threshold. Previously the card said ₹3,250 while Chennai was charged ₹3,412.50.
- The city selector moved to **step 1** (`StepDimensions.tsx`), where the rates it
  changes are on screen. On the lead-capture step it is read-only with a "Change"
  button routing back to step 0.
- Option delta labels follow `priceType` (`formatDelta` in `StepCustomizations.tsx`).
  A fixed-price brand used to render "+₹25,000/sq.ft".
- Duplicate billing refused (`seenItemSlugs`, `seenAddonVariants`, `seenAddonSlugs`,
  `allowsMultiple` respected). Verified: ₹1,05,000 and ₹90,000 double-charges both refused.
- Add-on price changes now version (retire + insert) instead of destroying history.
- Volume rate > standard rate refused on both client and server.
- **Included-brand-is-free guard** (the one specifically requested), in
  `backend/src/modules/admin/admin-config.service.ts` → `updateAdminPackageItem`.
  Verified response:
  `{"success":false,"error":{"code":"INCLUDED_OPTION_IS_NOT_FREE","message":"'JSW / TATA Steel & TATA Wire' costs +₹95/sq.ft in this package, so it cannot also be the brand included with it..."}}`
  Legitimate change → 200. Clearing the default → 200.

**Admin Specifications UI — reworked into one matrix**
- `src/components/admin/AdminPricingConfigManager.tsx`. The two stacked blocks that
  showed the same four brands twice ("Included Brand per Package" dropdowns +
  "Brand Choices & Upgrade Price Deltas" cards) are now **one table per component**:
  rows are brands, columns are the four tiers, the included brand is the marked
  radio, and the figure beside the mark is what that tier charges to switch.
- Column headers carry the `isIncluded` checkbox (is this component in that tier at
  all); a tier with no `package_items` row renders "Not mapped", which is visibly
  different from "in the tier with no brand chosen".
- A trailing **"No brand set"** row replaces the dropdown's blank entry and shows an
  amber "prints a dash" warning on the tiers that are unset.
- New helpers: `resolveLiveDelta(opt, packageId)` (module level — resolves the
  package-specific row, falls back to the universal one, and reports `inherited` so
  a shared rate is marked with a dotted underline) and `tierColumnsFor(item)`.
- **Deleted `handleUpdateOptionPriceDelta`.** Its only caller was the per-brand card.
  It wrote the universal rate from a view with no tier in scope, so one box silently
  repriced all four packages, and its toast said "/sq.ft" even for a component
  measured in items. All rate editing now goes through the option dialog, which
  already seeds every tier from the universal rate and writes explicit per-package
  rows on save — a strict superset, so nothing was lost.
- **Verified in the browser** at `/admin` → Pricing Matrix Config → Specifications Matrix:
  - Renders on all 24 components. Steel Rebar reads
    `Basic: Any ISI (Included), ARS +₹45, JSW +₹95, SPA +₹15` /
    `Standard: SPA (Included)` / `Premium: ARS (Included), JSW +₹50` / `Luxury: JSW (Included)`.
  - Marking a paid brand as included → refused, radio reverts, toast:
    *"'ARS / Suryadev / Sumangala & TATA Wire' costs +₹45/sq.ft in this package, so it
    cannot also be the brand included with it..."*
  - Marking a ₹0 brand → saved (Premium moved ARS → SPA, matrix updated), **restored to ARS**.

**GST — the dead row is gone (pricing bug #10, partial)**
- `src/components/admin/AdminEstimatesExplorer.tsx` no longer renders a permanent
  "GST (0%): +₹0" line. It only renders when the rate is > 0, matching the
  customer-facing report. The remaining half is a product decision — see TASK 1.

**Dead code removed**
- Deleted `src/lib/pricing/engine.ts`, `src/lib/pricing/types.ts`,
  `src/lib/pricing/pricing.test.ts`, `src/data/pricing.ts` — a second pricing
  engine nothing imported, priced from constants that had drifted from the catalogue.

**Tests**
- `backend/src/modules/calculator/pricing-math.ts` — pure arithmetic extracted from
  the engine so it is testable without a DB.
- `backend/src/modules/calculator/pricing-math.test.ts` — 12 assertions against real
  production code. **12/12 pass.**
- `scripts/test-pricing.js` rewritten: resolves `node_modules/tsx/dist/cli.mjs`
  directly via `process.execPath` (npx.cmd on Windows was exiting 0 with no output —
  a green test run that ran nothing).
- Backend suites: `api.test.ts` Test 7 and `pdf.test.ts` Test 2 updated to carry
  `?t=<accessToken>`, plus new assertions that number-alone and wrong-token are
  both refused and indistinguishable. All 7 suites passed after the change.

---

## 2. TODO — in priority order

### TASK 1 — GST: decide whether it should be configurable  *(needs the owner)*

Half of pricing bug #10 is fixed: the admin estimate detail no longer renders a
dead "GST (0%)" row (see §1). The other half is a product decision, not a bug fix.

**Facts (verified):**
- `backend/src/modules/calculator/calculator.service.ts:593` —
  `const gstPercentage = 0.00; // As standard per civil construction quote estimates`
  Hardcoded. Also used at 594, 696, 768.
- `estimates.gst_percentage numeric(4,2) DEFAULT '0.00' NOT NULL`
  (`database/src/schema/estimates.ts:55`, migration `0000`).
- **There is no settings table.** Tables are: addons, addon_prices, admin_users,
  admin_sessions, audit_logs, health_check, enquiries, estimates, estimate_items,
  estimate_addons, locations, milestone_stages, notifications, packages,
  package_prices, categories, items, options, package_items, option_prices.
  So GST has nowhere configurable to live today.

**If the owner wants an operator-settable rate**, it needs a new `app_settings`
table (or a `gst_percentage` column on `packages`), a Drizzle migration (**next
index is 0015**), an admin config endpoint, and a field in the pricing config UI.
Ask before starting it — it is a feature, not a fix.

**Do NOT** add an admin input that writes nowhere.

---

### TASK 2 — Verify the calculator wizard changes in the browser  *(blocked by §3)*

Blocked until the `/cost-calculator` hydration bug in §3 is fixed. The wizard changes
typecheck clean but cannot be exercised: the page renders no inputs at all.

Once it is fixed, verify and report with screenshots:
1. The city selector is the **first** field on step 1, with the hint
   "Rates vary by city. Package prices update to match your location."
2. Changing the city changes the rate **on the package cards** — pick Chennai
   (x1.05) and confirm Luxury reads ₹3,412.50, not ₹3,250.
3. On the lead-capture step the city is read-only and "Change" returns to step 0.
4. A fixed-price brand's delta reads "+₹25,000 total", never "+₹25,000/sq.ft".

Use the Browser pane (`preview_start`), never `Bash`, for dev servers. Web is on
:3000, API on :4000, Postgres on :5433 — all three were running at handoff time.
Note that `next dev` refuses to start a second server against this directory, so
`preview_start` with `autoPort` will not give you a private instance.

---

### TASK 3 — Test status (all green at handoff; re-run after changes)

```bash
npm run test:offline
```
→ `# tests 12 / # pass 12 / # fail 0`, then `✅ Offline pricing arithmetic passed.`

```bash
npm run test:backend
```
→ `✓ all 7 suite(s) passed`. Worth knowing: the PDF suite passed, so
`backend/src/modules/pdf/pdf.service.ts` is currently in a working state; and the
access-token work is covered — `GET .../AW-2026-O-0057/pdf?t=<64-hex>` → 200 while
the same URL without the token → 404.

```bash
npm run check-types
```
→ exit **0** across database, backend and web.

These suites create their own estimates (two per `test:backend` run), so the estimate
count climbs on every run. That is the suites' own data, not a probe left behind.

---

## 3. OPEN BUG — `/cost-calculator` never hydrates. The page is dead.

**Not caused by this work.** Proven: the failure reproduces identically with every
calculator change in this branch stashed (`git stash push -- src/components/calculator
src/lib/calculator/types.ts`), i.e. against committed `5507d21`. The stash was popped
and the tree restored.

**Symptom.** Open `http://localhost:3000/cost-calculator` and wait:
- The wizard sits on *"Loading ASTHIWAR Engine — Fetching live package rates and
  regional city pricing multipliers..."* forever.
- Zero `<input>` and zero `<select>` elements on the page.
- `document.body.innerText.length` is **591** (the homepage is 6813) — the page's own
  hero copy is not in the rendered text either.

**What is actually happening.** The route segment never hydrates:

```js
// on /cost-calculator
document.querySelector('main')                    // has React fibers
[...document.querySelector('main').children]      // → [<template id="B:0">, <div>]
// the <div> holding the whole page has ZERO __reactFiber$ keys
```

`<template id="B:0">` is React's streaming **Suspense boundary placeholder**. The
server emitted it, and the served HTML *does* contain the completion script
(`grep -o 'B:0|S:0|\$RC' ` on `curl`ed HTML → `$RC ×2, B:0 ×2, S:0 ×2`), but in the
browser the template is still sitting there — the boundary is never swapped in. So
React never claims that subtree, **no effect in it ever runs**, and the fetch in
`useCalculatorWizard.ts:82` that would clear `loading` is never issued
(`performance.getEntriesByType('resource')` shows no `/api/` entry). The API itself
is fine: `fetch('/api/v1/calculator/locations')` from the console returns 200 in 51ms.

**Ruled out:**
- Not the API, not the backend, not the database.
- Not React overall — `/`, `/services`, `/contact` and `/admin` all hydrate normally
  (`main > div` with fibers, `display: block`). `/services` has no Suspense boundary
  in its HTML at all; `/cost-calculator` is the only route that does.
- Not a compile error — the dev log (`.next/dev/logs/next-development.log`) shows
  only `✓ Compiled`, and there are no console errors and no failed script loads.
- Not the stylesheet. Both `<link rel="stylesheet">` elements report `sheet != null`.
  `calculator.css` is the app's only bare global CSS import from *inside a client
  component* (the other two, `globals.css` and `admin.css`, sit at the top of their
  segment), so moving it to `src/app/cost-calculator/page.tsx` was tried — **it did
  not fix it, and the experiment was reverted.**

**Where to look next:** why this route gets a Suspense boundary when
`src/app/cost-calculator/page.tsx` is a synchronous server component, and why `$RC`
does not run in the browser. Next.js 16.3.4 with Turbopack. Worth trying a clean
`.next` and a dev-server restart before anything else — the running server (PID
11540) has been up across a great many edits.

**Why it matters:** this is the public cost calculator — the lead funnel the whole
backend exists to serve. Everything downstream of it (the city selector on step 1,
the location-adjusted package cards, the per-tier delta labels) is unverifiable in
the browser until this is fixed, and no customer can get a quote.

---

## 4. Things worth knowing that are not obvious from the code

- **Add-on tier encodings are three-way.** `addon_prices.package_tier` holds `'all'`,
  a CSV (`basic,premium`), **or** a legacy group name (`basic_standard`,
  `premium_luxury`). Live rows still use each. `backend/src/services/addon-tiers.js`
  resolves all three; a narrower tier outranks a blanket one.
- **Option prices are per-package or universal.** `option_prices.package_id` may be
  `NULL`, meaning it applies to every package. The per-package row wins. The
  included-brand guard checks the package-specific row first, then the universal one.
- **Prices are effective-dated,** not overwritten: `effective_from` / `effective_to IS NULL`
  with partial unique indexes (migration 0010). To change a price you retire the
  current row and insert a new one. Never `UPDATE` a live price row.
- **`floorCount` counts floors *above* ground.** `floorsIncludingGround(3) === 4` (G+3).
- **Milestone rounding:** `distributeMilestoneAmounts` makes the last stage absorb
  the rounding so instalments sum to the total exactly.
- Drizzle column typing: a generic `windowFor(column: AnyPgColumn)` helper does not
  typecheck against table-specific column types. Use explicit per-table bounds
  arrays (`estimateBounds`, `enquiryBounds`). A cast would hide a real mistake.
- **Heredocs in the Bash tool have been failing** on apostrophes in this repo's
  session. Write Python patch scripts into the scratchpad and run `python <path>` instead.
