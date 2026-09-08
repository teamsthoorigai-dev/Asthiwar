'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';
import { gsap, REDUCED } from '@/lib/gsap';
import { lockScroll, unlockScroll } from '@/lib/lenis';
import { contact, primaryNav, serviceNav } from '@/data/nav';
import styles from './MenuOverlay.module.css';

const FOCUSABLE = 'a[href], button:not([disabled])';

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusTo: RefObject<HTMLElement | null>;
};

export function MenuOverlay({ open, onClose, returnFocusTo }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const links = [...primaryNav, ...serviceNav];

  // Scroll lock, focus management and Escape.
  useEffect(() => {
    const overlay = ref.current;
    if (!open || !overlay) return;

    lockScroll();

    // Captured now — the ref may point elsewhere by the time cleanup runs.
    const restoreFocusTo = returnFocusTo.current;
    const focusables = () => Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
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
      restoreFocusTo?.focus();
    };
  }, [open, onClose, returnFocusTo]);

  // Motion M5 — links stagger in.
  useEffect(() => {
    const overlay = ref.current;
    if (!open || !overlay || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.item}`,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06 },
      );
    }, overlay);

    return () => ctx.revert();
  }, [open]);

  return (
    <div
      ref={ref}
      id="site-menu"
      className={styles.overlay}
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <div className={styles.top}>
        <Link href="/" onClick={onClose} aria-label="ASTHIWAR home">
          <Image
            src="/brand/asthiwar-logo-black.png"
            alt="ASTHIWAR"
            width={160}
            height={28}
            className={styles.logo}
          />
        </Link>

        <button type="button" className={styles.close} onClick={onClose}>
          <span className={styles.closeIcon} aria-hidden="true" />
          Close
        </button>
      </div>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label="Menu">
          {links.map((item) => (
            <div className={styles.item} key={item.href}>
              <Link href={item.href} className={styles.link} onClick={onClose}>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className={styles.meta}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Phone</p>
            <p className={styles.metaValue}>{contact.phone}</p>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Email</p>
            <p className={styles.metaValue}>{contact.email}</p>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Studio</p>
            <p className={styles.metaValue}>{contact.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
