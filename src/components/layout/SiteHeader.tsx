'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AsthiwarWordmark } from '@/components/brand/AsthiwarWordmark';
import { primaryNav } from '@/data/nav';
import { MenuOverlay } from './MenuOverlay';
import styles from './SiteHeader.module.css';

const SOLID_AFTER = 80;

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // On the homepage the wordmark belongs to the hero until its reveal finishes;
  // LogoReveal hands it back by setting body[data-hero-brand="shown"].
  const brandLocked = pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > SOLID_AFTER);
      // Never hide while the menu is open, or near the very top.
      setHidden(!menuOpen && y > SOLID_AFTER * 2 && y > lastY.current);
      lastY.current = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  const isDarkHero = pathname === '/projects';

  return (
    <>
      <header
        className={[
          styles.header,
          solid && styles.solid,
          hidden && styles.hidden,
          isDarkHero && styles.darkHero,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.inner}>
          <div className={styles.left}>
            <button
              type="button"
              ref={triggerRef}
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className={styles.bars} aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M0 6.666H20M0 14.166H20" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </span>
              Menu
            </button>

            <nav className={styles.inlineNav} aria-label="Primary">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[styles.navLink, pathname === item.href && styles.active]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/"
            className={[styles.brand, brandLocked && styles.brandLocked]
              .filter(Boolean)
              .join(' ')}
            aria-label="ASTHIWAR home"
          >
            <AsthiwarWordmark className={styles.logo} />
          </Link>

          <div className={styles.right}>
            <Link
              href="/contact"
              className={styles.ctaButton}
            >
              <span className={styles.ctaLabel}>
                <span className={styles.ctaFull}>
                  BOOK CONSULTATION <ArrowUpRight size={14} strokeWidth={2.2} className={styles.ctaArrow} aria-hidden="true" />
                </span>
                <span className={styles.ctaShort}>
                  CONSULT <ArrowUpRight size={13} strokeWidth={2.2} className={styles.ctaArrow} aria-hidden="true" />
                </span>
              </span>
              <span className={styles.ctaBlock} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Without JS the reveal never runs, so the hero keeps the finished
            wordmark and the header may as well carry its own. */}
        {brandLocked ? (
          <noscript>
            <style>{`.${styles.brandLocked}{opacity:1;visibility:visible}`}</style>
          </noscript>
        ) : null}
      </header>

      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        returnFocusTo={triggerRef}
      />
    </>
  );
}
