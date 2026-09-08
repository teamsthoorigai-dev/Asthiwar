# 05 — Cost Calculator (Phase 1, frontend-only)

The estimator is ASTHIWAR's single biggest differentiator — nothing on Novascape comes
close. Novascape lists two fixed prices; ASTHIWAR can price a building.

**Phase 1 rule:** the whole flow runs client-side against a local pricing module. The
maths, the data and the report are all real. Only *persistence* is missing.

**Design the API boundary now so Phase 2 changes one file.**

---

## 1. Flow

```
Step 0  Lead capture      name · phone · email · location · notes
Step 1  Dimensions        plot area + unit · built-up per floor · car parking
Step 2  Floors            G / G+1 / G+2 / G+3
Step 3  Package           Basic · Standard · Premium · Luxury  (+ volume rate)
Step 4  Customisations    10 brand upgrades · 15 add-ons
Step 5  Report            breakdown · 10-stage milestone plan · print/PDF · book a visit
```

Progress bar across the top, back/next at the bottom, state held in one reducer.
Persist to `sessionStorage` so a refresh does not wipe the wizard.

---

## 2. Pricing engine — `src/lib/pricing/engine.ts`

Port these formulas **exactly**. They come from the backend service in the old repo and
are the authoritative logic.

```ts
export const UNIT_TO_SQFT = { sqft: 1, cents: 435.6, sqyards: 9 } as const;

export const FLOOR_MULTIPLIER = { ground: 1, g1: 2, g2: 3, g3: 4 } as const;

export const PARKING_SQFT = { none: 0, one: 200, two: 400 } as const;

export const VOLUME_THRESHOLD_SQFT = 3500;

export function normalisePlot(area: number, unit: keyof typeof UNIT_TO_SQFT) {
  return area * UNIT_TO_SQFT[unit];
}

export function totalBuiltUp(perFloor: number, floors: keyof typeof FLOOR_MULTIPLIER, parking: keyof typeof PARKING_SQFT) {
  return perFloor * FLOOR_MULTIPLIER[floors] + PARKING_SQFT[parking];
}

export function activeRate(pkg: Package, builtUp: number) {
  return builtUp > VOLUME_THRESHOLD_SQFT ? pkg.volumeRate : pkg.standardRate;
}

export function estimate(input: EstimateInput): EstimateResult {
  const builtUp        = totalBuiltUp(input.perFloor, input.floors, input.parking);
  const rate           = activeRate(input.package, builtUp);
  const effectiveRate  = rate * input.locationMultiplier;
  const baseCost       = builtUp * effectiveRate;
  const upgradesCost   = input.upgrades.reduce((s, u) => s + u.deltaPerSqft * builtUp, 0);
  const addOnsCost     = input.addOns.reduce((s, a) => s + a.price * a.quantity, 0);
  const total          = baseCost + upgradesCost + addOnsCost;

  return {
    builtUp, rate, effectiveRate, baseCost, upgradesCost, addOnsCost, total,
    volumeApplied: builtUp > VOLUME_THRESHOLD_SQFT,
    milestones: MILESTONES.map(m => ({ ...m, amount: Math.round(total * m.pct / 100) })),
  };
}
```

**Rounding rule:** round only at the milestone step (`Math.round`), exactly as the backend
does. Rounding earlier will make the frontend and backend disagree in Phase 2.

---

## 3. Data — `src/data/pricing.ts`

### Packages

| Key | Name | Standard rate (≤ 3,500 sqft) | Volume rate (> 3,500 sqft) | Spec highlights |
|---|---|---|---|---|
| `basic` | Basic | ₹2,099 / sqft | ₹2,000 / sqft | ISI steel, fly-ash blocks, M20 mix, 9.5 ft ceiling |
| `standard` | Standard | ₹2,468 / sqft | ₹2,357 / sqft | Vizag steel, JSW cement, 10 ft ceiling, Dr. Fixit waterproofing |
| `premium` | Premium | ₹2,899 / sqft | ₹2,799 / sqft | ARS/Suryadev steel, Ramco cement, teak doors, Somany tiles |
| `luxury` | Luxury | ₹3,250 / sqft | ₹3,200 / sqft | TATA/JSW steel, Ultratech cement, red brick, Kohler sanitary |

### Locations and multipliers

Only two multipliers are documented in the old repo. **Do not invent the rest.**

