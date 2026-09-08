# 06 â€” Build Prompts (agent-agnostic, skill-wired)

Copy-paste sequence for **Claude Code, Codex, Antigravity, Cursor, Gemini or ChatGPT**.
Run in order. Each prompt assumes the previous one landed.

You have 24 skills installed at `C:\Users\sunda\.agents\skills\`. This file wires the
relevant ones into the phases where they earn their keep â€” and, just as importantly,
says where **not** to load them.

---

# 0 Â· Setup

## 0.1 Where your skills live

| Agent | Reads from | Status |
|---|---|---|
| Claude Code | `~/.claude/skills/` | **empty â€” must be linked** |
| Codex | `~/.codex/skills/` | has `frontend-design` + system skills |
| Cursor | `~/.cursor/skills-cursor/` | has 24 Cursor built-ins |
| Antigravity | `~/.gemini/antigravity/builtin/skills/` | has 5 built-ins |
| Shared pool | `~/.agents/skills/` | **your 24 installed skills** |

Sources, per `~/.agents/.skill-lock.json`: `Leonxlnx/taste-skill` (13),
`vercel-labs/agent-skills` (9), `pbakaus/impeccable` (1), `vercel-labs/skills` (1).

## 0.2 Make them visible

**Claude Code** â€” the directory doesn't exist yet, so one junction takes the whole set:

```bash
cmd //c mklink /J "C:\Users\sunda\.claude\skills" "C:\Users\sunda\.agents\skills"
```

**Project-local** â€” `impeccable` calls `node .agents/skills/impeccable/scripts/context.mjs`
on a path relative to the project root, so it needs this one or it will not run:

```bash
cmd //c mklink /J "C:\Users\sunda\Desktop\Rework-asthivar-demo-ui-sample-testing-v1\.agents\skills" "C:\Users\sunda\.agents\skills"
```

**Codex / Cursor** â€” those directories already have content, so link per skill instead:

```bash
for s in full-output-enforcement gpt-taste design-taste-frontend redesign-existing-projects web-design-guidelines impeccable; do
  cmd //c mklink /J "C:\Users\sunda\.codex\skills\\$s" "C:\Users\sunda\.agents\skills\\$s"
done
```

Skills load at session start â€” **restart the agent** after linking.

## 0.3 The invocation that works everywhere

Not every agent supports skills. This line does, in all of them:

```
Read C:\Users\sunda\.agents\skills\<name>\SKILL.md in full and follow it for this task.
```

Every prompt below carries a `SKILLS:` block with both forms. Use whichever your agent
supports. If it supports neither, paste the SKILL.md contents inline.

---

# 1 Â· Skill roster for this build

| Phase | Skill | What it contributes |
|---|---|---|
| **All** | `full-output-enforcement` | Bans `// rest of code`, `// TODO`, "for brevity", skeleton output. The single highest-value skill here. |
| P0â€“P2 | `design-taste-frontend` | Brief inference from a reference URL, audit-first redesign posture, pre-flight check |
| P1 | `gpt-taste` | GSAP ScrollTrigger paradigms â€” pinning, stacking, scrubbing. **Scoped, see Â§2** |
| P3â€“P4 | `impeccable` | Forms, empty states, dashboards, error states, tokens. Needs `PRODUCT.md`. |
| P5 | `redesign-existing-projects` | Audits for generic AI patterns |
| P5 | `web-design-guidelines` | Web Interface Guidelines / accessibility review. Takes a file pattern. |
| P5 | `vercel-react-best-practices` | React + Next.js performance (76 reference files) |
| P5 | `vercel-optimize` | Deployed-app cost and performance (156 reference files) |
| Assets | `imagegen-frontend-web`, `brandkit` | Placeholder project imagery until real photography lands |
| Docs | `writing-guidelines` | Prose review |
| Deploy | `deploy-to-vercel`, `vercel-cli-with-tokens` | Shipping |

---

# 2 Â· Conflict rules â€” read before loading anything

Several of these skills are **built to prevent reproduction**. That is the opposite of
this project, which is a deliberate, faithful rebuild of a specific reference site.

