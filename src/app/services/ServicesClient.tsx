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

    // Calculate horizontal translate distance dynamically
    const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const tween = gsap.to(track, {
      x: () => -1 * getScrollDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: stage,
        pin: true,
        scrub: 0.6,
        start: 'top top',
        end: () => `+=${getScrollDistance()}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
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

    // Refresh ScrollTrigger after initial mount and asset render
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('resize', onResize);
      tween.scrollTrigger?.kill();
      tween.kill();
      horizontalTweenRef.current = null;
      gsap.set(track, { clearProps: 'transform' });
    };
  }, []);

  // Jump to specific discipline panel smoothly
  const scrollToDiscipline = (index: number) => {
    const st = horizontalTweenRef.current?.scrollTrigger;
    if (st) {
      const targetScroll =
        st.start + (index / (services.length - 1)) * (st.end - st.start);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
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