```ts
export const LOCATIONS = [
  { slug: 'chennai',    name: 'Chennai',    multiplier: 1.05 },  // documented
  { slug: 'pollachi',   name: 'Pollachi',   multiplier: 0.96 },  // documented
  { slug: 'coimbatore', name: 'Coimbatore', multiplier: 1.00, confirmed: false },
  { slug: 'madurai',    name: 'Madurai',    multiplier: 1.00, confirmed: false },
  { slug: 'tiruppur',   name: 'Tiruppur',   multiplier: 1.00, confirmed: false },
  { slug: 'erode',      name: 'Erode',      multiplier: 1.00, confirmed: false },
  { slug: 'salem',      name: 'Salem',      multiplier: 1.00, confirmed: false },
] as const;
```

Anything with `confirmed: false` defaults to `1.00` and must be signed off before launch.
Flag them in `01-MASTER-PLAN.md` §9.

### Brand upgrades (10 categories)

Each is a category with a default (included in the package) plus paid options carrying a
`deltaPerSqft`. Only masonry has a documented delta.

| # | Category | Options | Delta |
|---|---|---|---|
| 1 | Structural steel | Fe 550D — JSW, TATA, ARS, Vizag | to confirm |
| 2 | Cement | Ultratech, Ramco, Dalmia, JSW | to confirm |
| 3 | Masonry | Red brick vs solid concrete / AAC | **+₹100 to +₹120 / sqft** |
| 4 | Flooring | Italian marble / large vitrified vs standard ceramic | to confirm |
| 5 | Doors & windows | First-quality teak / UPVC 3-track vs flush doors | to confirm |
| 6 | Sanitary & CP | Kohler / Jaquar / Toto vs Parryware | to confirm |
| 7 | Electrical | Havells / Finolex / Legrand modular | to confirm |
| 8 | Painting | Asian Paints Royale / Apex Ultima | to confirm |
| 9 | Waterproofing | 3-layer chemical injection | to confirm |
| 10 | Drawings | 3D VR walkthrough, structural vetting | to confirm |

Model every option with a `deltaPerSqft: number | null`. Where it is `null`, show the
option but disable selection with the note *Pricing to be confirmed* — the wizard must not
silently price something at zero.

### Add-ons (15)

| Add-on | Price | Unit |
|---|---|---|
| Underground RCC / fly-ash sump | ₹26 | per litre |
| Septic tank | ₹30 | per litre |
| Rainwater harvesting | ₹35,000 | fixed |
| Red brick compound wall | ₹2,900 | per running ft |
| CCTV surveillance, 8 cameras | ₹45,000 | fixed |
| Video door phone | ₹22,000 | fixed |
| Rooftop solar 3kW / 5kW | ₹1,80,000 | fixed |
| EV car charging station | ₹35,000 | fixed |
| 4-passenger automatic lift | ₹12,50,000 | fixed |
| Modular acrylic / marine kitchen | ₹2,50,000 | fixed |
| POP false ceiling | ₹110 | per sqft |

That is 11 documented. Four more exist in the old backend's catalogue — read them from
`asthiwar-v1-main/backend` before finalising, or ship with 11 and add the rest in Phase 2.

Quantity-based add-ons (per-litre, per-Rft, per-sqft) need a number input with sensible
min/max and a live line-item subtotal.

### Milestone schedule — must total exactly 100.0%

```ts
export const MILESTONES = [
  { n: 1,  pct: 3,  label: 'Design, approvals & architectural plan' },
  { n: 2,  pct: 4,  label: 'Earthwork excavation & anti-termite treatment' },
  { n: 3,  pct: 15, label: 'Foundation footing, plinth beams & basement filling' },
  { n: 4,  pct: 22, label: 'RCC columns, roof slab casting & shuttering' },
  { n: 5,  pct: 14, label: 'Brickwork, AAC blocks, lintels & parapet walls' },
  { n: 6,  pct: 8,  label: 'Concealed electrical conduits & plumbing lines' },
  { n: 7,  pct: 10, label: 'Internal levelling & external weather plastering' },
  { n: 8,  pct: 11, label: 'Flooring, bathroom tiling & kitchen countertops' },
  { n: 9,  pct: 8,  label: 'Primer, emulsion painting, doors & windows' },
  { n: 10, pct: 5,  label: 'Sanitary ware, switchboards, deep clean & handover' },
] as const;
```

Add a unit test asserting the sum is 100. It is the kind of thing that silently drifts.

---

## 4. Step-by-step UI

### Step 0 — Lead capture
Fields: full name (min 2) · phone `^[6-9]\d{9}$` · email · location select · notes (optional).
Inline validation on blur. `Begin estimation` enables only when valid.

