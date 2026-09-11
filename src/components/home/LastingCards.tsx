'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { lastingCards, type LastingCardIcon } from '@/data/home';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './LastingCards.module.css';

const cardIcons = {
  site: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22h22M6 22V11l8-6 8 6v11" />
      <path d="M14 5V2M22 8l2.5-2M6 8 3.5 6" />
    </svg>
  ),
  load: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 23 14 5l10 18M8 17h12M4 23h20" />
    </svg>
  ),
  detail: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h20v20H4z" />
      <path d="M4 11h20M11 4v20" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  material: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h22v14H3z" />
      <path d="M3 14h22M10 7v7M18 14v7" />
    </svg>
  ),
  less: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v22M6 9h16M8 17h12" />
      <path d="m9 6 5-3 5 3" />
    </svg>
  ),
  record: (
    <svg viewBox="0 0 28 28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h16v22H6z" />
      <path d="M10 9h8M10 14h8M10 19h5" />
    </svg>
  ),
} satisfies Record<LastingCardIcon, ReactNode>;

/**
 * Architectural Stacked Specimen Deck
 *
 * All 6 principles sit directly stacked back-to-back in a physical card pile:
 * - Zero page overflow: centered, contained stage
 * - Click on card deals / advances to the next principle
 * - Prev / Next buttons and pill tabs for precise control
 * - Dedicated 3D flip button (`Spec ⤾`) to reveal technical engineering blueprints
 */