### Scope these, don't just load them

**`gpt-taste`** mandates "Python-driven true randomization" of hero architecture, type
stack and component layout, and states you are *"forbidden from defaulting to the same UI
twice"*. Loaded naively it will randomise away the Novascape structure you are trying to
match.

> **Scope:** load it for **GSAP motion only** â€” its ScrollTrigger pinning, stacking and
> scrubbing paradigms map directly onto motion patterns M3 and M6. Ignore its
> randomization mandate, hero-architecture selection and layout variance rules. Layout
> comes from `03-HOMEPAGE-BLUEPRINT.md`, full stop.
>
> Useful alignment: it bans Inter and mandates **Satoshi**, Cabinet Grotesk, Outfit or
> Geist. Satoshi is already our typeface, so that rule reinforces the plan.

**`high-end-visual-design`** carries a "Variance Mandate: NEVER generate the exact same
layout or aesthetic twice in a row."

> **Scope:** spacing, depth and micro-interaction quality only. Or skip it â€” most of what
> it offers is already fixed by `02-DESIGN-SYSTEM.md`.

### Do not load these at all

`minimalist-ui` Â· `industrial-brutalist-ui` Â· `stitch-design-taste` Â· `design-taste-frontend-v1`

They are **alternative aesthetic directions**. Loading one overrides the Novascape
direction entirely. `minimalist-ui` mandates warm monochrome and flat bento grids;
`industrial-brutalist-ui` mandates rigid grids and extreme type contrast. Neither is what
you asked for.

### One dependency

`impeccable` runs a setup script that halts with `NO_PRODUCT_MD` if the project has no
`PRODUCT.md`. The old repo has one at `asthiwar-v1-main/web/PRODUCT.md` â€” copy it to the
new project root before Phase 3, or `impeccable` will stop before doing any work.

```bash
cp "C:/Users/sunda/Desktop/Asthivar/asthiwar-v1-main/web/PRODUCT.md" "C:/Users/sunda/Desktop/Rework-asthivar-demo-ui-sample-testing-v1/PRODUCT.md"
```

### The precedence order

When a skill and a project doc disagree, this is the tiebreak:

```
1. 02-DESIGN-SYSTEM.md and 03-HOMEPAGE-BLUEPRINT.md   (tokens, layout, motion, copy)
2. .agents/rules/asthiwar-project.md                   (the 24 project rules)
3. The loaded skill                                    (craft and technique)
4. The agent's own defaults                            (last)
```

Put that block in any prompt where a skill starts overriding the plan.

---

# 3 Â· How to run these

1. **New chat per phase.** Long chats drift.
2. Paste `02-DESIGN-SYSTEM.md` at the top of every new chat. It is the anti-drift anchor.
3. Load the prompt's `SKILLS:` block.
4. Paste the prompt, then the doc it names.
5. Keep the `[GUARDRAIL]` block. Even with `full-output-enforcement` loaded â€” belt and braces.

```
[GUARDRAIL]
- Use ONLY the CSS variables from globals.css. Never write a raw hex value.
- Use ONLY motion patterns M1-M6 from the design system. Do not invent easing curves.
- Border radius is 0 except pill buttons. No shadows, no gradients, no glassmorphism.
- Every GSAP effect must early-return under prefers-reduced-motion and render the
  final state statically.
- Do not install packages beyond: next, react, typescript, tailwindcss, gsap, lenis.
- Do not invent project names, dates, prices, addresses or client details. If a value
  is unknown, render the literal string "To be confirmed".
- TypeScript strict. No `any`. No `@ts-ignore`.
- Output complete files with their full path. No snippets, no "// rest unchanged".
```

---

# PHASE 0 â€” Foundation

```
SKILLS:
  Skill-aware agent:  full-output-enforcement, design-taste-frontend
  Any agent:          Read these in full and follow them:
                      C:\Users\sunda\.agents\skills\full-output-enforcement\SKILL.md
                      C:\Users\sunda\.agents\skills\design-taste-frontend\SKILL.md
  SCOPE: design-taste-frontend â€” use its BRIEF INFERENCE section with
         https://www.novascape.in as the reference signal and "redesign: preserve"
         as the posture. Do not let it propose an alternative direction.
```

