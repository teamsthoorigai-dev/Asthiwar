# Primitives API

Paste this into any agent that **cannot read the repo** (ChatGPT, Gemini web). Without
it they will invent props for these components and the output will not compile.

Built in Prompts 02 and 03. All live under `src/components/`.

---

## Import paths

```ts
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { Button } from '@/components/ui/Button';
import { Marquee, type MarqueeItem } from '@/components/ui/Marquee';
import { Odometer } from '@/components/ui/Odometer';
import { Accordion, type AccordionEntry } from '@/components/ui/Accordion';
```

`SiteHeader` and `SiteFooter` are already mounted in `src/app/layout.tsx`. Do not
render them inside a page.

---

## Signatures

```ts
// Section — full-bleed ground colour, contained content, standard vertical rhythm.
<Section
  width?: 'regular' | 'large' | 'small'      // default 'regular' (78rem)
  background?: 'bg' | 'surface' | 'accent' | 'ink'   // default 'bg'
  tight?: boolean                            // smaller vertical padding
  id?: string
  className?: string
  aria-labelledby?: string
>{children}</Section>

// SectionHeader — eyebrow + headline (motion M1) + optional standfirst.
<SectionHeader
  eyebrow?: string
  title: string                              // plain string, NOT a node — it gets split
  body?: ReactNode
  align?: 'left' | 'center'                  // default 'left'
  as?: 'h1' | 'h2'                           // default 'h2'
  id?: string
/>

// SplitHeading — motion M1 on its own. SectionHeader already uses this internally.
<SplitHeading
  as?: 'h1' | 'h2' | 'h3'                    // default 'h2'
  delay?: number                             // seconds
  className?: string
  id?: string
>{'a plain string'}</SplitHeading>

// Button — pill with the sliding hover block. Renders <Link> when href is given.
<Button
  variant?: 'primary' | 'ghost' | 'white'    // default 'primary'
  href?: string                              // omit for a <button>
  className?: string
  onClick?: () => void                       // only without href
>{children}</Button>

// Marquee — motion M4, seamless loop. Renders the set twice internally.
type MarqueeItem = { label: string; icon?: ReactNode };
<Marquee
  items: MarqueeItem[]
  speed?: number                             // seconds per loop, default 24
  aria-label?: string
/>

// Odometer — motion M2, rolling digits.
<Odometer
  value: number                              // integer
  suffix?: string                            // e.g. '%' or '+'
  label: string
  sublabel?: string
/>

// Accordion — GSAP height, plus icon rotates to a cross.
type AccordionEntry = { q: string; a: ReactNode };
<Accordion
  items: AccordionEntry[]
  initialOpen?: number | null                // default 0
  showMoreAfter?: number
  moreLabel?: string                         // default 'View more'
/>
```

---

## Rules these components assume

- **`title` on SectionHeader and children of SplitHeading must be a plain string.**
  They are split per character; a ReactNode will throw.
- `Section` already applies the container and vertical padding. **Do not wrap it in
  another container or add your own section padding.**
- `background="accent"` and `"ink"` invert heading and body colour automatically.
- Client components: `SplitHeading`, `Marquee`, `Odometer`, `Accordion`, `SiteHeader`,
  `MenuOverlay`, `SmoothScroll`. `Section`, `SectionHeader`, `Button`, `SiteFooter`
  are server components — do not add `'use client'` to a page just to use them.

---

## Styling convention

**CSS Modules, one per component.** `Foo.tsx` + `Foo.module.css` side by side.
Tokens come from `globals.css` via `var(--token)`. Never write a raw hex value.

Do not mix in Tailwind utility classes inside these components — the project uses
CSS Modules for components so the approach stays consistent.

Available tokens: `--bg --ink --body --muted --hairline --accent --accent-bright
--surface --on-accent`, type `--fs-h1 --fs-h2 --fs-h3 --fs-h4 --fs-lg --fs-md --fs-sm
--fs-xs`, line-height `--lh-tight --lh-head --lh-body`, weight `--fw-regular
--fw-medium --fw-bold`, spacing `--s-1` … `--s-10`, `--section-y`, `--section-y-sm`,
`--gutter`, containers `--container --container-large --container-small`,
motion `--ease-out --ease-in-out --dur-fast --dur-base --dur-slow`,
`--radius` (0) and `--radius-pill`.

---

## Motion helpers

```ts
import { gsap, ScrollTrigger, SplitText, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
```

- `REDUCED()` — true when the viewer wants reduced motion. **Every GSAP effect must
  early-return on this** and render its final state statically.
- `revealTrigger(el, pct?)` — returns a ScrollTrigger config, or `undefined` when the
  element is already past the start line so the tween should just run. Use it instead
  of writing `scrollTrigger: { trigger, start, once }` by hand.
- `MOTION` — shared timings: `splitStagger` 0.02, `splitDuration` 0.9,
  `odometerStagger` 0.08, `odometerDuration` 1.4, `odometerEase` 'power4.out',
  `marqueeDuration` 24, `riseY` 40, `riseStagger` 0.08, `startPct` 0.85,
  `startCounterPct` 0.8.

Standard M5 fade-and-rise:

```ts
useEffect(() => {
  const el = ref.current;
  if (!el || REDUCED()) return;
  const ctx = gsap.context(() => {
    gsap.from('.card', {
      y: MOTION.riseY, opacity: 0, stagger: MOTION.riseStagger,
      scrollTrigger: revealTrigger(el),
    });
  }, el);
  return () => ctx.revert();
}, []);
```

---

## Scroll locking

`SmoothScroll` owns the single Lenis instance. To pause scrolling (modals, overlays):

```ts
import { lockScroll, unlockScroll } from '@/lib/lenis';
```

Both handle the reduced-motion case where no Lenis instance exists.

---

## Existing data files

```ts
import { primaryNav, serviceNav, footerNav, legalNav, contact, socials } from '@/data/nav';
```

`contact.address`, `contact.phone`, `contact.email` are all currently the literal
string `'To be confirmed'`. **Render them as-is. Do not invent contact details.**
