# 03 â€” Homepage Blueprint

The homepage is the whole product. 19 sections, in this order, matching Novascape's
scroll narrative beat for beat.

Heights below are Novascape's **measured** heights at an 800px-wide viewport â€” use them
as *proportion guidance* (which sections are tall, which are breathers), not absolutes.

| # | Novascape section | Height | ASTHIWAR section | Component |
|---|---|---|---|---|
| 00 | Navbar | fixed | Navbar | `SiteHeader` |
| 01 | Hero â€” "Airscape Living" | 1118 | Hero â€” the practice | `Hero` |
| 02 | USP marquee | 184 | Principles marquee | `PrinciplesMarquee` |
| 03 | Philosophy + counters | 478 | Philosophy + counters | `PhilosophyCounters` |
| 04 | Uptown Pricing | 392 | Indicative build cost | `CostTeaser` |
| 05 | "What Makes Your Home Breathe?" 6 cards | 2400 | "What Makes a Building Last?" 6 cards | `LastingCards` |
| 06 | Orange welcome block | 1171 | Accent interlude â€” the practice | `PracticeInterlude` |
| 07 | Blur "Click to discover" | 731 | Relay race vs one process | `ProcessReveal` |
| 08 | Amenities sticky list | 1082 | The five disciplines | `DisciplinesSticky` |
| 09 | Location counters | 1075 | Where we build | `CoverageCounters` |
| 10 | "Being Here Means Being Near" | 646 | What one process covers | `ScopeColumns` |
| 11 | Nature & landscaping (orange) | 687 | Sustainable construction | `SustainabilityInterlude` |
| 12 | Master plan legend | 940 | Seven stages | `ProcessStages` |
| 13 | Video embed | lazy | **300-frame scroll sequence** | `BuildSequence` |
| 14 | FAQ accordion | 823 | FAQ accordion | `Faq` |
| 15 | Gallery grid | 576 | Selected work | `WorkGallery` |
| 16 | Blog & articles | â€” | Insights | `InsightsStrip` |
| 17 | Contact form | 717 | Start a project | `EnquiryForm` |
| 18 | Footer | 433 | Footer | `SiteFooter` |

---

## 00 Â· Navbar â€” `SiteHeader`

**Novascape:** fixed bar. Left: hamburger icon + word "Menu". Centre: two logos side by
side (company + project). Right: `Contact` pill button in accent. Full-screen overlay on menu click.

**ASTHIWAR:**
- Left: hamburger + "Menu" (mobile & tablet) â€” on `lg+` also show inline links.
- Centre: `asthiwar-logo-black.png`, links to `/`.
- Right: `Contact` pill (`variant="primary"`), links to `/contact`.
- Inline links on `lg+`: **Projects Â· Cost Â· Services Â· Studio**.
- Overlay: full-screen, `--surface` background, links at `--fs-h2`, staggered in
  (M5, `stagger: 0.06`), plus phone/email and social links at the bottom.
- Behaviour: transparent over the hero, gains a `--bg` fill + `--hairline` bottom border
  after 80px of scroll. Hides on scroll-down, reappears on scroll-up.

**Acceptance:** Escape closes the overlay; focus is trapped while open; body scroll locks.

---

## 01 Â· Hero â€” `Hero`

**Novascape:** H1 at 56/56/600 with per-letter GSAP SplitText reveal. Sub-line, one
primary CTA, one large hero image (balloons lifting a house). Vertical rhythm heavy at the top.

**ASTHIWAR copy â€” pick one:**

> **A (recommended)**
> **A building practice, not a relay race.**
> Architecture, engineering and construction in Coimbatore â€” coordinated through one
> process, from the first site walk to the first monsoon.

> **B**
> **Five disciplines. One continuous process.**
> Architecture, interior, construction, structural engineering and green building,
> brought together under one roof in Tamil Nadu.

> **C**
> **Designed for the climate it stands in.**
> Comfort designed in, before energy is spent.