### Prompt 01 Â· Scaffold and tokens

```
I am building a Next.js 16 site. Set up the foundation.

1. Assume `create-next-app` has run with: TypeScript, Tailwind CSS v4, App Router,
   ESLint, src/ directory, import alias "@/*".
2. Write `src/app/globals.css` EXACTLY as specified in the design system doc I pasted
   above â€” all CSS custom properties, the three Satoshi @font-face blocks, base
   element styles, focus-visible, and the prefers-reduced-motion block.
3. Write `src/lib/gsap.ts` â€” register ScrollTrigger and SplitText, set gsap.defaults
   to { ease: 'power3.out', duration: 0.9 }, export a REDUCED() helper.
4. Write `src/components/layout/SmoothScroll.tsx` â€” Lenis wired to the GSAP
   ticker and ScrollTrigger.update, skipped entirely under reduced motion, cleaned up
   on unmount.
5. Write `src/app/layout.tsx` â€” html lang="en", SmoothScroll wrapper, a skip-to-content
   link, and slots for <SiteHeader /> and <SiteFooter />.

The tokens in globals.css are fixed and take precedence over any skill's palette or
type recommendations.

[GUARDRAIL]
```

### Prompt 02 Â· UI primitives

```
Build the shared UI primitives in `src/components/ui/`. One file each.

- Button.tsx      variant: 'primary' | 'ghost' | 'white'. Pill shape. Renders <Link>
                  when `href` is given, else <button>. Includes Novascape's hover
                  effect: a solid colour block that slides up from translateY(101%)
                  to 0 over 0.4s while the label colour inverts.
- SplitHeading.tsx  motion M1. Props: as ('h1'|'h2'), children (string), delay?.
                  GSAP SplitText into chars, animate y:100% + opacity:0 -> 0/1,
                  stagger 0.02, trigger 'top 85%'. Under reduced motion render plain text.
- Marquee.tsx     motion M4. Props: items ({icon, label}[]), speed (default 24).
                  Duplicate the track internally for a seamless loop. Pause on hover
                  and focus-within.
- Odometer.tsx    motion M2. Props: value (number), suffix?, label, sublabel?.
                  Render one vertical digit column per digit; each column is 0-9
                  stacked; animate yPercent to the target. Column stagger 0.08,
                  duration 1.4, ease power4.out, fires once at 'top 80%'.
- Accordion.tsx   Props: items ({q,a}[]), initialOpen?, showMoreAfter?.
                  GSAP height animation 0.4s power2.inOut. The + icon rotates 45deg.
                  Full keyboard support and correct aria-expanded / aria-controls.
- SectionHeader.tsx  Props: eyebrow?, title, body?, align?.
- Section.tsx     Wrapper applying --section-y padding and a container width variant
                  ('regular' | 'large' | 'small').

[GUARDRAIL]
```

### Prompt 03 Â· Header and footer

```
Build `src/components/layout/SiteHeader.tsx`, `MenuOverlay.tsx` and `SiteFooter.tsx`.

Header: fixed. Left = hamburger icon + the word "Menu" (below lg) and inline links
Projects / Cost / Services / Studio (lg and up). Centre = ASTHIWAR logo linking to /.
Right = a "Contact" pill button (Button variant primary) to /contact.
Transparent over the hero; after 80px of scroll it gains a --bg fill and a --hairline
bottom border. Hides on scroll down, reappears on scroll up.

MenuOverlay: full-screen, --surface background, links at --fs-h2 staggering in
(motion M5, stagger 0.06). Escape closes it, focus is trapped while open, body scroll
locks, and focus returns to the trigger on close.

Footer: --ink background, white text, hairlines at 15% white.
Row 1 = CTA band: "Have a site in mind?" + a Start a project button.
Row 2 = four columns: brand + socials / Navigate / Services (deep links to
/services#slug) / Contact (render "To be confirmed" for address, phone and email).
Row 3 = "(c) 2026 ASTHIWAR Design & Build", Terms, Privacy.

I have also pasted 04-PAGE-SPECS.md for the nav structure.

[GUARDRAIL]
```

