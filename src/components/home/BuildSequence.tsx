'use client';

import { useEffect, useRef } from 'react';
import { buildSequence } from '@/data/home';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import styles from './BuildSequence.module.css';

const { frameCount, framePath, captions } = buildSequence;

/** How many frames to fetch at once while filling in the sequence. */
const CONCURRENCY = 6;

/**
 * Homepage section 13 — a scroll-driven canvas frame sequence over 300 stills.
 *
 * Novascape's equivalent is a lazy video embed; this is the section that beats
 * the reference. WebP frames load progressively only as the section approaches,
 * and the canvas always draws the nearest frame that has arrived, so scrubbing
 * stays responsive while loading continues.
 *
 * Below lg, and under reduced motion, the canvas is hidden by CSS and a single
 * static poster frame is shown instead — no pin, no scrubbing, no preloading.
 */
export function BuildSequence() {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas || REDUCED()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      let stopSequence: (() => void) | undefined;

      const startSequence = () => {
        const ctx2d = canvas.getContext('2d', { alpha: false });
        if (!ctx2d) return () => {};

        const images: HTMLImageElement[] = new Array(frameCount);
        const loaded: boolean[] = new Array(frameCount).fill(false);
        let current = -1;
        let cancelled = false;

        const sizeCanvas = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.round(canvas.clientWidth * dpr);
          const h = Math.round(canvas.clientHeight * dpr);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
        };

        /** object-fit: cover, done by hand. */
        const paint = (img: HTMLImageElement) => {
          sizeCanvas();
          const scale = Math.max(
            canvas.width / img.naturalWidth,
            canvas.height / img.naturalHeight,
          );
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          ctx2d.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
        };

        const nearestLoaded = (index: number) => {
          if (loaded[index]) return index;
          for (let d = 1; d < frameCount; d += 1) {
            if (index - d >= 0 && loaded[index - d]) return index - d;
            if (index + d < frameCount && loaded[index + d]) return index + d;
          }
          return -1;
        };

        const render = (index: number) => {
          const use = nearestLoaded(index);
          if (use === -1 || use === current) return;
          current = use;
          paint(images[use]);
        };

        const load = (index: number) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.src = framePath(index + 1);
            images[index] = img;
            const done = () => {
              loaded[index] = true;
              resolve();
            };
            img.onload = done;
            img.onerror = () => resolve();
          });

        // First frame immediately, then fill the rest in the background.
        load(0).then(() => {
          if (cancelled) return;
          canvas.classList.add(styles.canvasReady);
          render(0);

          let next = 1;
          const worker = async (): Promise<void> => {
            while (!cancelled && next < frameCount) {
              const index = next;
              next += 1;
              await load(index);
            }
          };
          void Promise.all(Array.from({ length: CONCURRENCY }, worker));
        });

        const trigger = ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            render(Math.round(self.progress * (frameCount - 1)));

            captions.forEach((caption, i) => {
              const node = captionRefs.current[i];
              if (!node) return;
              const distance = Math.abs(self.progress - caption.at);
              const opacity =
                distance < 0.08 ? 1 : distance < 0.16 ? (0.16 - distance) / 0.08 : 0;
              node.style.opacity = String(opacity);
            });
          },
        });

        const onResize = () => {
          current = -1;
          render(Math.round((trigger.progress || 0) * (frameCount - 1)));
        };
        window.addEventListener('resize', onResize);

        return () => {
          cancelled = true;
          window.removeEventListener('resize', onResize);
          trigger.kill();
          canvas.classList.remove(styles.canvasReady);
          images.forEach((image) => {
            image.onload = null;
            image.onerror = null;
            if (!image.complete) image.src = '';
          });
        };
      };

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting) || stopSequence) return;
          observer.disconnect();
          stopSequence = startSequence();
        },
        { rootMargin: '600px 0px' },
      );

      observer.observe(track);

      return () => {
        observer.disconnect();
        stopSequence?.();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="sequence-title">
      <div className={styles.track} ref={trackRef}>
        <div className={styles.stage}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-hidden="true"
          />

          {/* Carries the sequence description; shown until the first frame decodes and below lg. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.poster}
            src={framePath(1)}
            alt={buildSequence.posterAlt}
            width={1440}
            height={810}
            loading="lazy"
            decoding="async"
          />

          <div className={styles.overlay}>
            <h2 className={styles.title} id="sequence-title">
              {buildSequence.title}
            </h2>

            <div className={styles.captions}>
              {captions.map((caption, i) => (
                <p
                  key={caption.text}
                  ref={(node) => {
                    captionRefs.current[i] = node;
                  }}
                  className={[styles.caption, i === 0 && styles.captionStatic]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {caption.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
