'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { lockScroll, unlockScroll } from '@/lib/lenis';
import styles from './ProjectGallery.module.css';

type Shot = { src: string; alt: string };

const FOCUSABLE = 'button:not([disabled]), a[href]';

export function ProjectGallery({ shots, title }: { shots: readonly Shot[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? null : (i + delta + shots.length) % shots.length)),
    [shots.length],
  );

  useEffect(() => {
    const lightbox = lightboxRef.current;
    if (open === null || !lightbox) return;

    lockScroll();
    const restoreTo = openerRef.current;
    closeRef.current?.focus();
    const focusables = () => Array.from(lightbox.querySelectorAll<HTMLElement>(FOCUSABLE));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') {
        step(1);
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      }

      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!lightbox.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
      restoreTo?.focus();
    };
  }, [open, close, step]);

  const current = open === null ? null : shots[open];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Do not close if clicking directly inside the navigation controls or close button
    if (target.closest(`.${styles.nav}`) || target.closest(`.${styles.close}`)) {
      return;
    }
    close();
  };

  return (
    <>
      <div className={styles.grid}>
        {shots.map((shot, i) => (
          <button
            key={`${shot.src}-${i}`}
            type="button"
            className={styles.tile}
            aria-label={`View image ${i + 1} of ${shots.length}`}
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              setOpen(i);
            }}
          >
            <Image
              src={shot.src}
              alt={shot.alt || ''}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className={styles.image}
            />
          </button>
        ))}
      </div>

      <div
        ref={lightboxRef}
        className={styles.lightbox}
        hidden={open === null}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} gallery`}
        onClick={handleBackdropClick}
        onDragStart={(e) => e.preventDefault()}
        data-cursor="close"
      >
        <button ref={closeRef} type="button" className={styles.close} onClick={close}>
          Close
        </button>

        {current ? (
          <figure className={styles.figure}>
            <Image
              src={current.src}
              alt={current.alt || `${title} — image ${(open ?? 0) + 1}`}
              fill
              sizes="100vw"
              className={styles.lightboxImage}
              draggable={false}
              priority
            />
          </figure>
        ) : null}

        {shots.length > 1 ? (
          <div className={styles.nav}>
            <button type="button" className={styles.navButton} onClick={() => step(-1)}>
              Previous
            </button>
            <span>
              {(open ?? 0) + 1} / {shots.length}
            </span>
            <button type="button" className={styles.navButton} onClick={() => step(1)}>
              Next
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