**Gate:** a blank page scrolls smoothly with the right type and colour. Fix drift now.

---

# PHASE 1 â€” Homepage

```
SKILLS:
  Skill-aware agent:  full-output-enforcement, gpt-taste
  Any agent:          Read these in full and follow them:
                      C:\Users\sunda\.agents\skills\full-output-enforcement\SKILL.md
                      C:\Users\sunda\.agents\skills\gpt-taste\SKILL.md
  SCOPE â€” gpt-taste, mandatory:
    USE its GSAP sections: ScrollTrigger pinning, stacking, scrubbing, and its
    ban on Inter (we use Satoshi, which it explicitly permits).
    IGNORE its Python randomization, hero-architecture selection, layout variance
    and "never the same UI twice" mandate. This is a deliberate reproduction of a
    specific reference site. Layout comes from 03-HOMEPAGE-BLUEPRINT.md only.
  PRECEDENCE: design system doc > blueprint > project rules > skill > your defaults.
```

> Paste `03-HOMEPAGE-BLUEPRINT.md` with every prompt in this phase.
> Two or three sections per prompt, never more.

### Prompt 04 Â· Hero + marquee

```
Build homepage sections 01 and 02 from the blueprint: `src/components/home/Hero.tsx`
and `PrinciplesMarquee.tsx`.

Hero uses copy option A. Use SplitHeading for the H1, Button for both CTAs, and give
the hero image a scale 1.06 -> 1 entrance plus a subtle yPercent:-8 scroll parallax.
Use /frames/frame-001.jpg as the placeholder image.

PrinciplesMarquee uses the Marquee primitive with the five ASTHIWAR principles and
simple inline stroke SVG icons at 20px. Hairline borders top and bottom.

Also create `src/data/home.ts` and put all copy strings there â€” no hardcoded copy in
components.

[GUARDRAIL]
```

### Prompt 05 Â· Counters + cost teaser

```
Build sections 03 (PhilosophyCounters) and 04 (CostTeaser) from the blueprint.

PhilosophyCounters: heading, body, CTA, and a row of four Odometer components
(5 Disciplines / 1 Continuous process / 7 Stages / 0 Handoffs).

CostTeaser: two-column. Left column is position: sticky, top: 20vh, holding the H2
and body. Right column lists the four package tiers with rates, hairline-separated,
each rate animated with Odometer. Two lines of small print, then the primary CTA to
/cost-calculator. Stack to one column below lg.

Package rates come from the blueprint. Also create `src/data/pricing.ts` with the
package table so the calculator can reuse it later.

[GUARDRAIL]
```

### Prompt 06 Â· Six cards + accent interlude

```
Build sections 05 (LastingCards) and 06 (PracticeInterlude).

LastingCards: six cards, 3 columns at xl / 2 at md / 1 on mobile. Hairline border,
--s-5 padding, no radius, no shadow. Inline SVG icon at 28px in --accent, H3 title,
--fs-sm body. Use motion M5 with a 0.08 stagger for now â€” I will upgrade it to the
pinned stack in Prompt 19.

PracticeInterlude: full-bleed --accent background, --on-accent text. Image 40% left,
copy 60% right at lg+, stacked on mobile. Button variant="white".

Copy for both is in the blueprint. Put it in src/data/home.ts.

[GUARDRAIL]
```

### Prompt 07 Â· Process reveal + sticky disciplines

