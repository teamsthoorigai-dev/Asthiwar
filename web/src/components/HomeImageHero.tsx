'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

import styles from './HomeImageHero.module.css';

export function HomeImageHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    document.body.classList.add('home-image-hero-active');
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle('home-image-hero-active', entry?.isIntersecting ?? false);
      },
      { threshold: 0.08 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove('home-image-hero-active');
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero} aria-labelledby="home-hero-title">
      <Image
        className={styles.image}
        src="/images/sustainable.jpg"
        alt="Earthen masonry and a perforated screen shown in direct sunlight"
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.scrim} aria-hidden="true" />

      {/* <svg
        className={styles.structure}
        viewBox="0 0 900 900"
        role="presentation"
        aria-hidden="true"
      >
        <g className={styles.ghost}>
          <path d="M100 725H805V175H365V330H100Z" />
          <path d="M170 725V435H365V725M365 330H595V725M595 480H805M595 175V480" />
          <path d="M430 725V510H540V725" />
          <path d="M170 435 365 330 595 175 805 175" />
        </g>
        <g className={styles.drawn}>
          <path pathLength="1" d="M100 725H805V175H365V330H100Z" />
          <path
            pathLength="1"
            d="M170 725V435H365V725M365 330H595V725M595 480H805M595 175V480"
          />
          <path pathLength="1" d="M430 725V510H540V725" />
          <path
            pathLength="1"
            className={styles.bronze}
            d="M170 435 365 330 595 175 805 175"
          />
        </g>
        <g className={styles.dimensions}>
          <line x1="100" y1="768" x2="805" y2="768" className={styles.bronze} />
          <line x1="100" y1="755" x2="100" y2="782" />
          <line x1="805" y1="755" x2="805" y2="782" />
          <polyline className={styles.bronze} points="100,120 100,93 260,93" />
        </g>
      </svg> */}

      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`eyebrow ${styles.eyebrow}`}>Sustainable by design</p>
          <h1 id="home-hero-title">
            Comfort
            <br />
            designed in, before
            <br />
            energy is spent.
          </h1>
          <p className={styles.intro}>
            Natural cooling, lower-carbon material choices, and healthier spaces are considered
            before mechanical energy is added.
          </p>
          <div className={styles.actions}>
            <Link href="/cost-calculator" className="button button--outline-light">
              Cost calculator <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className={styles.note} aria-hidden="true">
          01 — Structure
        </p>
        <div className={styles.scrollCue} aria-hidden="true">
          <span>Scroll to explore</span>
          <ArrowDown size={14} />
        </div>
      </div>
    </section>
  );
}
