'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, MOTION, REDUCED } from '@/lib/gsap';
import styles from './Marquee.module.css';

export type MarqueeItem = {
  /** Used as the key and as the accessible name. */
  label: string;
  /**
   * Authored line break for the `band` variant, which sets the label two-up
   * under the mark. Falls back to `label` on one line.
   */
  lines?: readonly string[];
  icon?: ReactNode;
};

type Props = {
  items: readonly MarqueeItem[];
  /** Seconds for one full loop. Higher is slower. */
  speed?: number;
  /**
   * `inline` — items run along one row, icon beside label.
   * `band` — each set is a full-width four-column grid, mark above label.
   */
  variant?: 'inline' | 'band';
  /** Travel direction of the content itself. */
  direction?: 'left' | 'right';
  'aria-label'?: string;
};

/**
 * Motion M4 — seamless infinite marquee.
 *
 * The item set is rendered twice and the track is moved by exactly -50%, so the
 * loop point is invisible. The first set is a real list; the duplicate is hidden
 * from assistive tech. Pauses on hover and on keyboard focus within.
 */
export function Marquee({
  items,
  speed = MOTION.marqueeDuration,
  variant = 'inline',
  direction = 'left',
  ...rest
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || REDUCED()) return;

    const ctx = gsap.context(() => {
      // Content drifting right is the same loop run backwards: park the track a
      // full set to the left and bring it home, so the seam still lands at -50%.
      tweenRef.current =
        direction === 'right'
          ? gsap.fromTo(
              track,
              { xPercent: -50 },
              { xPercent: 0, repeat: -1, duration: speed, ease: 'none' },
            )
          : gsap.to(track, { xPercent: -50, repeat: -1, duration: speed, ease: 'none' });
    }, track);

    return () => {
      tweenRef.current = null;
      ctx.revert();
    };
  }, [speed, direction, items.length]);

  const pause = () => tweenRef.current?.pause();
  const play = () => tweenRef.current?.play();

  const renderSet = (duplicate: boolean) => (
    <ul className={styles.set} aria-hidden={duplicate || undefined}>
      {items.map((item, i) => {
        const stacked = variant === 'band' && Boolean(item.lines);
        return (
          // The authored break would otherwise be read as two fragments with no
          // space between them, so a stacked item names itself and hides its
          // visual text.
          <li
            className={styles.item}
            key={`${item.label}-${i}`}
            aria-label={stacked ? item.label : undefined}
          >
            {item.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
            ) : (
              <span className={styles.dot} aria-hidden="true" />
            )}
            <span className={styles.label} aria-hidden={stacked || undefined}>
              {stacked ? item.lines?.map((line) => <span key={line}>{line}</span>) : item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={`${styles.marquee} ${styles[variant]}`}
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocusCapture={pause}
      onBlurCapture={play}
      role="group"
      tabIndex={0}
      aria-label={rest['aria-label']}
    >
      <div className={styles.track} ref={trackRef}>
        {renderSet(false)}
        {renderSet(true)}
      </div>
    </div>
  );
}
