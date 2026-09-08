'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, MOTION, REDUCED } from '@/lib/gsap';
import styles from './Marquee.module.css';

export type MarqueeItem = {
  label: string;
  icon?: ReactNode;
};

type Props = {
  items: MarqueeItem[];
  /** Seconds for one full loop. Higher is slower. */
  speed?: number;
  'aria-label'?: string;
};

/**
 * Motion M4 — seamless infinite marquee.
 *
 * The item set is rendered twice and the track is moved by exactly -50%, so the
 * loop point is invisible. The first set is a real list; the duplicate is hidden
 * from assistive tech. Pauses on hover and on keyboard focus within.
 */
export function Marquee({ items, speed = MOTION.marqueeDuration, ...rest }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || REDUCED()) return;

    const ctx = gsap.context(() => {
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        duration: speed,
        ease: 'none',
      });
    }, track);

    return () => {
      tweenRef.current = null;
      ctx.revert();
    };
  }, [speed, items.length]);

  const pause = () => tweenRef.current?.pause();
  const play = () => tweenRef.current?.play();

  const renderSet = (duplicate: boolean) => (
    <ul className={styles.set} aria-hidden={duplicate || undefined}>
      {items.map((item, i) => (
        <li className={styles.item} key={`${item.label}-${i}`}>
          {item.icon ? (
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
          ) : (
            <span className={styles.dot} aria-hidden="true" />
          )}
          <span className={styles.label}>{item.label}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={styles.marquee}
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocusCapture={pause}
      onBlurCapture={play}
      aria-label={rest['aria-label']}
    >
      <div className={styles.track} ref={trackRef}>
        {renderSet(false)}
        {renderSet(true)}
      </div>
    </div>
  );
}
