'use client';

import { useEffect, useState } from 'react';
import { warmFrames } from '@/lib/frameSequence';
import { REDUCED, ScrollTrigger } from '@/lib/gsap';
import { idle, isDataConstrained, pageLoaded, warmPageImages } from '@/lib/preload';
import styles from './SiteLoader.module.css';

const MIN_VISIBLE_MS = 600;
const MAX_WAIT_MS = 2500;
const LEAVE_MS = 600;

const BLOCKED_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Tab']);

const IMAGE_CONCURRENCY = 3;
const FRAME_CONCURRENCY = 4;
const FRAME_PROBE_BUDGET_MS = 3000;

/**
 * Initial brand loader:
 *
 * Holds the viewport with the Asthiwar building mark until the fonts,
 * layout, and LogoReveal are ready. Once ready, it seamlessly dissolves into
 * the live LogoReveal and begins background eager preloading.
 */
export function SiteLoader() {
  const [phase, setPhase] = useState<'showing' | 'leaving' | 'gone'>('showing');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Block scrolling while loader is visible
    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const blockKeys = (event: KeyboardEvent) => {
      if (BLOCKED_KEYS.has(event.key)) block(event);
    };
    const blocking = { capture: true, passive: false } as const;
    window.addEventListener('wheel', block, blocking);
    window.addEventListener('touchmove', block, blocking);
    window.addEventListener('keydown', blockKeys, true);
    const unblock = () => {
      window.removeEventListener('wheel', block, blocking);
      window.removeEventListener('touchmove', block, blocking);
      window.removeEventListener('keydown', blockKeys, true);
    };

    const after = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms - performance.now())));

    let leaveTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      const fontsPromise =
        typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve();

      // Wait until content and fonts are loaded
      await Promise.race([
        Promise.all([pageLoaded(), fontsPromise]),
        after(MAX_WAIT_MS),
      ]);

      // Ensure minimum display beat so it reads cleanly
      await after(MIN_VISIBLE_MS);
      if (signal.aborted) return;

      unblock();
      ScrollTrigger.refresh();

      setPhase('leaving');
      leaveTimer = setTimeout(() => {
        setPhase('gone');
        ScrollTrigger.refresh();
      }, REDUCED() ? 0 : LEAVE_MS);

      await warmAhead(signal);
    })();

    return () => {
      controller.abort();
      unblock();
      clearTimeout(leaveTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={styles.overlay} data-phase={phase} aria-live="polite">
      <div className={styles.loaderBox}>
        <div className={styles.spinner} role="status" aria-label="Loading content" />
        <span className={styles.brand}>ASTHIWAR</span>
      </div>

      <noscript>
        <style>{`.${styles.overlay}{display:none}`}</style>
      </noscript>
    </div>
  );
}

/**
 * Background resource preloader:
 * Streams upcoming assets quietly without competing with initial render or user input.
 */
async function warmAhead(signal: AbortSignal): Promise<void> {
  if (isDataConstrained()) return;
  await pageLoaded();
  await idle();
  if (signal.aborted) return;

  await warmPageImages(signal, IMAGE_CONCURRENCY);
  if (signal.aborted) return;

  // Under reduced motion /projects shows only its poster, so the frames are skipped.
  if (!REDUCED()) {
    const frames = await warmFrames({
      concurrency: FRAME_CONCURRENCY,
      signal,
      probeBudgetMs: FRAME_PROBE_BUDGET_MS,
    });
    // The first frames doubled as a speed test. A link too slow for the frames
    // is too slow for the project photos as well.
    if (frames !== 'done') return;
  }

  const { warmProjectImages } = await import('@/lib/projectImages');
  if (!signal.aborted) await warmProjectImages(signal);
}
