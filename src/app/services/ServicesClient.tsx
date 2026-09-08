'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { services } from '@/data/site';
import { gsap, REDUCED } from '@/lib/gsap';
import styles from './services.module.css';

const total = String(services.length).padStart(2, '0');

/**
 * Pinned Right-to-Left Horizontal Architectural Filmstrip.
 *
 * - Desktop (>= 1024px): Pinned ScrollTrigger scrub track translating sideways
 *   as the user scrolls down, complete with persistent HUD, jump tabs, and
 *   hairline progress bar.
 * - Mobile (< 1024px): Zero scroll hijacking; native CSS scroll-snap swipe
 *   allowing frictionless 60fps gesture scrolling with active panel tracking.
 * - Restores complete discipline substance: title, philosophy, capabilities
 *   matrix, execution sequence, and direct consultation CTA.
 */
export function ServicesClient() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const horizontalTweenRef = useRef<gsap.core.Tween | null>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const stage = stageWrapperRef.current;
    const track = trackRef.current;
    if (!stage || !track || REDUCED()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      // Calculate horizontal translate distance
      const getScrollDistance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -1 * getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          pin: true,
          scrub: 0.7,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleX(${self.progress})`;
            }
            const rawIndex = self.progress * (services.length - 1);
            const index = Math.min(
              Math.max(0, Math.round(rawIndex)),
              services.length - 1
            );
            setActiveIndex(index);
          },
        },
      });

      horizontalTweenRef.current = tween;

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        horizontalTweenRef.current = null;
        gsap.set(track, { clearProps: 'transform' });
      };
    });

    return () => mm.revert();
  }, []);

  // Jump to specific discipline panel smoothly
  const scrollToDiscipline = (index: number) => {
    if (window.innerWidth >= 1024 && horizontalTweenRef.current?.scrollTrigger) {
      const st = horizontalTweenRef.current.scrollTrigger;
      const targetScroll =
        st.start + (index / (services.length - 1)) * (st.end - st.start);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    } else {
      const targetPanel = panelRefs.current[index];
      if (targetPanel) {
        targetPanel.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
        setActiveIndex(index);
      }
    }
  };

  // Mobile horizontal scroll listener to update indicator & progress
  const handleMobileScroll = () => {
    const container = pinContainerRef.current;
    if (!container || window.innerWidth >= 1024) return;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;

    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${progress})`;
    }

    const itemWidth = container.clientWidth * 0.88;
    const current = Math.min(
      Math.max(0, Math.round(scrollLeft / itemWidth)),
      services.length - 1
    );
    setActiveIndex(current);
  };

  return (
    <div ref={stageWrapperRef} className={styles.stageWrapper}>
      {/* Persistent HUD */}
      <div className={styles.hud} aria-label="Services Navigation">
        <div className={styles.hudLeft}>
          <span className={styles.hudLabel}>Discipline Archive</span>
          <span className={styles.hudSeparator} aria-hidden="true" />
          <span className={styles.hudActiveIndex}>
            {services[activeIndex]?.title}
          </span>
        </div>

        <nav className={styles.hudTabs} aria-label="Discipline quick jump">
          {services.map((service, i) => (
            <button
              key={service.slug}
              type="button"
              onClick={() => scrollToDiscipline(i)}
              className={`${styles.hudTabBtn} ${
                activeIndex === i ? styles.hudTabBtnActive : ''
              }`}
              aria-current={activeIndex === i ? 'true' : undefined}
            >
              {service.index} {service.title}
            </button>
          ))}
        </nav>

        <div className={styles.hudRight}>
          <div className={styles.hudCounter} aria-live="polite">
            <span>{services[activeIndex]?.index ?? '01'}</span>
            <span className={styles.hudCounterTotal}>/ {total}</span>
          </div>

          <div className={styles.hudProgressTrack} aria-hidden="true">
            <div ref={progressBarRef} className={styles.hudProgressBar} />
          </div>
        </div>
      </div>

      {/* Horizontal track container */}
      <div
        ref={pinContainerRef}
        className={styles.pinContainer}
        onScroll={handleMobileScroll}
      >
        <div ref={trackRef} className={styles.track}>
          {services.map((service, i) => (
            <section
              key={service.slug}
              id={service.slug}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className={styles.panel}
              aria-labelledby={`discipline-${service.slug}`}
            >
              {/* Copy & Technical Specifications */}
              <div className={styles.panelContent}>
                <div className={styles.eyebrow}>
                  <span className={styles.indexNumber}>{service.index}</span>
                  <span className={styles.rule} aria-hidden="true" />
                  <span>{total}</span>
                </div>

                <h2 id={`discipline-${service.slug}`} className={styles.title}>
                  {service.title}
                </h2>

                <p className={styles.lead}>{service.short}</p>

                {/* Substantive Technical Matrix */}
                <div className={styles.specMatrix}>
                  <div className={styles.specCol}>
                    <h3 className={styles.specColTitle}>Scope & Capabilities</h3>
                    <ul className={styles.specList}>
                      {service.capabilities.map((cap) => (
                        <li key={cap} className={styles.specItem}>
                          <span className={styles.specBullet} aria-hidden="true">
                            ▪
                          </span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.specCol}>
                    <h3 className={styles.specColTitle}>Execution Protocol</h3>
                    <ol className={styles.specList}>
                      {service.process.map((step, stepIdx) => (
                        <li key={step} className={styles.specItem}>
                          <span className={styles.stepNumber}>
                            0{stepIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <Link
                  href={`/contact?discipline=${service.slug}`}
                  className={styles.link}
                >
                  Consult on {service.title}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Visual Frame */}
              <div className={styles.panelMedia}>
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className={styles.image}
                />
                <div className={styles.mediaCaption}>
                  <span>Asthiwar Specimen</span>
                  <span className={styles.mediaCaptionTag}>
                    Phase 0{i + 1} Record
                  </span>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className={styles.mobileHint} aria-hidden="true">
        <span>{services[activeIndex]?.index} / {total}</span>
        <span>&bull;</span>
        <span>Swipe horizontally to advance &rarr;</span>
      </div>
    </div>
  );
}

