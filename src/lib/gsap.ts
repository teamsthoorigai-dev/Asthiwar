'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });

  if (process.env.NODE_ENV === 'development') {
    Object.assign(window, { gsap, ScrollTrigger });
  }
}

/**
 * True when the viewer has asked for reduced motion.
 * Every GSAP effect in this project must early-return on this and render its
 * final state statically.
 */
export function REDUCED(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Where a reveal fires, as a fraction of viewport height from the top. */
const START_PCT = 0.85;
const START_COUNTER_PCT = 0.8;

/**
 * ScrollTrigger config for a reveal — or `undefined` when the element is already
 * past the start line, in which case the tween should just run.
 *
 * This exists because a ScrollTrigger created after its start point has already
 * been passed does not fire on its own; it waits for the next scroll event.
 * Triggers here are built after `document.fonts.ready`, so anything above the
 * fold hits exactly that case and would otherwise stay stuck in its start state.
 */
export function revealTrigger(el: Element, startPct: number = START_PCT) {
  if (typeof window === 'undefined') return undefined;
  if (el.getBoundingClientRect().top < window.innerHeight * startPct) return undefined;
  return { trigger: el, start: `top ${startPct * 100}%`, once: true };
}

/** Shared timings so sections stay in step. Mirrors docs/02-DESIGN-SYSTEM.md §4.3. */
export const MOTION = {
  /** M1 — SplitText letter reveal */
  splitStagger: 0.02,
  splitDuration: 0.9,
  /** M2 — odometer counter */
  odometerStagger: 0.08,
  odometerDuration: 1.4,
  odometerEase: 'power4.out',
  /** M4 — marquee loop, seconds per cycle */
  marqueeDuration: 24,
  /** M5 — fade and rise */
  riseY: 40,
  riseStagger: 0.08,
  /** Shared ScrollTrigger start points, kept in step with revealTrigger above */
  startPct: START_PCT,
  start: `top ${START_PCT * 100}%`,
  startCounterPct: START_COUNTER_PCT,
  startCounter: `top ${START_COUNTER_PCT * 100}%`,
} as const;

/**
 * F1–F5 — the float language. See docs/02-DESIGN-SYSTEM.md §4.5.
 *
 * These supersede M1, M3 and M6 for marketing sections. M2 (odometer) and
 * M4 (marquee) are unaffected and stay in MOTION above.
 */
export const FLOAT = {
  /** F1 — float rise, entry only, never scrubbed */
  riseY: 40,
  riseDuration: 1.1,
  riseStagger: 0.09,

  /** F2 — line mask reveal. Per line, never per letter. */
  lineDuration: 1.1,
  lineStagger: 0.12,

  /**
   * F3 — depth drift. Hard cap: no layer may exceed ±10%. Past that it stops
   * being a breath and becomes visible parallax, which is what we removed.
   */
  driftBack: 8,
  driftFront: 6,

  /** F4 — image settle, one reveal per image for the life of the page */
  settleFrom: 1.06,
  settleDuration: 1.4,

  ease: 'power3.out',
} as const;

export { gsap, ScrollTrigger, SplitText };
