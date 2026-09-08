# 01 â€” Master Plan

## 1. Objective

Rebuild the ASTHIWAR website so it reads, moves and feels like **novascape.in**, while
selling what ASTHIWAR actually sells: a coordinated architecture + engineering +
construction practice, not a single apartment project.

**Decision taken:** keep Novascape's *exact section rhythm, layout grammar and motion
craft*, and swap the payload. See the full mapping in `03-HOMEPAGE-BLUEPRINT.md`.

---

## 2. One tension to manage â€” read this before you start

ASTHIWAR's own brand doc (`asthiwar-v1-main/web/PRODUCT.md`) lists as **anti-references**:

> "generic real-estate luxury, glossy developer marketing, templated sustainability icon grids"

Novascape *is* developer marketing. That is not a reason to abandon the direction â€”
it is a reason to be deliberate about **what** you borrow.

| Borrow from Novascape | Do NOT borrow |
|---|---|
| Section order and pacing | Superlative copy ("India's 1stâ€¦", trademarks on everything) |
| Sticky-list + image-swap pattern | Price-led hero framing |
| Odometer counters | Stock lifestyle photography |
| SplitText headline reveals | Amenity-icon grids as decoration |
| Full-bleed accent interludes | Brochure-download-gated content |
| Marquee strip, accordion FAQ, gallery grid | "Express Your Interest" urgency language |

**Rule of thumb:** Novascape supplies the *choreography*. ASTHIWAR supplies the
*substance* â€” real materials, real process, real numbers. Where Novascape shows an
amenity, ASTHIWAR shows a discipline. Where Novascape shows a floor plan, ASTHIWAR
shows a build sequence.

---

## 3. Reference teardown â€” what novascape.in actually is

Measured live on 2026-09-04:

| Property | Value |
|---|---|
| Built with | Webflow |
| Smooth scroll | **Lenis 1.1.20** (`html.lenis` class present) |
| Animation | **GSAP 3.15** + **ScrollTrigger** + **SplitText** |
| Fonts | `Interdisplay` (Inter Display), weights 500 / 600 |
| Page height | ~10,600px at an 800px-wide viewport |
| Sections | 19 (incl. footer) |
| Images | 67 Â· Videos: 0 (lazy embed) Â· Lottie: 0 |
| Forms | Sell.do CRM embed |