**Layout:** centred heading, max-width ~18ch on the H1. Sub-line at `--fs-lg`, colour
`--body`, max-width 56ch. Two CTAs: `Start a project` (primary) + `Estimate your build`
(ghost, to `/cost-calculator`). Below: full-bleed image, `aspect-[16/9]` on desktop,
`aspect-[4/5]` on mobile.

**Image:** use a real ASTHIWAR project photograph â€” deep shade, warm material, precise
structural lines. **Not** a rendered illustration. If none is available yet, use
`frames/frame-001.jpg`.

**Motion:** M1 on the H1 (chars, stagger 0.02). M5 on sub-line + CTAs, delayed 0.4s.
Image: `scale: 1.06 -> 1` over 1.4s, plus a subtle parallax `yPercent: -8` on scroll.

---

## 02 Â· Principles marquee â€” `PrinciplesMarquee`

**Novascape:** thin strip, 5 items repeating: Natural Airflow Â· Natural Light Â· More
Space Â· Less Noise Â· More Privacy. Each item = small icon + 16/19.2/500 label.
Hairline border top and bottom.

**ASTHIWAR items (5, to match):**
1. Natural Cooling
2. Low-Cement Building
3. Structural Clarity
4. Coordinated Delivery
5. Transparent Cost

**Layout:** `border-block: 1px solid var(--hairline)`, `padding-block: var(--s-4)`.
Items separated by a small square dot or a 1px vertical rule. Inline SVG icons, 20px,
`stroke: currentColor`.

**Motion:** M4. Speed 24s per loop. Pause on hover and on focus-within.

**Acceptance:** no visible seam at the loop point; the strip is `aria-hidden` decorative
if the same words appear elsewhere, otherwise it is a real `<ul>`.

---

## 03 Â· Philosophy + counters â€” `PhilosophyCounters`

**Novascape:** a paragraph of philosophy, a CTA, then a row of odometer counters:
`3 Sided Ventilation` Â· `58% Daylight Reach` Â· `0 Shared Walls` Â· `25% Larger Bedrooms`.

**ASTHIWAR:**

Heading (H2): **One process, end to end.**

Body: *Architecture, interior, construction, structural engineering and green building
are brought together through one coordinated process. The process is deliberately
front-loaded â€” coordination is cheaper on paper than under a poured slab.*

CTA: `How we work` -> `/about`

