'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './Odometer.module.css';

type Props = {
  value: number;
  /** Rendered before the digits, e.g. "₹". */
  prefix?: string;
  /** Rendered after the digits, e.g. "%" or "+". */
  suffix?: string;
  label: string;
  sublabel?: string;
  /** 'display' is the section-heading size; 'inline' suits table rows. */
  size?: 'display' | 'inline';
  /** Visually hide the label when it already appears elsewhere in the layout. */
  hideLabel?: boolean;
  /** Digit grouping, e.g. 2099 shown as 2,099. Separators do not roll. */
  group?: boolean;
};

/** Two stacked 0-9 cycles, so even a target of 0 rolls a full rotation. */
const CYCLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const STRIP = [...CYCLE, ...CYCLE];
const STEP = 100 / STRIP.length; // 5% per digit

function restFor(digit: number) {
  return -(CYCLE.length + digit) * STEP;
}

/**
 * Motion M2 — odometer counter.
 *
 * Each digit is a column holding a 0-9 strip; the strip slides to its target.
 * The resting transform is applied inline during render, so the correct number
 * shows without JavaScript and under reduced motion. When motion is allowed,
 * GSAP animates from the top of the strip down to that same rest position.
 */
export function Odometer({
  value,
  prefix,
  suffix,
  label,
  sublabel,
  size = 'display',
  hideLabel = false,
  group = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Characters to render. Separators are passed through as strings and skipped
  // when assigning digit targets.
  const characters = useMemo(() => {
    const n = Math.abs(Math.trunc(value));
    return (group ? new Intl.NumberFormat('en-IN').format(n) : String(n)).split('');
  }, [value, group]);

  const digits = useMemo(
    () => characters.filter((c) => /\d/.test(c)).map(Number),
    [characters],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || !mounted || REDUCED()) return;

    const ctx = gsap.context(() => {
      const strips = gsap.utils.toArray<HTMLElement>(`.${styles.strip}`, el);

      strips.forEach((strip, i) => {
        gsap.fromTo(
          strip,
          { yPercent: 0 },
          {
            yPercent: restFor(digits[i]),
            duration: MOTION.odometerDuration,
            ease: MOTION.odometerEase,
            delay: i * MOTION.odometerStagger,
            scrollTrigger: revealTrigger(el, MOTION.startCounterPct),
          },
        );
      });
    }, el);

    return () => ctx.revert();
  }, [mounted, digits]);

  const spoken = `${prefix ?? ''}${characters.join('')}${suffix ?? ''}`;

  return (
    <div
      className={[styles.odometer, size === 'inline' && styles.inline].filter(Boolean).join(' ')}
      ref={ref}
    >
      <div className={styles.value} role="img" aria-label={`${spoken} ${label}`}>
        {prefix ? (
          <span className={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        ) : null}

        {characters.map((char, i) =>
          /\d/.test(char) ? (
            <div className={styles.column} key={i} aria-hidden="true">
              <div
                className={styles.strip}
                style={
                  mounted && !REDUCED()
                    ? undefined
                    : { transform: `translateY(${restFor(Number(char))}%)` }
                }
              >
                {STRIP.map((n, j) => (
                  <span className={styles.digit} key={j}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className={styles.prefix} key={i} aria-hidden="true">
              {char}
            </span>
          ),
        )}

        {suffix ? (
          <span className={styles.suffix} aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>

      <p className={hideLabel ? styles.srOnly : styles.label}>{label}</p>
      {sublabel ? <p className={styles.sublabel}>{sublabel}</p> : null}
    </div>
  );
}