Everything visual is achievable with plain GSAP + Tailwind. There is no exotic
3D, no WebGL, no Lottie. **This is a very reproducible site.**

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) | Matches the existing ASTHIWAR repo; SEO + route structure |
| Styling | **Tailwind CSS v4** + a CSS token layer | Tokens in `globals.css` so AI tools cannot drift |
| Smooth scroll | **Lenis 1.3.x** | Exactly what Novascape uses |
| Animation | **GSAP 3.13+** with ScrollTrigger + SplitText | SplitText is free in GSAP 3.13+; no Club licence needed |
| Fonts | **Satoshi** (local `.woff2`, already in the old repo) | Closest grotesque to Inter Display, and already present |
| Icons | Inline SVG only | No icon library; matches Novascape |
| Forms | Local React state, typed `submitEnquiry()` stub | Swapped for the real API in Phase 2 |
| State | React state + URL params | No Redux/Zustand needed |
| Deploy | Vercel | Default |

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
npm i gsap lenis
```

**Do not add:** Framer Motion, shadcn/ui, a component library, a CMS, or an
animation wrapper library. Novascape's feel comes from hand-tuned GSAP timelines.
Abstractions will flatten it.

---

## 5. Information architecture

```
/                          Homepage â€” 19-section scroll narrative (the main event)
/projects                  Archive grid, hover-gallery cards
/projects/[slug]           Case study: overview, challenge, approach, materials, timeline
/services                  Five disciplines, deep-linkable (#architecture â€¦ #green-building)
/sustainable-construction  Natural cooling, low-cement / cement-free, green building
/about                     Studio â€” "A building practice, not a relay race"
/insights                  Articles index
/cost-calculator           5-step estimator + report
/contact                   Start a project
/admin                     UI shell only in Phase 1 (no auth, mocked data)
```

Header nav (from the old repo, keep it): **Projects Â· Cost Â· Services Â· Studio** plus a
`Contact` pill button. Novascape uses a hamburger `Menu` + centred logo + `Contact` pill â€”
adopt that shell, put the four links inside the overlay **and** show them inline on desktop.

---

## 6. Repo structure

```
src/
â”œâ”€ app/
â”‚  â”œâ”€ layout.tsx                 root: fonts, SmoothScroll, header, footer
â”‚  â”œâ”€ page.tsx                   homepage â€” imports the 19 section components
â”‚  â”œâ”€ globals.css                design tokens + base layer  <- single source of truth
â”‚  â”œâ”€ projects/page.tsx
â”‚  â”œâ”€ projects/[slug]/page.tsx
â”‚  â”œâ”€ services/page.tsx
â”‚  â”œâ”€ sustainable-construction/page.tsx
â”‚  â”œâ”€ about/page.tsx
â”‚  â”œâ”€ insights/page.tsx
â”‚  â”œâ”€ cost-calculator/page.tsx
â”‚  â”œâ”€ contact/page.tsx
â”‚  â””â”€ admin/page.tsx
â”œâ”€ components/
â”‚  â”œâ”€ layout/                    SiteHeader, MenuOverlay, SiteFooter, SmoothScroll
â”‚  â”œâ”€ home/                      one file per homepage section (19 files)
â”‚  â”œâ”€ ui/                        Button, Marquee, Odometer, Accordion, StickyList, RevealImage
â”‚  â””â”€ calculator/                the 5 wizard steps + report
â”œâ”€ lib/
â”‚  â”œâ”€ gsap.ts                    plugin registration + shared eases/durations
â”‚  â”œâ”€ pricing/                   Phase-1 local pricing engine (typed, swappable)
â”‚  â””â”€ api.ts                     stubbed submit functions â€” Phase 2 swaps the body only
â”œâ”€ data/
â”‚  â”œâ”€ site.ts                    services, projects, faqs, insights
â”‚  â”œâ”€ home.ts                    per-section homepage copy
â”‚  â””â”€ pricing.ts                 packages, add-ons, locations, rates
â””â”€ types/
```

---

## 7. Build phases

| Phase | Scope | Done when |
|---|---|---|
| **P0 â€” Foundation** | Next.js scaffold, tokens, fonts, Lenis, GSAP setup, header + footer | A blank page scrolls smoothly with the right type and colour |
| **P1 â€” Homepage** | All 19 sections, desktop + mobile | Homepage matches the blueprint top to bottom |
| **P2 â€” Inner pages** | Projects, Services, Sustainable, Studio, Insights, Contact | Every nav link lands on a finished page |
| **P3 â€” Calculator** | 5 steps + report, local pricing engine | An estimate can be produced end-to-end, offline |
| **P4 â€” Admin shell** | Dashboard UI with mocked data, no auth | Screens exist and are navigable |
| **P5 â€” Polish** | Reduced-motion, a11y, Lighthouse, 320px to 2560px | Lighthouse 90+ across the board |
| **P6 â€” Backend** | See `07-BACKEND-PHASE-2.md` | Calculator + forms hit real APIs |

Do not start P1 until P0 is genuinely finished. Every later prompt depends on the tokens.

---

## 8. Asset manifest â€” copy these from the old repo

Source: `C:\Users\sunda\Desktop\Asthivar\asthiwar-v1-main\web\public\`

| Copy | To | Use |
|---|---|---|
| `fonts/satoshi-400.woff2`, `satoshi-500.woff2`, `satoshi-700.woff2` | `public/fonts/` | Site typeface |
| `brand/asthiwar-logo-black.png`, `asthiwar-logo-white.png` | `public/brand/` | Header / footer / menu overlay |
| `frames/frame-001.jpg` â€¦ `frame-300.jpg` (300 files) | `public/frames/` | **Scroll-driven frame sequence** â€” replaces Novascape's video section |
| `assembly-layers/01-ground-foundations.webp` â€¦ `05-roof-landscape.webp` | `public/assembly-layers/` | Exploded build-sequence section |
| `favicon.ico`, `favicon.png` | `public/` | Favicon |

Also worth porting as *logic references* (not verbatim):
`src/components/ScrollFrameSequence.tsx`, `LayeredAssemblySequence.tsx`,
`AssemblySequence.tsx`, and `src/data/site.ts`.

> The 300-frame sequence is the single best asset you have. Novascape's weakest
> section is its lazy video embed â€” this is a straight upgrade over the reference.

---

## 9. Content you still need to supply

These are `"to be confirmed"` placeholders in the old repo. The build can proceed
without them, but the site cannot launch without them:

- [ ] Real project names, locations, areas, years, statuses (4 projects currently blank)
- [ ] Real project photography (the archive currently reuses 6 generic images)
- [ ] Office address, phone number, email
- [ ] Insights / article content (6 placeholders)
- [ ] Confirmation that the calculator rates (â‚¹2,099 â€“ â‚¹3,250 / sqft) are current
- [ ] Social media URLs

Until then: keep the honest "to be confirmed" labels. ASTHIWAR's brand doc
explicitly asks for unverified information to be labelled â€” do not let an AI tool
invent plausible-sounding project details to fill the gap.

---

## 10. Definition of done (Phase 1)

- [ ] Homepage reproduces all 19 sections with working scroll choreography
- [ ] Lenis smooth scroll active; `prefers-reduced-motion` disables it and all GSAP motion
- [ ] Every page renders correctly from 320px to 2560px
- [ ] Calculator produces an estimate offline and can render/print a report
- [ ] No hardcoded hex values outside `globals.css`
- [ ] Lighthouse 90+ Performance / Accessibility / Best Practices / SEO
- [ ] Keyboard navigable, visible focus rings, semantic headings
- [ ] No invented content â€” placeholders stay labelled