```
Build sections 07 (ProcessReveal) and 08 (DisciplinesSticky).

ProcessReveal: two panels. The ASTHIWAR panel starts at filter: blur(14px),
opacity 0.5 with a "Click to discover" label; on click or on scroll-into-view it
animates to blur(0) / opacity 1 over 0.8s. The five comparison rows are in the
blueprint.

DisciplinesSticky: this is motion M3 and the most important section on the page.
Left column sticky at top: 22vh listing the five disciplines with 01-05 index
numbers. Right column is a stack of absolutely-positioned images that cross-fade as
the active index changes. Active index is driven by one ScrollTrigger per row on
desktop and by tap below lg (where the layout becomes a plain list with each image
inline and no stickiness). Active row: --ink text, --accent index, --accent left rule.
Inactive: --muted. Each row links to /services#slug.

Use gpt-taste's ScrollTrigger pinning guidance here â€” this is exactly the pattern it
covers well.

Also create `src/data/site.ts` with the five services (slug, index, title, short,
capabilities[4], process[4]).

[GUARDRAIL]
```

### Prompt 08 Â· Coverage + scope + sustainability

```
Build sections 09 (CoverageCounters), 10 (ScopeColumns) and 11 (SustainabilityInterlude).

CoverageCounters: H2, body, three Odometers (7 Cities / 5 Disciplines / 1 Point of
accountability), then the seven locations as hairline-bordered pills read from
src/data/pricing.ts.

ScopeColumns: four columns (Design / Engineering / Execution / Sustainability), each a
list of four capabilities. 4 columns at xl, 2 at md, an accordion on mobile. Background
image with a scrim, falling back to --surface. CTA to /services.

SustainabilityInterlude: full-bleed --accent, centred H2, then three text-only items
separated by hairline rules. NO ICON GRID â€” the brand explicitly rejects templated
sustainability icon grids. Button variant="white" to /sustainable-construction.

[GUARDRAIL]
```

### Prompt 09 Â· Seven stages + scroll frame sequence

```
Build sections 12 (ProcessStages) and 13 (BuildSequence).

ProcessStages: numbered list of the seven stages on one side, a large image opposite.
Numbers in --accent at --fs-h3. M5 stagger down the list. The image cross-fades
between /assembly-layers/01-ground-foundations.webp .. 05-roof-landscape.webp as each
stage scrolls into view.

BuildSequence: a scroll-driven canvas frame sequence.
- 300 frames at /frames/frame-001.jpg .. frame-300.jpg (zero-padded to 3 digits).
- Pin a 100vh canvas for 300vh of scroll using ScrollTrigger with scrub.
- Preload into an Image[] array; draw the frame matching progress onto a <canvas>
  sized by devicePixelRatio; use object-fit: cover maths.
- Show frame 1 as a static poster until decode completes.
- Overlay three short captions that fade in at progress 0.15, 0.45 and 0.75.
- Below lg, or under reduced motion, render a single static frame in an <img> and skip
  the pin entirely.
Self-contained client component with proper cleanup on unmount.

This is gpt-taste's scrubbing paradigm â€” apply it.

[GUARDRAIL]
```

### Prompt 10 Â· FAQ + gallery + enquiry form

```
Build sections 14 (Faq), 15 (WorkGallery) and 17 (EnquiryForm). Skip 16 (InsightsStrip).

Faq: sticky left column with the H2, Accordion on the right with the six ASTHIWAR
questions and answers. First item open. Also emit FAQPage JSON-LD via a
`src/components/JsonLd.tsx` component and a `getFaqJsonLd()` helper in `src/lib/jsonld.ts`.

WorkGallery: asymmetric six-tile grid with alternating y-offsets, M5 stagger. Hover
scales the image to 1.04 and slides a hairline caption bar up with title / location /
year. Tiles link to /projects/[slug]. Titles are "Project 01".."Project 04" and every
meta field renders "To be confirmed" â€” do not invent any project details.

EnquiryForm: fields name / phone / email / location select / project type select /
message. Validation rules are in the blueprint. Inline errors on blur, helper text
under each field, submit disabled until valid. onSubmit calls submitEnquiry() from
`src/lib/api.ts` (create it as a stub that logs, waits 600ms and resolves). Success
replaces the form with a confirmation block, not an alert.

[GUARDRAIL]
```

### Prompt 11 Â· Assemble and audit

