# 04 — Inner Page Specs

Every inner page uses the same shell: `SiteHeader` -> `PageHero` -> content -> CTA band ->
`SiteFooter`. Build `PageHero` once and reuse it eight times.

## Shared: `<PageHero>`

Props: `eyebrow`, `title`, `body?`, `image?`, `align?`.

Layout: `padding-block-start: calc(var(--section-y) + 5rem)` to clear the fixed header.
Eyebrow at `--fs-sm` uppercase `--accent`, `letter-spacing: 0.1em`. H1 with M1 SplitText.
Body at `--fs-lg` / `--body`, max-width 56ch. Optional full-bleed image below with the
same `scale: 1.06 -> 1` entrance as the homepage hero.

Every page also ends with a shared `<CtaBand>`: `--surface` background, H2 + one primary
button. Vary the H2 per page so it does not read as boilerplate.

---

## `/projects` — Archive

**Hero:** eyebrow `Work` · H1 **Selected projects** · body *Completed and in-progress work
across Coimbatore and Tamil Nadu.*

**Filter row:** category pills — All · Residential · Commercial · Hospitality ·
Institutional · Renovation. Client-side filter with a GSAP `Flip`-free approach: just
fade-out/fade-in the grid (0.25s) on change. Reflect the active filter in the URL
(`?category=residential`) so it is shareable.

**Grid:** 2 columns on `lg`, 1 on mobile. Each `ProjectCard`:
- 4:5 image, `object-cover`
- **Hover gallery** — the old repo's cards carry a `gallery: string[]` of 4 frames.
  On hover, cycle through them every 700ms with a cross-fade. On touch, show only the
  first image. This is a distinctive detail worth keeping.
- Below the image: title (`--fs-h4`), then a hairline-separated meta row —
  `location · type · area · year · status`.
- Whole card is one link to `/projects/[slug]`.

**Data:** `projects[]` in `src/data/site.ts`. Four entries exist:
`courtyard-residence`, `jaali-house`, `lime-plaster-apartment`, `workshop-office` —
all currently titled `Project 01`–`Project 04` with `"to be confirmed"` fields.
Render those strings honestly. Only `jaali-house` has `hasPage: true`; cards for the
others should still link but the detail page must handle the placeholder state gracefully.

---

## `/projects/[slug]` — Case study

`generateStaticParams()` from `projects[]`. `generateMetadata()` per project.
404 via `notFound()` for unknown slugs.

Sections, in order:
1. **Hero** — full-bleed project image, title, location, year overlaid or beneath.
2. **Fact strip** — `type · category · area · year · status`, hairline-separated,
   sticky on desktop as you scroll the body.
3. **Overview** — one column, `--fs-lg`, max-width 62ch.
4. **Challenge** — two columns: label left, prose right.
5. **Approach** — same two-column pattern.
6. **Materials** — a plain list, not an icon grid. Each material on its own row with a
   hairline rule.
7. **Timeline** — `timeline[]` entries as `phase · duration · note`, rendered as a
   numbered vertical sequence with M5 stagger.
8. **Gallery** — the `gallery[]` frames in an asymmetric grid, click to open a lightbox.
9. **Next project** — link to the following entry in `projects[]`, wrapping around.

**Placeholder handling:** when a field equals a `"to be confirmed"` string, render it in
`--muted` with the label still visible. Do not hide it, and do not fabricate a value.

---

## `/services` — Five disciplines

**Hero:** eyebrow `Services` · H1 **Five disciplines. One continuous process.** ·
body *ASTHIWAR brings architecture, engineering and execution together through one
coordinated process.*

**Body:** one block per service, each with `id={slug}` so the footer and homepage
deep-links land correctly. Alternate image side (left/right) down the page.

Each block:
- Index number (`01`–`05`) in `--accent` at `--fs-h2`
- Title at `--fs-h2`
- `short` as the lead line at `--fs-lg`
- **Capabilities** — 4 items, hairline-separated list
- **Process** — 4 steps, numbered, e.g. Architecture is
  *Read the site -> Test the section -> Coordinate every system -> Issue buildable information*

The `process` arrays in `site.ts` are unusually good copy. Give them room — they are the
most convincing content on the site.

**Sticky sub-nav:** on `lg+`, a sticky rail listing the five services, highlighting the
one in view (same ScrollTrigger logic as `DisciplinesSticky`).

---

## `/sustainable-construction`

**Hero:** eyebrow `Sustainability` · H1 **Sustainable by design** ·
body *Comfort designed in, before energy is spent.*

