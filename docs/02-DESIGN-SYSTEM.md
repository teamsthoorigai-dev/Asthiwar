# 02 — Design System

Every value below was **measured from the live novascape.in DOM**, not estimated.
Paste this whole file as context for any styling task.

---

## 1. Colour

### Measured from Novascape

| Token | Value | Where it appears |
|---|---|---|
| Page background | `#FFFFFF` | body |
| Ink (headings) | `#000000` | h1–h3, 590 elements |
| Body text | `#666666` | paragraphs — **1,490 elements**, the dominant text colour |
| Muted | `#999999` | captions, disclaimers, odometer inactive digits |
| Hairline | `#DBDBDB` | borders and dividers — **492 elements**, this is what gives the site its structure |
| Accent | `#ED7336` | CTAs, counter numbers, full-bleed interlude backgrounds |
| Surface | `#F3F3F5` | subtle card / section fills |

Key insight: the site is **white + one orange + a grey hairline**. Restraint is the
whole trick. Do not introduce a second accent.

### ASTHIWAR adaptation

Two options. Pick one in `globals.css` and never mix.

**Option A — Novascape exact** (use if "exactly like this" means literally):
```css
--accent: #ED7336;
--surface: #F3F3F5;
```

**Option B — ASTHIWAR warm** (recommended: same structure, materially aware, moves away
from "developer glossy" without changing a single layout value):
```css
--accent: #C4551F;        /* burnt terracotta — reads as fired brick, not marketing orange */
--accent-bright: #ED7336; /* keep for hovers and counter digits */
--surface: #F5F2ED;       /* warm lime-plaster off-white instead of cool grey */
```

### `globals.css` — copy this verbatim

```css
@import "tailwindcss";

:root {
  /* colour */
  --bg:          #FFFFFF;
  --ink:         #000000;
  --body:        #666666;
  --muted:       #999999;
  --hairline:    #DBDBDB;
  --accent:      #C4551F;
  --accent-bright:#ED7336;
  --surface:     #F5F2ED;
  --on-accent:   #FFFFFF;

  /* type scale — desktop values from Novascape */
  --fs-h1: clamp(2.5rem, 1.2rem + 4.2vw, 5rem);      /* 40 -> 80px  (Novascape: 56 @800px) */
  --fs-h2: clamp(2rem,   1.3rem + 2.3vw, 3.25rem);   /* 32 -> 52px  (Novascape: 40 @800px) */
  --fs-h3: clamp(1.5rem, 1.2rem + 1.0vw, 2rem);      /* 24 -> 32px  (Novascape: 28) */
  --fs-h4: 1.25rem;                                   /* 20px */
  --fs-lg: 1.125rem;                                  /* 18px */
  --fs-md: 1rem;                                      /* 16px — Novascape h3/label size */
  --fs-sm: 0.875rem;                                  /* 14px */
  --fs-xs: 0.75rem;                                   /* 12px */

  --lh-tight: 1.0;    /* Novascape h1: 56px font / 56px line-height */
  --lh-head:  1.2;    /* h2 40/48, h3 16/19.2 — all exactly 1.2 */
  --lh-body:  1.6;

  --fw-regular: 400;
  --fw-medium:  500;   /* Novascape sub-heads */
  --fw-bold:    700;   /* Novascape uses 600; Satoshi ships 700 — use 700 */

  /* spacing scale — Novascape section rhythm */
  --s-1: 0.5rem;   --s-2: 1rem;    --s-3: 1.5rem;   --s-4: 2rem;
  --s-5: 3rem;     --s-6: 4rem;    --s-7: 5rem;     --s-8: 6rem;
  --s-9: 8rem;     --s-10: 10rem;
  --section-y: clamp(4rem, 2rem + 6vw, 10rem);   /* Novascape "space-29xl" */
  --section-y-sm: clamp(3rem, 1.5rem + 4vw, 6rem);

  /* containers */
  --container:       78rem;   /* 1248px — .container regular */
  --container-large: 90rem;   /* 1440px — .container.large */
  --container-small: 64rem;   /* 1024px — .container.is-small (footer) */
  --gutter: clamp(1.25rem, 0.5rem + 3vw, 3rem);

  /* motion */
  --ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 0.3s;
  --dur-base: 0.6s;
  --dur-slow: 1.1s;

  --radius: 0px;      /* Novascape is almost entirely square — keep it that way */
  --radius-pill: 999px;
}

@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-400.woff2") format("woff2");
  font-weight: 400; font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-500.woff2") format("woff2");
  font-weight: 500; font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-700.woff2") format("woff2");
  font-weight: 700; font-display: swap;
}

html { -webkit-font-smoothing: antialiased; }

body {
  background: var(--bg);
  color: var(--body);
  font-family: "Satoshi", "Inter", system-ui, -apple-system, Arial, sans-serif;
  font-size: var(--fs-md);
  line-height: var(--lh-body);
}

h1, h2, h3, h4 { color: var(--ink); font-weight: var(--fw-bold); line-height: var(--lh-head); }
h1 { font-size: var(--fs-h1); line-height: var(--lh-tight); letter-spacing: -0.02em; }
h2 { font-size: var(--fs-h2); letter-spacing: -0.015em; }
h3 { font-size: var(--fs-h3); }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 2. Typography

Novascape's measured scale, at an 800px viewport:

| Role | Size / line-height / weight | ASTHIWAR token |
|---|---|---|
| Hero H1 | 56 / 56 / 600 | `--fs-h1`, `--lh-tight` |
| Section H2 | 40 / 48 / 600 | `--fs-h2`, `--lh-head` |
| Secondary H2 | 32 / 38.4 / 500 | `--fs-h3` + `--fw-medium` |
| Sub-head H3 | 28 / 33.6 / 600 | `--fs-h3` |
| Label / card title H3 | 16 / 19.2 / 500 | `--fs-md` + `--fw-medium` |
| Body | 16 / 1.6 / 400, `#666` | default |