```
SKILLS: also load redesign-existing-projects
        (C:\Users\sunda\.agents\skills\redesign-existing-projects\SKILL.md)
        Use its DESIGN AUDIT section only. Do not let it restructure the page â€”
        the structure is a deliberate reproduction and is correct as built.

Write `src/app/page.tsx` importing all sections in blueprint order, with metadata
(title, description, openGraph, alternates.canonical). Leave InsightsStrip commented out.

Then run the audit and report findings without fixing anything yet:
1. Any raw hex or rgb value outside globals.css â€” file and line.
2. Any GSAP effect missing a reduced-motion early return.
3. Any section that breaks below 375px.
4. Any duplicated logic that should be a shared primitive.
5. Generic AI design patterns per the redesign skill's audit list.
6. Whether ground colour alternates enough for the page to breathe
   (blueprint "rhythm check").

[GUARDRAIL]
```

---

# PHASE 2 â€” Inner pages

```
SKILLS:
  full-output-enforcement, design-taste-frontend
  C:\Users\sunda\.agents\skills\full-output-enforcement\SKILL.md
  C:\Users\sunda\.agents\skills\design-taste-frontend\SKILL.md
  SCOPE: these pages are quieter than the homepage. Do not add motion beyond M1 and M5.
```

> Paste `04-PAGE-SPECS.md` with each of these.

### Prompt 12 Â· PageHero, CtaBand, /services, /about

```
Build the shared `PageHero` and `CtaBand` components, then /services and /about
exactly as specified in the page specs doc.

/services needs id anchors on each of the five blocks so /services#architecture etc.
work from the footer and homepage. Add the sticky sub-nav rail at lg+.

/about should be the quietest page on the site: M1 on headings, M5 on blocks, no
pinning and no counters.

[GUARDRAIL]
```

### Prompt 13 Â· /projects and /projects/[slug]

```
Build the projects archive and detail template per the page specs.

Archive: category filter pills that write to a ?category= URL param, fade the grid
0.25s on change, two-column grid at lg. ProjectCard has the hover gallery â€” cycle
through the card's gallery[] frames every 700ms with a cross-fade on hover, first
image only on touch devices.

Detail: generateStaticParams from projects[], per-project generateMetadata,
notFound() for unknown slugs, and the nine sections listed in the spec including the
sticky fact strip and the next-project link that wraps around.

Placeholder rule: when a field equals a "to be confirmed" string, render it in
--muted with the label still visible. Never hide it, never fabricate a value.

[GUARDRAIL]
```

### Prompt 14 Â· /sustainable-construction, /contact, /insights

```
Build these three pages per the page specs.

/sustainable-construction: three pillar sections with alternating image sides.
Absolutely no sustainability icon grid.

/contact: two columns; reuse EnquiryForm with variant="page". Contact details render
"To be confirmed". Use a static map image that swaps to an interactive embed on click
â€” do not load a Maps iframe on first paint.

/insights: build the page but do NOT add it to the header nav yet, since all six
articles are placeholders.

Also add `src/app/sitemap.ts`, `src/app/robots.ts` (excluding /admin),
`src/app/not-found.tsx` and `src/app/error.tsx`, all styled to match the site.

[GUARDRAIL]
```

---

# PHASE 3 â€” Calculator

```
SKILLS:
  full-output-enforcement, impeccable
  C:\Users\sunda\.agents\skills\full-output-enforcement\SKILL.md
  C:\Users\sunda\.agents\skills\impeccable\SKILL.md

  PREREQUISITE â€” impeccable halts with NO_PRODUCT_MD unless PRODUCT.md exists at the
  project root. Copy it first:
    cp "C:/Users/sunda/Desktop/Asthivar/asthiwar-v1-main/web/PRODUCT.md" ./PRODUCT.md
  It also runs `node .agents/skills/impeccable/scripts/context.mjs` on a
  project-relative path, so the project-local .agents/skills junction from Â§0.2 must
  exist.

  WHY HERE: impeccable's stated coverage includes forms, empty states, error states
  and multi-step product UI. That is exactly the wizard.
```

### Prompt 15 Â· Pricing engine and data

