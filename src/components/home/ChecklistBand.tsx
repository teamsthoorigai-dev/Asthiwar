'use client';

import { useEffect, useRef } from 'react';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { checklistBand } from '@/data/home';
import { gsap, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './ChecklistBand.module.css';

const { eyebrow, count, title, body } = checklistBand;
const items: ReadonlyArray<{ title: string; detail?: string }> = checklistBand.items;

const pad = (n: number) => String(n).padStart(2, '0');

/** Seconds between one row starting to tick and the next. */
const ROW_STAGGER = 0.2;

/**
 * The 750+ checklist band, between cost and work.
 *
 * A sample of the checks laid out as a ruled sheet. When the list scrolls into
 * view they are ticked off one after another, top to bottom, the way an
 * inspector signs off a site walk: the row's rule draws across, the box fills,
 * the tick draws itself and the words settle into place.
 *
 * The markup is the finished state — every box ticked, every line at full ink —
 * so the band reads correctly without JavaScript and under reduced motion. The
 * effect winds it back to unchecked and plays it forward once.
 */
export function ChecklistBand() {
  const listRef = useRef<HTMLOListElement>(null);
  const tallyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const tally = tallyRef.current;
    if (!list || !tally || REDUCED()) return;

    const ctx = gsap.context(() => {
      // 0.7 rather than the default 0.85: the list is tall, and at 0.85 the
      // bottom rows would tick before they had scrolled into view.
      const tl = gsap.timeline({ scrollTrigger: revealTrigger(list, 0.7) });

      Array.from(list.children).forEach((row, i) => {
        const at = i * ROW_STAGGER;
        const rule = row.querySelector(`.${styles.rule}`);
        const fill = row.querySelector(`.${styles.fill}`);
        const tick = row.querySelector(`.${styles.tick} path`);
        const words = row.querySelectorAll(`.${styles.text}, .${styles.detail}`);
        const index = row.querySelector(`.${styles.index}`);

        tl.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: 'power3.inOut', clearProps: 'transform' },
          at,
        )
          .fromTo(
            words,
            { x: -14, opacity: 0.2 },
            { x: 0, opacity: 1, duration: 0.8, clearProps: 'transform,opacity' },
            at + 0.1,
          )
          .fromTo(
            fill,
            { scale: 0 },
            { scale: 1, duration: 0.45, ease: 'back.out(2)', clearProps: 'transform' },
            at + 0.2,
          )
          // The dash is applied only while it animates, so a browser that
          // ignored pathLength would show a plain tick, not a dotted one.
          .fromTo(
            tick,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.4,
              ease: 'power2.out',
              clearProps: 'strokeDasharray,strokeDashoffset',
            },
            at + 0.32,
          )
          .fromTo(
            index,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, clearProps: 'opacity' },
            at + 0.35,
          );
      });

      tl.fromTo(
        tally,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, clearProps: 'opacity' },
        items.length * ROW_STAGGER,
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="checklist-title">
      <div className={styles.grid}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <SplitHeading as="h2" id="checklist-title" className={styles.title}>
            {`${count} ${title}`}
          </SplitHeading>
        </header>

        <p className={styles.body}>{body}</p>

        {/* role="list": Safari drops list semantics from a list whose bullets are removed. */}
        <ol className={styles.list} role="list" ref={listRef}>
          {items.map((item, i) => (
            <li className={styles.item} key={item.title}>
              <span className={styles.box} aria-hidden="true">
                <span className={styles.fill} />
                <svg className={styles.tick} viewBox="0 0 24 24">
                  <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
                </svg>
              </span>
              <span className={styles.copy}>
                <span className={styles.text}>{item.title}</span>
                {item.detail ? <span className={styles.detail}>{item.detail}</span> : null}
              </span>
              <span className={styles.index} aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className={styles.rule} aria-hidden="true" />
            </li>
          ))}
        </ol>

        <p className={styles.tally} ref={tallyRef}>
          {pad(items.length)} of {count} checks shown
        </p>
      </div>
    </section>
  );
}