**Three pillars**, each a full section, alternating image side:

1. **Natural cooling** — *Comfort begins in plan and section.*
   Designing for the natural flow of air to keep interiors cooler and reduce reliance on
   artificial ventilation.
2. **Low-cement / cement-free construction** — *Ask less material to do more useful work.*
   Exploring lower-carbon construction methods and material choices while maintaining
   structural integrity.
3. **Green building** — Envelope, daylight, water strategy and material impact reviewed
   together rather than certified after the fact.

**Do not** add an icon grid of sustainability badges. The brand doc rejects
"templated sustainability icon grids" and "decorative greenwashing" by name. Type,
photography and honest prose only.

Close with a note on what is not yet claimed — e.g. *ASTHIWAR is expanding its offering
around natural cooling, low-cement and cement-free construction.* Honest framing is on-brand.

---

## `/about` — Studio

Strongest existing copy in the repo. Structure:

1. **Hero** — H1 **A building practice, not a relay race.**
2. **Two ways of seeing / one building** — a two-column spread:
   left *Architecture asks what life needs.* right *Engineering asks what the idea demands.*
   Beneath, spanning both: *The best answer is neither compromise nor excess. It is a
   building whose space and load path feel inevitable together.*
3. **What remains constant** — *Principles strong enough to survive different sites.*
   *The architecture changes. These obligations do not.* Then the principle list.
4. **From first walk to first monsoon** — *Seven stages, with the right question asked at
   each one.* Full version of the seven stages from `03-HOMEPAGE-BLUEPRINT.md` §12, with
   the note *The process is deliberately front-loaded: coordination is cheaper on paper
   than under a poured slab.*
5. **Studio** — photography, location, team (fill in when supplied).
6. **CTA band.**

Motion: this page should be the quietest on the site. M1 on headings, M5 on blocks.
No pinning, no counters.

---

## `/insights`

Index of articles. Category filter row (Architecture · Sustainable Building · Materials ·
Construction · Design · Project Insights). Cards: category, title, date, read time, excerpt.

All six entries are placeholders. Either ship the page with honest
"to be confirmed" cards, or **omit `/insights` from the nav until real content exists** —
recommended. Keep the route so it can be switched on later.

---

## `/contact`

Two columns on `lg+`.

**Left:** H1 **Start a project.** Body *Tell us about your project, your site and what you
want to build.* Then contact details — address, phone, email, hours. These are
`"to be confirmed"` in the old repo and must be filled in before launch.

**Right:** the same form as homepage §17, shared component `<EnquiryForm variant="page">`.

Below: a map or a site photograph. Do not embed a heavy Google Maps iframe on first load —
use a static image that swaps to the interactive map on click.

---

## `/cost-calculator`

See `05-CALCULATOR-SPEC.md`.

---

## `/admin` — Phase 1: UI shell only

No authentication, no backend, mocked data. The point is to have the screens designed and
navigable so Phase 2 only has to wire them up.

Screens to build, mirroring the old repo's components:

| Screen | Content (mocked) |
|---|---|
| Overview | KPI tiles: enquiries this month, estimates generated, average estimate value, conversion. One chart. |
| Enquiries | Table: name, phone, email, location, source, date, status. Row detail drawer. |
| Estimates | Table: estimate ID (`EST-2026-XXXXXX`), client, area, package, total, date. Detail view showing the full breakdown. |
| Pricing config | Editable package rates and add-on prices. **Phase 1: local state only, with a clear "not persisted" banner.** |
| Notifications | List of templated notifications. |
| Audit logs | Read-only event list. |

Layout: left sidebar nav, top bar with page title. Use `--surface` for the app chrome so
it reads as a tool, not as marketing. Keep the same type tokens.

`/admin` must be `noindex`. Add `export const metadata = { robots: { index: false } }`.

---

## Cross-page requirements

- **Metadata:** every page exports `metadata` with title, description, `openGraph`, and
  `alternates.canonical`. Copy the pattern from the old repo's `src/app/page.tsx`.
- **JSON-LD:** Organization on the root layout, FAQPage on the homepage, and
  BreadcrumbList on project detail pages. Port `src/lib/jsonld.ts` and `JsonLd.tsx`.
- **`sitemap.ts`** and **`robots.ts`** in `src/app/` — exclude `/admin`.
- **Error handling:** `error.tsx` and `not-found.tsx` styled to match, not Next.js defaults.
- **Loading:** `loading.tsx` for the calculator route only; everything else is static.