```
Build the Phase 1 pricing layer, frontend only.

- `src/data/pricing.ts`: packages, locations (with the confirmed flag), the ten
  upgrade categories, the add-on catalogue, and the MILESTONES array â€” exactly as
  given in the calculator spec.
- `src/lib/pricing/engine.ts`: the formulas, verbatim. Round only at the milestone step.
- `src/lib/pricing/types.ts`: EstimateInput, EstimateResult, supporting types.
- `src/lib/api.ts`: createEstimate() calling the local engine, with the Phase 2 fetch
  call written as a comment directly beneath.
- A test asserting the milestone percentages sum to exactly 100.

Any upgrade option whose deltaPerSqft is unknown must be typed `number | null` and
must never be treated as 0. This is project rule 3: never invent missing prices.

[GUARDRAIL]
```

### Prompt 16 Â· Wizard steps 0â€“2

```
Build the calculator shell and the first three steps in `src/components/calculator/`.

Shell: one reducer holding all state, persisted to sessionStorage on every change and
rehydrated on mount. A thin --hairline progress bar with an --accent fill plus
"Step N of 6" in text. Step transitions use motion M5 at 0.4s.

Step0LeadCapture, Step1Dimensions, Step2Floors exactly as specified â€” including the
live unit conversion badge, the plot-bounded slider with filtered preset chips, and
the stacked-slab SVG that gains a floor as the selection changes. Pure SVG/CSS, no 3D
library.

Apply impeccable's guidance on form states, inline validation and error copy.

[GUARDRAIL]
```

### Prompt 17 Â· Wizard steps 3â€“5

```
Build Step3Packages, Step4Customisations and Step5EstimateReport.

Step 3: four package cards; the "Volume rate applied" banner when built-up exceeds
3,500 sqft; show the location multiplier and the effective rate openly.

Step 4: two tabs (Specification, Add-ons) with a sticky running-total bar at the
bottom of the viewport. The running total uses the Odometer primitive so figures roll
as choices change. Quantity inputs for per-litre / per-Rft / per-sqft add-ons with
live line subtotals.

Step 5: the full report â€” a preview estimate ID clearly labelled "Preview estimate â€”
not yet saved", the four-line breakdown, an inputs summary, the ten-stage milestone
table, and the approved disclaimer. Actions: Print / Save as PDF via window.print()
with a dedicated print stylesheet targeting a clean 2-page A4, a stubbed "Email me
this estimate", and "Book a site consultation" linking to /contact with the estimate
ID prefilled.

Then wire it up in `src/app/cost-calculator/page.tsx`.

[GUARDRAIL]
```

---

# PHASE 4 â€” Admin shell

```
SKILLS: full-output-enforcement, impeccable
        impeccable explicitly covers dashboards, app shells and empty states.
```

### Prompt 18 Â· Admin UI, mocked

```
Build the /admin UI shell per the page specs, section "Phase 1: UI shell only".
No authentication, no API calls. Mock data lives in `src/data/mock-admin.ts` and is
clearly named as mock.

Screens: Overview (KPI tiles + one chart drawn with inline SVG, no chart library),
Enquiries (table + row detail drawer), Estimates (table + detail breakdown), Pricing
config (editable inputs on local state with a visible "changes are not persisted"
banner), Notifications, Audit logs.

Left sidebar nav, top bar with the page title, --surface chrome. Same type tokens as
the marketing site. The route must be noindex.

Design every empty state and loading state â€” do not leave blank panels.

[GUARDRAIL]
```

---

# PHASE 5 â€” Polish

```
SKILLS: full-output-enforcement, web-design-guidelines, vercel-react-best-practices
  C:\Users\sunda\.agents\skills\web-design-guidelines\SKILL.md
  C:\Users\sunda\.agents\skills\vercel-react-best-practices\SKILL.md
  web-design-guidelines takes a file pattern argument, e.g. `src/**/*.tsx`.
```

### Prompt 19 Â· Motion upgrade + responsive pass