Note the discipline: **every heading line-height is exactly 1.2**, and the hero is 1.0.
That single ratio is a big part of why the site feels tight.

Letter-spacing is `normal` everywhere on Novascape. Satoshi is slightly wider than Inter
Display, so apply `-0.02em` on H1 and `-0.015em` on H2 to match the optical density.

---

## 3. Layout

```
.container        max-width 78rem   padding-inline var(--gutter)   mx-auto
.container-large  max-width 90rem
.container-small  max-width 64rem
```

Section vertical padding: `padding-block: var(--section-y)`.
Novascape uses named steps (`space-29xl`, `space-28-xl`, `space-xxxl`, `spacing-24xl`,
`spacing-20xl`, `spacing-13xl`) — collapse those to the two tokens above plus the `--s-*` scale.

**Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
Novascape's real breaks are at **768** (tablet) and **991** (Webflow's desktop break).
Design mobile-first; the biggest layout shifts happen at `lg`.

---

## 4. Motion system

### 4.1 Lenis smooth scroll

`src/components/layout/SmoothScroll.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => { lenis.destroy(); gsap.ticker.remove((t) => lenis.raf(t * 1000)); };
  }, []);

  return <>{children}</>;
}
```

### 4.2 GSAP setup

`src/lib/gsap.ts`:

```ts
'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
}

export const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, SplitText };
```

### 4.3 The six signature animations

> **M1, M3 and M6 are superseded** by the float language in §4.5 for all
> marketing sections. They stay documented because M2 and M4 still ship, and
> because the reasoning for dropping the other three is worth keeping.
> New marketing work uses F1–F5. Do not reach for M1, M3 or M6 again.

Novascape has exactly six motion ideas, reused everywhere. Build them once as
reusable hooks/components, then every section is cheap.