> **Consider moving this to the end.** Novascape gates everything behind a form; ASTHIWAR's
> brand is "grounded and precise". Letting someone estimate first and asking for details to
> *save or download* the result converts better and reads more honestly. Ship Step 0 first
> if the sales team needs the lead regardless — but this is worth a conversation.

### Step 1 — Dimensions
- Plot area + unit toggle (Sq.Ft / Cents / Sq.Yards). Show the live conversion:
  `3 Cents ≈ 1,307 sqft` in an accent badge.
- Built-up area per floor: range slider bounded by the normalised plot area (a floor
  footprint cannot exceed the plot). Preset chips: 800 / 1000 / 1200 / 1500 / 1800 / 2000 /
  2400, filtered to those that fit.
- Footnote: *Footprint is single-floor coverage; total area multiplies in the next step.*
- Car parking: None (0) / 1 car (200 sqft) / 2 cars (400 sqft).

### Step 2 — Floors
Four cards: Ground · G+1 (*most common*) · G+2 · G+3.
Live summary: total built-up area and FSI (`builtUp / plotSqft`).
Novascape-style flourish: a simple stacked-slab SVG that gains a floor as you go up —
pure CSS/SVG, no 3D library.

### Step 3 — Package
Four cards with rate, spec highlights, and a `Selected` state in `--accent`.
When `builtUp > 3500`, show a **Volume rate applied** banner and strike through the
standard rate. Show the effective rate after the location multiplier, with the multiplier
made visible — do not hide the maths.

### Step 4 — Customisations
Two tabs: **Specification** (10 upgrade categories, radio per category) and
**Add-ons** (15 checkboxes, with quantity inputs where the unit demands it).
A sticky running-total bar at the bottom of the viewport that updates live.

### Step 5 — Report
- Header: `EST-2026-XXXXXX`. Phase 1 generates this client-side —
  **label it clearly as a preview** (`Preview estimate — not yet saved`) until Phase 2.
- Breakdown table: base construction · specification upgrades · add-ons · **grand total**.
- Inputs summary so the reader can check the assumptions.
- 10-stage milestone table with amounts.
- Disclaimer: *Indicative estimate only. Final cost depends on design, specifications,
  site conditions, materials and project requirements.* (Wording already approved in the
  old repo's FAQ — reuse it.)
- Actions: **Print / Save as PDF** (`window.print()` with a dedicated print stylesheet —
  no PDF library needed in Phase 1), **Email me this estimate** (stubbed), and
  **Book a site consultation** -> `/contact` with the estimate ID prefilled.

---

## 5. The API boundary — `src/lib/api.ts`

Every network-shaped action goes through this one file. Phase 2 replaces the bodies only.

```ts
import { estimate } from '@/lib/pricing/engine';

export async function createEstimate(input: EstimateInput): Promise<EstimateResult> {
  // PHASE 1: local
  return estimate(input);
  // PHASE 2: return fetch('/api/v1/calculator/estimate', {...}).then(r => r.json());
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<{ ok: true }> {
  console.info('[stub] enquiry', payload);
  await new Promise(r => setTimeout(r, 600));
  return { ok: true };
  // PHASE 2: POST /api/v1/enquiries
}
```

**Never call `fetch` from a component.** If an AI tool writes one, move it here.

---

## 6. Visual treatment

The calculator should feel like the rest of the site, not like a form.

- Same tokens, same type scale, square corners, one accent.
- Full-viewport steps with generous whitespace; one decision per screen.
- Step transitions: M5 (`y: 24, opacity: 0` -> in), 0.4s. No slide carousels.
- The running total uses the **M2 odometer** — the numbers roll as choices change. This is
  the one place where Novascape's counter animation earns its keep functionally.
- Progress: a thin `--hairline` bar with an `--accent` fill, plus `Step 3 of 6` in text.

## 7. Acceptance

- [ ] An estimate can be produced end to end with the network disconnected
- [ ] Milestone percentages sum to exactly 100
- [ ] Volume rate activates at exactly 3,501 sqft
- [ ] Unit conversions match: 1 cent = 435.6 sqft, 1 sq yard = 9 sqft
- [ ] Refreshing mid-wizard restores state from `sessionStorage`
- [ ] The report prints cleanly to A4 in 2 pages
- [ ] Every unconfirmed price is visibly labelled, never silently zero
- [ ] Keyboard-only completion is possible