```
SKILLS: also gpt-taste, scoped to pinning and stacking only.

Two things.

1. Upgrade LastingCards (homepage section 05) from the simple M5 grid to the
   Novascape-faithful M6 pinned card stack: pin the section for ~200vh, scrub the six
   cards in as scroll advances, each overlapping the previous with a scale from 0.94
   to 1. Below lg, and under reduced motion, keep the plain grid.

2. Full responsive pass at 320, 375, 768, 1024, 1440 and 2560px. Report every
   overflow, clipped text, broken grid and unreachable control, then fix them.

[GUARDRAIL]
```

### Prompt 20 Â· Accessibility, performance, SEO

```
Run web-design-guidelines against src/**/*.tsx, then fix in this order:

1. Accessibility â€” heading order, landmarks, alt text, form labels and error
   association, focus order and visible focus, WCAG 2.1 AA contrast, keyboard
   operability of the menu overlay / accordion / sticky list / wizard, and correct
   behaviour with prefers-reduced-motion on.
2. Performance â€” apply vercel-react-best-practices. next/image everywhere with
   explicit sizes, WebP for the 300 frames, lazy loading below the fold, font-display
   swap, no layout shift from the sticky header, GSAP/Lenis only in client components.
3. SEO â€” metadata on every route, Organization JSON-LD on the layout, FAQPage on the
   homepage, BreadcrumbList on project detail pages, sitemap and robots correct.

Report what you changed and what you could not fix without design decisions from me.

[GUARDRAIL]
```

---

# Optional Â· Assets and deployment

### Placeholder imagery

`01-MASTER-PLAN.md` Â§9 lists real project photography as an open item. Until it lands:

```
SKILLS: imagegen-frontend-web  (or brandkit for identity boards)
        C:\Users\sunda\.agents\skills\imagegen-frontend-web\SKILL.md

Generate placeholder architectural photography for the ASTHIWAR site: contemporary
South Indian residential architecture, deep shade, exposed masonry and lime plaster,
warm material, precise structural lines, overcast or late-afternoon light.
Anti-reference: glossy real-estate marketing, rendered CGI, lens flare.
One separate image per section. Label every output as a placeholder.
```

Your account also has the `gpt-image` skill, which writes GPT Image 2 prompts â€” use
that if you are generating in ChatGPT rather than in the agent.

### Deployment

```
SKILLS: deploy-to-vercel  (or vercel-cli-with-tokens for token auth)
        vercel-optimize    after the first deploy, for cost and performance
```

---

# Per-agent notes

| Agent | Notes |
|---|---|
| **Claude Code** | Needs the `~/.claude/skills` junction from Â§0.2. Invoke with `/skill-name` or by name. Restart after linking. |
| **Codex** | Reads `~/.codex/skills/`. Has `skill-installer` from `openai/skills` if you want more. `image-to-code` in your set is written specifically for Codex. |
| **Antigravity** | Reads `~/.gemini/antigravity/builtin/skills/`. If linking is awkward, use the "read the SKILL.md at this path" fallback â€” it works reliably. |
| **Cursor** | Reads `~/.cursor/skills-cursor/`. Its own `create-skill` and `review` built-ins overlap with several of these; prefer yours for design work. |
| **ChatGPT / Gemini web** | No filesystem access. Paste the SKILL.md contents inline. `full-output-enforcement` and `gpt-taste` are single files and paste cleanly; `impeccable` is 99 files and will not â€” use a filesystem-capable agent for Phase 3 and 4. |

---

# Prompting notes that actually matter

- **Two or three components per prompt, maximum.** `full-output-enforcement` reduces
  truncation but does not repeal context limits.
- **Ask for complete files with paths.** Merging snippets by hand is where bugs enter.
- **Re-paste the design system whenever a new chat starts.** Drift shows up first as
  invented hex values and new easing curves.
- **When output is wrong, add the constraint and re-prompt â€” don't argue.**
  "The card has a border-radius; radius is 0 everywhere except pill buttons. Rewrite the file."
- **Watch for skills overriding the plan.** If an agent starts randomising layouts or
  proposing a different aesthetic, paste the precedence block from Â§2.
- **Never let it fill in content.** Project rule 3 and rule 24: never invent missing
  prices, and document ambiguity rather than guessing. A project called
  "Serene Villa, Saravanampatti, 2024" is a false claim on a live site.
