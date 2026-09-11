# Website Responsiveness & Scroll Animation Fixes

## Goal
Fix the stuck 300-frame scroll sequence on the Projects page, enable smooth right-to-left horizontal filmstrip animation on vertical scroll for the Services page across all screen sizes, and audit/fix mobile responsiveness across all website pages.

## Constraints
- Preserve ASTHIWAR design system (warm palette #EFEAE3, #19241D, typographic contrast, no generic UI cards).
- Support reduced motion (prefers-reduced-motion: reduce) with clean, functional fallbacks.
- Keep Lenis smooth scroll and GSAP ScrollTrigger strictly synchronized without scroll jumps or broken layout calculations.
- No dummy/placeholder code; all changes must be verified through automated build and testing.

## Out of scope
- Changing backend pricing calculator logic or database schemas.
- Re-architecting unrelated routes or rewriting copywriting.

## Steps
- [x] 1. Fix Projects Page 300-Frame Scroll Sequence (ProjectsHeroSequence.tsx & .module.css)
- [x] 2. Fix Services Page Right-to-Left Scroll Animation (ServicesClient.tsx & services.module.css)
- [x] 3. Audit & Fix Responsiveness Across All Other Site Pages (Home, Studio, About, Contact, Calculator)
- [x] 4. Verification & Build Validation (npm run build & browser test)

## Decisions
- Step 1: Upgraded ProjectsHeroSequence to universal responsive engine: removed 768px restriction, added reactive repaint on img.onload when closer to targetFrame, prioritized fetching frames near current scroll point, and calibrated mobile layout.
- Step 2: Enabled universal right-to-left horizontal scrub on vertical scroll down across all viewports in ServicesClient. Removed transform: none !important; and touch-swipe restriction. Added ScrollTrigger.refresh() on mount and calibrated responsive panel layouts for mobile/tablet.
- Step 3: Audited Studio, Contact, Calculator, and Home components. Added responsive mobile constraints for StudioLineArtMap (mobile legend stacking, scaled maps thumbnail, touch pill button), studio office action buttons, contact detail grids, and verified calculator table scrollers and hero clamps.
- Step 4: Executed full production build across workspace packages (database, backend, web) with Next.js 16.3.4 Turbopack. All 21 static/SSG routes compiled, typechecked, and generated with exit code 0.

---

# Mobile Sticky Location Tabs on Studio Page

## Goal
Fix the three company location tabs to the top of the viewport on mobile when scrolling down and viewing the map, so the user can easily switch between locations in-place.

## Steps
- [x] 1. Expose Header Scroll State Telemetry in SiteHeader.tsx (`data-header-hidden`)
- [x] 2. Wrap Tabs in Sticky Container with Responsive Labels in StudioClient.tsx
- [x] 3. Style Sticky Wrapper & Sleek Mobile Tabs Bar in studio.module.css
- [x] 4. Verify with npm.cmd run build & Validate Behavior

## Decisions
- Steps 1-3: Integrated `document.body.dataset.headerHidden` in `SiteHeader.tsx`. Created `.tabsStickyWrapper` with `position: sticky; z-index: 35;` that reacts to header scroll offset (`top: 52px` vs `top: 0`). Configured responsive dual-labels: desktop gets full region name, mobile gets punchy compact labels (`01 Airport Axis`, `02 GCT Axis`, `03 Virudhunagar Hub`) in a single horizontal strip with smooth touch scrolling and solid background backdrop.
- Step 4: Ran full production build (`npm.cmd run build`). All packages and 21 static/SSG routes compiled cleanly with code 0.

---

# User Correction: Remove Extra Black Background from Projects Hero on Mobile

## Goal
Remove the mobile aspect-ratio letterboxing on the Projects hero sequence so the 300-frame canvas scroll effect fills the entire mobile screen edge-to-edge (no black void box below the image), with intro text floating cleanly over the cinematic sequence and fading away on scroll.

## Steps
- [x] 1. Remove mobile aspect-ratio letterboxing from `.canvas` and `.poster` in `ProjectsHeroSequence.module.css` (restore `inset: 0; width: 100%; height: 100%; object-fit: cover`).
- [x] 2. Re-anchor `.intro` and `.stageCopyContainer` to `bottom` so copy floats over the full-bleed canvas with natural scrim grading, and hide redundant mobile rail.
- [x] 3. Run production build verification (`npm.cmd run build`).

## Decisions
- Restored full-bleed `100svh` canvas and poster on mobile (`inset: 0; width: 100%; height: 100%; object-fit: cover`), eliminating the letterboxed 1440/612 band and the large `#161917` black void below it.
- Anchored `.intro` and `.stageCopyContainer` cleanly to the bottom with subtle scrim gradient; hid the 4-block mobile rail and grid lines. The photographic 300-frame sequence now spans edge-to-edge full-screen, with intro copy fading away on initial scroll.