| # | Name | Where Novascape uses it | Spec |
|---|---|---|---|
| **M1** | **SplitText letter reveal** | Hero H1, section H2s | Split to chars, `y: 100%` + `opacity: 0` -> `0` / `1`, `stagger: 0.02`, `ease: power3.out`, `duration: 0.9`. Trigger `top 85%`. |
| **M2** | **Odometer counter** | "3-Sided Ventilation", "58%", "7+ Work Hubs" | Vertical digit strip per column. Each digit column is `0-9` stacked; animate `yPercent` to the target digit. Stagger columns by 0.08s. Duration 1.4s, `ease: power4.out`. Fires once on `top 80%`. |
| **M3** | **Sticky list + image swap** | Amenities (`_01`.. `_05`) | Left column: numbered list, pinned via `position: sticky`. Right: image stack, cross-fade on hover/active index. Active row gets accent colour + full opacity; others `--muted`. |
| **M4** | **Infinite marquee** | USP strip under the hero | Duplicate the track twice, `gsap.to(track, { xPercent: -50, repeat: -1, duration: 24, ease: 'none' })`. Pause on hover/focus. |
| **M5** | **Fade-and-rise on enter** | Cards, images, paragraphs | `y: 40, opacity: 0` -> `0, 1`. `stagger: 0.08` for grids. Trigger `top 85%`. |
| **M6** | **Pinned card stack** | "What Makes Your Home Breathe?" (2400px tall for 6 cards) | Pin the section, scrub cards in as scroll advances. Each card overlaps the previous with a slight scale-down. |

Plus two smaller ones:
- **Accordion** — height auto via GSAP, 0.4s, `power2.inOut`, icon rotates 45°.
- **Button hover block** — Novascape's `.hover-color-block-2`: a solid block slides in from
  the bottom on hover, text colour inverts. `transform: translateY(101%)` -> `0`, 0.4s.

### 4.4 Reduced motion

Every GSAP hook must early-return when `REDUCED()` is true, and render the final state
statically. This is non-negotiable — it is in ASTHIWAR's accessibility spec.

The same early-return also covers no-JS and GSAP-failure: no primitive may hide
its content in CSS and rely on script to reveal it. Hidden states are always set
by GSAP, never by a stylesheet.

### 4.5 The float language (F1–F5)

Constants live in `FLOAT` in `src/lib/gsap.ts`. Five primitives, and nothing
gets invented per page — that is what makes the site read as one system rather
than a pile of effects.

| # | Name | Component / hook | Spec |
|---|---|---|---|
| **F1** | **Float rise** | `<Float>` | Entry only, never scrubbed. `y: 40 → 0`, `opacity: 0 → 1`, `1.1s`, `power3.out`, sibling stagger `0.09`. Animates its own direct children. |
| **F2** | **Line mask reveal** | `<LineReveal>` | `SplitText` `type: 'lines'`, `mask: 'lines'`, `yPercent: 100 → 0`, `1.1s`, stagger `0.12`. Per **line**, never per letter. |
| **F3** | **Depth drift** | `useDepthDrift()` | Scrubbed. `[data-drift="back"]` `yPercent -8 → 8`; heading anchored at 0; `[data-drift="front"]` `yPercent 6 → -6`. Desktop only (≥768px). |
| **F4** | **Image settle** | `<FloatImage>` | `clip-path` wipe `inset(100% 0 0 0) → inset(0)` once on entry, `1.4s`; plus `scale 1.06 → 1` scrubbed from `top bottom` to `center center`, then holds. |
| **F5** | **Quiet index** | `<SectionIndex>` | A hairline and a two-digit number fixed at one viewport edge. The only persistent chrome permitted. No pills, no progress bar, no "scroll to advance" copy. |

**The ±10% cap.** No drift layer may exceed ten percent. The viewer must not be
able to *see* F3 happening — only feel that the composition breathes. Past that
it becomes visible parallax, which is the showboating this language exists to
remove.

**Per-line, not per-letter.** M1 split headings to chars. At display size that
reads as a gimmick and is the most common tell of an AI-built page. F2 reveals
whole lines so the heading arrives as language.

**The timing law — one thing moves per viewport at a time.** If the heading is
revealing, the image is still. If the image is settling, the type has already
landed. Where several primitives share a trigger, cascade them with `delay`
rather than firing them together. This single rule is most of the difference
between a page that feels calm and one that feels busy.

**Entry is never scrubbed.** F1 and F2 play once and are then left alone.
Scrubbing entry animations is what makes a page feel dragged rather than alive.
Only F3 and F4's scale are tied to scroll position.

**Nothing is pinned.** A scrub-pinned track is a carriage the viewer cranks,
which is a mechanical sensation by construction. `/services` previously pinned a
horizontal track; removing it was the single biggest improvement to how the page
feels. M6 is retired for the same reason.

### 4.6 Float composition rules

Motion cannot rescue a crowded frame. These are enforced at review:

1. **No cards.** No white panel floating on `--surface`. Content sits directly
   on `--bg`.
2. **No shadows** in marketing CSS. On flat paper there is no light source.
   Shadows remain legitimate in `/admin` and `/cost-calculator`, which are real
   UI and need functional depth.
3. **Radius is `--radius: 0px`** in marketing routes. No rounded panels, no
   pill chips.
4. **Max two bordered elements per viewport.**
5. **One image per screen, bleeding off at least one viewport edge.** Bleed is
   what makes a page read as a composition rather than a layout.
6. **Text sits on air.** No scrims, no chips, no tag pills. If type needs a chip
   to be legible it is on the wrong background.
7. **Exactly three type registers:** eyebrow (`11px`, caps, `0.18em` tracking,
   `--muted`), display (`--fs-h1`/`--fs-h2`, `--ink`), body (`--fs-md`/`--fs-lg`,
   `--body`, `max-width: 46ch`). Links borrow the eyebrow register rather than
   adding a fourth.
8. **Whitespace and hairlines separate. Never a filled box.**

**The content precondition.** These rules are not achievable at any content
density. A section carrying nine blocks cannot be made to feel like one carrying
three, whatever the easing. Cutting content is part of adopting this language,
not a separate task — `/services` went from nine blocks per discipline to five.

---

## 5. Component primitives

Build these first (P0/P1). Everything else composes from them.

| Component | Props | Notes |
|---|---|---|
| `<Button>` | `variant: 'primary' \| 'ghost' \| 'white'`, `href`, `children` | Pill, `--radius-pill`. Includes the sliding hover block. |
| `<Marquee>` | `items: {icon, label}[]`, `speed?` | M4. Duplicates children internally. |
| `<Odometer>` | `value: number`, `suffix?`, `label`, `sublabel?` | M2. Renders digit columns. |
| `<SplitHeading>` | `as: 'h1'\|'h2'`, `children` | M1. Superseded by `<LineReveal>` for new work. |
| `<Float>` | `as?`, `delay?`, `stagger?`, `children` | F1. Animates its own direct children. |
| `<LineReveal>` | `as: 'h1'\|'h2'\|'h3'\|'p'`, `delay?`, `children` | F2. Splits after `document.fonts.ready`; real string on `aria-label`. |
| `<FloatImage>` | `src`, `alt`, `sizes?`, `priority?` | F4. Nests frame / settle / drift so F3 and F4 never share a `transform`. |
| `<SectionIndex>` | `scopeRef` | F5. Reads `[data-float-section]`; `aria-hidden`. |
| `useDepthDrift()` | `scopeRef` | F3. Reads `[data-drift="back"\|"front"]` inside `[data-float-section]`. |
| `<Accordion>` | `items: {q, a}[]`, `initialOpen?`, `showMore?: number` | Novascape shows 6 then "View More…". |
| `<StickyList>` | `items: {index, title, body, image}[]` | M3. |
| `<RevealImage>` | `src`, `alt`, `blurUntilHover?` | Novascape's "Click to discover" blur reveal. |
| `<SectionHeader>` | `eyebrow?`, `title`, `body?`, `align?` | Used by ~12 sections. |
| `<CardGrid>` | `cards`, `columns` | M5 stagger. |

---

## 6. Anti-drift rules (paste into every AI prompt)

```
- Use ONLY the CSS variables defined in globals.css. Never write a raw hex value.
- Marketing motion is ONLY F1-F5 from 02-DESIGN-SYSTEM.md section 4.5, plus M2 and M4.
  Do not invent new easing. Do not use M1, M3 or M6 - they are superseded.
- Nothing is pinned. No scrub-pinned tracks, no pinned card stacks.
- No cards: no white panel on a coloured ground. Content sits on --bg.
- Border radius is 0 in marketing routes. No rounded panels, no pill chips.
- Max two bordered elements per viewport. Three type registers, no more.
- One image per screen, bleeding off at least one viewport edge.
- One accent colour. No gradients, no shadows, no glassmorphism.
- Every GSAP effect must early-return under prefers-reduced-motion.
- Do not install any package not listed in 01-MASTER-PLAN.md section 4.
- Do not invent project names, dates, prices or client details.
```