**Counters (4, exactly mirroring Novascape's shape):**

| Value | Label |
|---|---|
| `5` | Disciplines |
| `1` | Continuous process |
| `7` | Stages, first walk to handover |
| `0` | Handoffs between teams |

> `0 Handoffs` is the direct analogue of Novascape's `0 Shared Walls` â€” the same
> rhetorical move, applied to process instead of walls. Keep it.

**Motion:** M2 odometer. Digit columns roll from 9 down to the target value.
Column stagger 0.08s. Number colour `--accent`, label `--body` at `--fs-sm` uppercase
with `letter-spacing: 0.08em`.

---

## 04 Â· Indicative build cost â€” `CostTeaser`

**Novascape:** sticky left column holds the section title; right column lists 2 BHK
`Starts from 79 L*` and 3 BHK `Starts from 1.10 Cr*`, with two lines of small-print
disclaimer and a CTA.

**ASTHIWAR:** same layout, four package tiers.

Left (sticky): H2 **Indicative build cost** + body *Rates are per square foot of built-up
area. Final cost depends on design, specification, site conditions and materials.*

Right: four rows, each `border-block-end: 1px solid var(--hairline)`:

| Package | Rate |
|---|---|
| Basic | from â‚¹2,099 / sqft |
| Standard | from â‚¹2,468 / sqft |
| Premium | from â‚¹2,899 / sqft |
| Luxury | from â‚¹3,250 / sqft |

Small print (`--fs-xs`, `--muted`):
`*Indicative only. Not a quotation. Rates subject to change.`
`*Government charges, statutory approvals and taxes as applicable.`

CTA: `Get your estimate` -> `/cost-calculator` (primary).

**Motion:** left column `position: sticky; top: 20vh`. Rows stagger in with M5.
Rate figures use M2 odometer on the rupee number.

---

## 05 Â· What makes a building last â€” `LastingCards`

**Novascape:** the tallest section on the page (2400px) â€” six cards
(`card-1` â€¦ `card-6`), each icon + title + description, revealed as you scroll.

**ASTHIWAR â€” six cards:**

1. **Read the site first** â€” Orientation, wind, shade and drainage are settled before a
   single wall is drawn. Comfort begins in plan and section.
2. **One load path** â€” Architecture asks what life needs; engineering asks what the idea
   demands. The grid is simplified until both answers agree.
3. **Detail before pour** â€” Critical junctions are drawn and prototyped on paper.
   Coordination is cheaper on paper than under a poured slab.
4. **Material honesty** â€” Lime plaster, exposed masonry, engineered timber. Finishes are
   the material, not a coating over it.
5. **Ask less of the material** â€” Low-cement and cement-free methods where the structure
   allows, without trading away structural integrity.
6. **Recorded, not remembered** â€” Progress, quality checks and site decisions are written
   down and handed over with the building.

**Layout:** 3 columns on `xl`, 2 on `md`, 1 on mobile. Each card: inline SVG icon (28px,
`--accent`), H3 title at `--fs-h4`, body at `--fs-sm` / `--body`. Card has a
`--hairline` border and generous internal padding (`--s-5`). No shadow, no radius.

**Motion (choose one):**
- **Simple:** M5 grid stagger (0.08s). Safe, fast to build.
- **Novascape-faithful:** M6 pinned card stack â€” pin the section for ~200vh, cards
  translate up and scale from `0.94 -> 1` as scroll scrubs. Only attempt this after
  M1â€“M5 are working. On `< lg`, always fall back to the simple grid.

---

## 06 Â· Accent interlude â€” the practice â€” `PracticeInterlude`

**Novascape:** full-bleed orange section, an image floated to one side, a long
paragraph of project introduction in white, and a white CTA button ("View Brochure").

**ASTHIWAR:**

`background: var(--accent)`, text `--on-accent`. Full-bleed, no container border.

Image left (40%), copy right (60%) on `lg+`; stacked on mobile.

Copy: *ASTHIWAR is a design-and-build practice working across Coimbatore and Tamil Nadu.
Architecture, engineering and execution are not handed between firms â€” they are held by
one team, through one process, from the first site walk to the first monsoon.*

*The result is a building whose space and load path feel inevitable together â€” and a
client who never has to translate between three sets of drawings.*

CTA: `Meet the studio` -> `/about`, `variant="white"` (white fill, accent text).

**Motion:** M1 on the paragraph's first line; M5 on the image with a slow parallax.

---

## 07 Â· Relay race vs one process â€” `ProcessReveal`

**Novascape:** a blurred image with a "Click to discover" prompt, revealing a comparison.

**ASTHIWAR:** an interactive comparison of the conventional split-contract route against
ASTHIWAR's single-process route.

Two panels, side by side on `lg+`:

| Conventional | ASTHIWAR |
|---|---|
| Architect, engineer and contractor engaged separately | One team, one contract |
| Drawings translated three times | One drawing set, coordinated once |
| Cost discovered at tender | Cost modelled from the first sketch |
| Site problems become disputes | Site problems become decisions |
| Nobody owns the outcome | One party is accountable at handover |

Implementation options, easiest first:
1. **Two static columns** with the ASTHIWAR side in `--accent` â€” ships in an hour.
2. **Blur-to-reveal** (Novascape's actual pattern): ASTHIWAR panel starts
   `filter: blur(14px)` + `opacity: 0.5` with a `Click to discover` label; on click or on
   scroll-into-view, animate to `blur(0)` / `opacity: 1` over 0.8s.
3. **Draggable split slider** â€” a vertical handle wiping between the two. Nicest, most work.

Pick (2) to match the reference.

---

## 08 Â· The five disciplines â€” `DisciplinesSticky`

**The single best 1:1 mapping on the page.** Novascape's amenities section is a sticky
numbered list (`_01` â€¦ `_05`) of five items with an image that swaps as you move through
them. ASTHIWAR has exactly five services.

**Left column (sticky, `top: 22vh`):**

| # | Title | One-liner |
|---|---|---|
| 01 | Architecture | Designing spaces with clarity, context and purpose. |
| 02 | Interior | Crafting interiors that elevate everyday experiences. |
| 03 | Construction | Precise execution with quality and transparency. |
| 04 | Structural | Engineering-led solutions built for lasting strength. |
| 05 | Green Building | Sustainable methods for healthier spaces. |

**Right column:** stacked images, one per discipline, cross-fading on the active index.

Section header above: eyebrow `Services`, H2 **Five disciplines. One continuous process.**,
body *Architecture, interior, construction, structural engineering and green building
brought together through one coordinated process.*

**Interaction:** the active item is driven by scroll position (ScrollTrigger, one trigger
per row) on desktop, and by tap on mobile. Active row: `--ink` text + `--accent` index
number + a `--accent` left rule. Inactive rows: `--muted`.

Each row links to `/services#architecture` etc.

**Mobile:** collapse to a vertical list where each item shows its own image beneath it â€”
no stickiness below `lg`.

---

## 09 Â· Where we build â€” `CoverageCounters`

**Novascape:** "You're Home, Just A Walk Away From Chil Sez!" with odometer counters â€”
`7+ Work Hubs`, `8+ Institutions`, `5+ Hospitals`, `City Connectivity`, `More Life / Less Commute`.

**ASTHIWAR:**

H2: **Built across Tamil Nadu.**
Body: *ASTHIWAR works from Coimbatore, with projects and site supervision across the
western and central districts.*

**Counters:**

| Value | Label |
|---|---|
| `7` | Cities served |
| `5` | Disciplines in-house |
| `1` | Point of accountability |

**Location list** beneath, as a simple wrapped row of `--hairline`-bordered pills:
Coimbatore Â· Chennai Â· Madurai Â· Tiruppur Â· Erode Â· Pollachi Â· Salem

(These are the seven locations already configured in the cost calculator â€” keep them in
sync via `src/data/pricing.ts`.)

**Motion:** M2 counters, M5 stagger on the pills.

---

## 10 Â· What one process covers â€” `ScopeColumns`

**Novascape:** "Being Here Means Being Near" â€” four category lists (School/College, IT
Parks, Leisure, Healthcare), each a list of names with a travel time in brackets.
Columns on desktop, accordion on mobile.

**ASTHIWAR:** four columns, drawn straight from the services' `capabilities` arrays.

**Design**
- Site and climate analysis
- Concept and spatial planning
- Space planning and material strategy
- Custom joinery and lighting

**Engineering**
- Structural concept design
- Analysis and detailing
- Existing-building assessment
- Site review and consulting

**Execution**
- Pre-construction planning
- Site execution
- Quality and progress records
- Commissioning and handover

**Sustainability**
- Passive design studies
- Envelope and daylight review
- Water strategy
- Material impact review

**Layout:** background image behind (Novascape uses `.bg-image` here) with a light
scrim so text stays legible â€” use a site/construction photograph at low opacity, or
`--surface` if no suitable image exists. 4 columns on `xl`, 2 on `md`, accordion on mobile.

CTA below: `See all services` -> `/services`.

---

## 11 Â· Sustainable construction â€” `SustainabilityInterlude`

**Novascape:** second full-bleed orange block ("Nature and Landscaping"), centred title,
image plus copy.

**ASTHIWAR:** `background: var(--accent)`, centred H2.

H2: **Comfort designed in, before energy is spent.**

Body: *Natural cooling, low-cement and cement-free construction, and green-building
methods are treated as structural decisions, not add-ons. The aim is to ask less material
to do more useful work â€” and to reduce what the building needs from a machine.*

Three short items in a row (no icon grid â€” ASTHIWAR's brand doc explicitly rejects
templated sustainability icon grids; use type only, with a `--hairline` rule between):

1. **Natural cooling** â€” Designing for airflow so interiors stay cooler with less
   mechanical ventilation.
2. **Low-cement / cement-free** â€” Lower-carbon methods and materials, without trading
   structural integrity.
3. **Green building** â€” Envelope, daylight, water and material impact reviewed together.

CTA: `Sustainable construction` -> `/sustainable-construction`, `variant="white"`.

---

## 12 Â· Seven stages â€” `ProcessStages`

**Novascape:** master-plan section â€” a numbered legend (1. Arrival Court, 2. Security
Pavilion â€¦ 9. Reflexology Walkway, plus a Terrace sub-list) beside a large plan image,
with a `View Floor Plan` CTA.

**ASTHIWAR:** the seven-stage build process, numbered exactly the same way, against a
section drawing or an assembly image.

Eyebrow: `Process` Â· H2: **From first walk to first monsoon**
Body: *Seven stages, with the right question asked at each one.*

1. **Site walk** â€” What does this piece of land already tell us?
2. **Brief and feasibility** â€” What does life here actually need?
3. **Concept and section** â€” Where do light, air and load want to go?
4. **Coordinated drawings** â€” Does every system agree with every other?
5. **Costing and approvals** â€” What does this really cost, and what will be permitted?
6. **Construction** â€” Is what we drew what is being built?
7. **Handover and first monsoon** â€” Does it perform in the season that tests it?

**Layout:** numbered list left (or right), large image opposite. Numbers in `--accent` at
`--fs-h3`, titles at `--fs-h4`, body at `--fs-sm`.

**Image:** use `assembly-layers/*.webp` composited, or a project section drawing.

CTA: `The full process` -> `/about`.

**Motion:** M5 stagger down the list; the image cross-fades between assembly layers as
each stage scrolls into view (reuse the logic in the old repo's `LayeredAssemblySequence.tsx`).

---

## 13 Â· Build sequence â€” `BuildSequence`

**Novascape:** a lazy video embed titled "The Breathing Layout". It is the weakest
section on their page.

**ASTHIWAR:** replace it with the **300-frame scroll-driven sequence** already sitting in
`asthiwar-v1-main/web/public/frames/`. This is the section that will beat the reference.

- Pin a `100vh` canvas for ~300vh of scroll.
- Preload frames into an off-screen `Image[]`; draw the frame matching scroll progress
  onto a `<canvas>` sized with `devicePixelRatio`.
- Overlay 3â€“4 short captions that fade in at set progress points (0.15, 0.45, 0.75).
- Port the logic from the old repo's `ScrollFrameSequence.tsx`.

Heading (overlaid, `--on-accent` or white with a scrim): **One building, one sequence.**

**Performance:** convert the 300 JPGs to WebP; target under 60KB each. Show the first
frame as a static poster until decode completes. **Below `lg`, or under reduced motion,
render a single still frame and skip the pin entirely.**

---

## 14 Â· FAQ â€” `Faq`

**Novascape:** sticky left title, accordion right, 18 questions with a `View Moreâ€¦`
control after the first batch. Small intro line above the accordion.

**ASTHIWAR:** the 6 existing FAQs from `site.ts`, expandable to more as content lands.

Left (sticky): H2 **Frequently asked questions** + a line of intro copy.

Accordion items:
1. How does the design-build process work?
2. What factors affect construction cost?
3. Can ASTHIWAR handle architecture and construction together?
4. What sustainable construction options are available?
5. How accurate is the cost calculator?
6. How do I start a project with ASTHIWAR?

(Answers are already written in `asthiwar-v1-main/web/src/data/site.ts` â€” copy them verbatim.)

**Behaviour:** first item open by default; `+` icon rotates 45Â° to `x`; GSAP height
animation 0.4s `power2.inOut`. Show 6, then `View more` if the list grows past 6.

**SEO:** emit FAQPage JSON-LD (the old repo has `getFaqJsonLd()` in `src/lib/jsonld.ts` â€” port it).

---

## 15 Â· Selected work â€” `WorkGallery`

**Novascape:** "You Could Be Living Here!" â€” two stacked gallery grids of six images each.

**ASTHIWAR:** eyebrow `Work` Â· H2 **Selected work**

Asymmetric grid of 6 project images. Each tile links to `/projects/[slug]`. On hover:
image scales to 1.04, a `--hairline` caption bar slides up showing title + location + year.

While project data is unconfirmed, tiles read `Project 01` â€¦ `Project 04` with
`Location to be confirmed` â€” **do not invent names**.

CTA: `All projects` -> `/projects`.

**Motion:** M5 stagger, 0.08s, alternating y-offsets for a masonry feel.

---

## 16 Â· Insights â€” `InsightsStrip`

**Novascape:** a "Blog & Articles" section that currently renders empty.

**ASTHIWAR:** three article cards in a row â€” category label, title, date, read time.
Six placeholders exist in `site.ts` across Architecture, Sustainable Building, Materials,
Construction, Design and Project Insights.

If no real articles exist at launch, **hide this section entirely** rather than shipping
six "to be confirmed" cards. Gate it: `{insights.some(i => i.published) && <InsightsStrip />}`.

CTA: `All insights` -> `/insights`.

---

## 17 Â· Start a project â€” `EnquiryForm`

**Novascape:** "Let's Get You A Breathing Home" over a CRM-embedded form:
Name Â· Email Â· Phone Â· Comments.

**ASTHIWAR:**

H2: **Tell us about your project.**
Body: *Your site, what you want to build, and where you are in the process.*

Fields:
- Name (required, min 2)
- Phone (required, `^[6-9]\d{9}$`)
- Email (required, RFC-ish)
- Location (select: the 7 cities from `pricing.ts`, plus "Other")
- Project type (select: New build Â· Interior Â· Renovation Â· Not sure yet)
- Message (optional textarea)

**Phase 1:** `onSubmit` calls `submitEnquiry()` in `src/lib/api.ts`, which logs and
resolves after a simulated delay, then shows a success state. Phase 2 swaps only that
function body.

Inline validation on blur, helper text under the field, submit disabled until valid.
Success state replaces the form with a confirmation, not an alert.

---

## 18 Â· Footer â€” `SiteFooter`

**Novascape:** logo, social icons, RERA number, Head Office address, Contact block,
second office, `Download Brochure` + `Book a Site Visit` CTAs, copyright, T&C, Privacy.

**ASTHIWAR:**

Row 1 â€” CTA band: **Have a site in mind?** + `Start a project` button.

Row 2 â€” four columns:
- `asthiwar-logo-white.png` + one-line positioning + social icons
- **Navigate:** Projects Â· Cost Â· Services Â· Studio Â· Insights
- **Services:** Architecture Â· Interior Â· Construction Â· Structural Â· Green Building
  (each deep-linking to `/services#slug`)
- **Contact:** address, phone, email â€” *currently "to be confirmed" in the old repo; fill
  these in before launch*

Row 3 â€” `Â© 2026 ASTHIWAR Design & Build` Â· Terms Â· Privacy.

Background `--ink`, text `--on-accent`/white, hairlines at 15% white.

---

## Homepage assembly

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <>
      <Hero />
      <PrinciplesMarquee />
      <PhilosophyCounters />
      <CostTeaser />
      <LastingCards />
      <PracticeInterlude />
      <ProcessReveal />
      <DisciplinesSticky />
      <CoverageCounters />
      <ScopeColumns />
      <SustainabilityInterlude />
      <ProcessStages />
      <BuildSequence />
      <Faq />
      <WorkGallery />
      {/* <InsightsStrip /> â€” enable when real articles exist */}
      <EnquiryForm />
    </>
  );
}
```

Header and footer live in `app/layout.tsx`.

**Rhythm check:** alternate white sections with the two `--accent` interludes (06 and 11)
and the dark footer. Novascape's page breathes because roughly every fourth section
changes ground colour. If your build feels flat, that is the reason.