export function LastingCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const totalCards = lastingCards.cards.length;

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(idx, totalCards - 1)));
  }, [totalCards]);

  const prev = useCallback(() => {
    setActiveIndex((current) => (current > 0 ? current - 1 : totalCards - 1));
  }, [totalCards]);

  const next = useCallback(() => {
    setActiveIndex((current) => (current < totalCards - 1 ? current + 1 : 0));
  }, [totalCards]);

  const toggleFlip = useCallback((idx: number) => {
    setFlippedCards((prevMap) => ({
      ...prevMap,
      [idx]: !prevMap[idx],
    }));
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFlip(activeIndex);
      }
    },
    [activeIndex, next, prev, toggleFlip]
  );

  // Touch gesture support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  // Entry reveal animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(container, {
        y: MOTION.riseY,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: revealTrigger(container),
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <Section background="surface" tight className={styles.lastingSection} aria-labelledby="lasting-title">
      <SectionHeader
        id="lasting-title"
        eyebrow={lastingCards.eyebrow}
        title={lastingCards.title}
      />

      <div
        className={styles.deckStage}
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Interactive architectural principles deck"
      >
        {/* Main Deck Container with Flanking Side Navigation Buttons */}
        <div className={styles.deckSection}>
          <button
            type="button"
            className={`${styles.sideNavButton} ${styles.sideNavPrev}`}
            onClick={prev}
            aria-label="Previous principle card"
          >
            <svg viewBox="0 0 32 32" className={styles.arrowIcon} aria-hidden="true">
              <line x1="23" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <polyline points="15 10 9 16 15 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* The Stack Stage */}
          <div className={styles.stackStage}>
            {lastingCards.cards.map((card, i) => {
              const diff = i - activeIndex;
              const isActive = diff === 0;
              const isFlipped = !!flippedCards[i];
              const isBehind = diff > 0;
              const isPast = diff < 0;

              // Stack layer offset
              const stackDepth = Math.abs(diff);
              // Alternate peek direction: odd layers peek right, even layers peek left
              const peekDir = diff % 2 === 1 ? 1 : -1;

              const styleVars: CSSProperties = {
                '--depth': stackDepth,
                '--peek-dir': peekDir,
                zIndex: isActive ? 30 : isBehind ? 20 - diff : 10 + diff,
              } as CSSProperties;

              let cardStateClass = '';
              if (isActive) cardStateClass = styles.isActive;
              else if (isBehind) cardStateClass = styles.isBehind;
              else if (isPast) cardStateClass = styles.isPast;

              return (
                <div
                  key={card.title}
                  className={`${styles.cardWrapper} ${cardStateClass} ${
                    isFlipped ? styles.isFlipped : ''
                  }`}
                  style={styleVars}
                  onClick={() => {
                    if (isActive) {
                      next();
                    } else {
                      goTo(i);
                    }
                  }}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-pressed={isActive}
                  aria-label={`${card.title}. ${
                    isActive
                      ? 'Active card. Click to advance to next principle.'
                      : `Principle 0${i + 1}. Click to bring to top.`
                  }`}
                >
                  {/* 3D Inner Card flipper */}
                  <div className={styles.cardInner}>
                    {/* FRONT FACE: Architectural Editorial Plate */}
                    <article className={`${styles.cardFace} ${styles.cardFaceFront}`}>
                      <div className={styles.topRow}>
                        <div className={styles.indexBadge}>
                          <span className={styles.counter}>
                            {String(i + 1).padStart(2, '0')} /{' '}
                            {String(totalCards).padStart(2, '0')}
                          </span>
                          <span className={styles.tag}>{card.tag}</span>
                        </div>

                        <button
                          type="button"
                          className={styles.flipPill}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlip(i);
                          }}
                          title="Flip card to view technical blueprint"
                          aria-label="Flip to engineering blueprint"
                        >
                          <span className={styles.flipPillText}>Spec</span>
                          <span className={styles.flipPillIcon} aria-hidden="true">
                            ⤾
                          </span>
                        </button>
                      </div>

                      <div className={styles.bodyContent}>
                        <div className={styles.iconAndHeading}>
                          <div className={styles.iconWrap} aria-hidden="true">
                            {cardIcons[card.icon]}
                          </div>
                          <h3 className={styles.title}>{card.title}</h3>
                        </div>
                        <p className={styles.body}>{card.body}</p>
                      </div>

                      <div className={styles.mediaWrap}>
                        <Image
                          src={card.image}
                          alt={card.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 440px, 90vw"
                          className={styles.cardImage}
                          priority={i === 0}
                        />
                        <div className={styles.photoOverlay}>
                          <span className={styles.overlayPrompt}>
                            Click card for next · Spec ⤾ for blueprint
                          </span>
                        </div>
                      </div>
                    </article>

                    {/* BACK FACE: Technical Engineering Blueprint */}
                    <div
                      className={`${styles.cardFace} ${styles.cardFaceBack}`}
                      aria-hidden={!isFlipped}
                    >
                      <div className={styles.blueprintHeader}>
                        <div className={styles.blueprintMeta}>
                          <span className={styles.cadRef}>{card.blueprint.cadRef}</span>
                          <span className={styles.blueprintStandard}>
                            {card.blueprint.standard}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.flipPillBack}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlip(i);
                          }}
                          title="Flip back to finished architectural photo"
                          aria-label="Flip back to photo"
                        >
                          <span className={styles.flipPillText}>Photo</span>
                          <span className={styles.flipPillIcon} aria-hidden="true">
                            ⤾
                          </span>
                        </button>
                      </div>

                      <div className={styles.blueprintBody}>
                        <div className={styles.blueprintTitleBlock}>
                          <span className={styles.blueprintEyebrow}>Technical Specification</span>
                          <h4 className={styles.blueprintTitle}>{card.title}</h4>
                        </div>

                        <div className={styles.specMetricBox}>
                          <span className={styles.metricLabel}>Required Tolerance</span>
                          <span className={styles.metricValue}>{card.blueprint.tolerance}</span>
                        </div>

                        <div className={styles.specDetailBlock}>
                          <span className={styles.metricLabel}>Method & Protocol</span>
                          <p className={styles.specText}>{card.blueprint.spec}</p>
                        </div>
                      </div>

                      <div className={styles.blueprintFooter}>
                        <div className={styles.cadCrosshair} aria-hidden="true">
                          <svg viewBox="0 0 40 40" className={styles.crosshairSvg}>
                            <line x1="0" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                            <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                            <circle cx="20" cy="20" r="2" fill="currentColor" />
                          </svg>
                        </div>
                        <span className={styles.sealText}>ASTHIWAR // AS-BUILT ACCREDITED</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={`${styles.sideNavButton} ${styles.sideNavNext}`}
            onClick={next}
            aria-label="Next principle card"
          >
            <svg viewBox="0 0 32 32" className={styles.arrowIcon} aria-hidden="true">
              <line x1="9" y1="16" x2="23" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <polyline points="17 10 23 16 17 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Quick Index Selection Tabs Below */}
        <div className={styles.indexTabs} role="tablist" aria-label="Card indices">
          {lastingCards.cards.map((card, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={card.title}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.indexTab} ${isSelected ? styles.indexTabActive : ''}`}
                onClick={() => goTo(idx)}
                title={`Select principle 0${idx + 1}: ${card.title}`}
              >
                <span className={styles.tabNum}>{String(idx + 1).padStart(2, '0')}</span>
                <span className={styles.tabTitle}>{card.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Tactical Interaction Hint */}
        <div className={styles.interactionNotice}>
          <span>Click card or side arrow to advance</span>
          <span className={styles.noticeDot} aria-hidden="true">·</span>
          <span>Click Spec ⤾ for blueprint</span>
        </div>
      </div>
    </Section>
  );
}
