'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, FLOAT, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './FloatImage.module.css';

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Motion F4 — image settle.
 *
 * Three nested layers, because F3 and F4 both write to `transform` and would
 * otherwise overwrite each other: the frame clips, `.settle` owns the scale,
 * and `.drift` is left free for useDepthDrift to scrub as the back layer.
 *
 * The wipe fires once per image for the life of the page. Re-revealing on
 * every re-entry is the tell of a site that wants to be noticed.
 */
export function FloatImage({ src, alt, sizes, priority, className }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const settle = settleRef.current;
    if (!frame || !settle || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });

      gsap.to(frame, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: FLOAT.settleDuration,
        ease: FLOAT.ease,
        scrollTrigger: revealTrigger(frame),
      });

      // Settles into place by the time the section is centred, then holds.
      gsap.fromTo(
        settle,
        { scale: FLOAT.settleFrom },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: frame,
            start: 'top bottom',
            end: 'center center',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, frame);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [src]);

  return (
    <div ref={frameRef} className={[styles.frame, className].filter(Boolean).join(' ')}>
      <div ref={settleRef} className={styles.settle}>
        <div className={styles.drift} data-drift="back">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes ?? '(max-width: 767px) 100vw, 60vw'}
            priority={priority}
            className={styles.image}
          />
        </div>
      </div>
    </div>
  );
}
