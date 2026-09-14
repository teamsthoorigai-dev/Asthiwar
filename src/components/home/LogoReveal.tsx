'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AsthiwarWordmark, WORDMARK_GEOMETRY as GEO } from '@/components/brand/AsthiwarWordmark';
import { logoReveal } from '@/data/home';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import styles from './LogoReveal.module.css';

/** Mark height at rest, as a fraction of the viewport, and its ceiling in px. */
const MARK_VH = 0.46;
const MARK_MAX = 520;
/** Scroll distance the reveal occupies, as a fraction of the viewport. */
const SCRUB_VH = 0.9;
/** Timeline position at which the header takes the brand back. */
const HANDOFF_AT = 0.94;

/**
 * The homepage opening: the building mark alone, which scrolls out into the
 * full ASTHIWAR wordmark and hands the brand over to the header.
 *
 * The first viewport carries nothing else — no sales copy, no photograph. The
 * mark and the wordmark are the same SVG; the reveal scales the lockup down
 * about the mark's own centre while a centre-out wipe uncovers ASTH and WAR,
 * so the letters are drawn from the building rather than assembled beside it.
 *
 * The start state lives in CSS, not in JS, so the mark is what paints first on
 * a cold load. Reduced motion and no-JS both resolve to the finished wordmark.
 */
export function LogoReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const logo = logoRef.current;
    const foot = footRef.current;
    const cue = cueRef.current;
    if (!section || !stage || !logo || !foot || !cue) return;

    // The header owns the brand from the start when nothing is going to animate.
    if (REDUCED()) {
      document.body.dataset.heroBrand = 'shown';
      return () => {
        delete document.body.dataset.heroBrand;
      };
    }

    document.body.dataset.heroBrand = 'hidden';

    const setBrand = (progress: number) => {
      const next = progress > HANDOFF_AT ? 'shown' : 'hidden';
      if (document.body.dataset.heroBrand !== next) {
        document.body.dataset.heroBrand = next;
      }
    };

    const ctx = gsap.context(() => {
      /**
       * Scale that puts the mark at MARK_VH of the viewport. Read from the
       * computed width because transforms do not change it, so this stays
       * correct on every refresh rather than compounding.
       */
      const logoWidth = () => Number.parseFloat(getComputedStyle(logo).width);

      const startScale = () => {
        const markHeight = logoWidth() * GEO.aspect * GEO.markHeightRatio;
        if (!markHeight) return 1;
        return Math.max(1, Math.min(window.innerHeight * MARK_VH, MARK_MAX) / markHeight);
      };

      /**
       * Distance that puts the mark's own centre on the container's centre.
       * In pixels, not xPercent: GSAP parses the CSS start transform into `x`
       * and would then add `xPercent` on top of it, shifting the mark twice.
       */
      const markShift = () => -((GEO.markCenterPct - 50) / 100) * logoWidth();

      /** 0 = the mark alone, 1 = the whole wordmark. Mirrors the CSS start state. */
      const wipe = { open: 0 };

      const paintWipe = () => {
        const closed = 1 - wipe.open;
        const left = GEO.markLeftPct * closed;
        const right = (100 - GEO.markRightPct) * closed;
        logo.style.clipPath = `inset(0% ${right.toFixed(3)}% 0% ${left.toFixed(3)}%)`;
      };

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * SCRUB_VH}`,
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setBrand(self.progress),
        },
      });

      timeline
        .fromTo(
          logo,
          { scale: startScale, x: markShift, xPercent: 0 },
          { scale: 1, x: 0, xPercent: 0, duration: 0.55, ease: 'power1.inOut' },
          0,
        )
        // The wipe starts late on purpose: the mark settles towards its final
        // size first, so the letters arrive at a legible scale rather than
        // flying past the viewport edges.
        //
        // Driven as a number rather than by tweening the clip-path string:
        // GSAP's string interpolation mis-parses a four-value inset() and sends
        // the left edge to four-figure percentages, which pops ASTH into view
        // on the first frame instead of wiping it.
        .fromTo(
          wipe,
          { open: 0 },
          { open: 1, duration: 0.52, ease: 'power2.out', onUpdate: paintWipe },
          0.4,
        )
        // Arrives only once the wordmark is whole
        .fromTo(
          foot,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' },
          0.68,
        )
        .to(cue, { autoAlpha: 0, duration: 0.18, ease: 'none' }, 0)
        // Holds the finished composition for the last of the scrub, so it is
        // read as a landed state rather than glimpsed as the pin releases.
        .to({}, { duration: 0.08 }, 0.92);

      const trigger = timeline.scrollTrigger;
      if (trigger) setBrand(trigger.progress);
    }, section);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      delete document.body.dataset.heroBrand;
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="home-title">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.center}>
          <h1 id="home-title" className={styles.lockup}>
            <span className={styles.name}>ASTHIWAR</span>
            <AsthiwarWordmark ref={logoRef} className={styles.wordmark} />
          </h1>
        </div>

        <div ref={footRef} className={styles.foot}>
          <p className={styles.footNote}>
            <span className={styles.livePulse} aria-hidden="true" />
            {logoReveal.pricingNote}
          </p>

          <div className={styles.estimateTabWrap}>
            <Link href={logoReveal.estimateCta.href} className={styles.highlightedCta}>
              <span className={styles.ctaBadge}>{logoReveal.estimateCta.badge}</span>
              <span className={styles.ctaLabel}>{logoReveal.estimateCta.label}</span>
              <span className={styles.ctaArrow} aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <span ref={cueRef} className={styles.cue} aria-hidden="true" />
      </div>

      <noscript>
        <style>
          {`.${styles.wordmark}{transform:none;clip-path:none}` +
            `.${styles.foot}{opacity:1}` +
            `.${styles.cue}{display:none}`}
        </style>
      </noscript>
    </section>
  );
}
