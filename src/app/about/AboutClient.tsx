'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { SplitHeading } from '@/components/ui/SplitHeading';
import {
  aboutDuality,
  aboutPrinciples,
  aboutStages,
  aboutStudio,
} from '@/data/about';
import { gsap, MOTION, REDUCED } from '@/lib/gsap';
import { DualityBalance } from '@/components/about/DualityBalance';
import { MaterialSwatchDrawer } from '@/components/about/MaterialSwatchDrawer';
import styles from './about.module.css';

export function AboutClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || REDUCED()) return;

    const ctx = gsap.context(() => {
      // M5 reveal on blocks
      const sections = root.querySelectorAll(`.${styles.section}`);
      sections.forEach((section) => {
        const blocks = section.querySelectorAll('[data-rise-block]');
        if (!blocks.length) return;

        gsap.fromTo(
          blocks,
          { y: MOTION.riseY, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: MOTION.riseStagger,
            scrollTrigger: {
              trigger: section,
              start: MOTION.start,
              once: true,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* 2. Two ways of seeing / one building */}
      <section
        className={styles.section}
        aria-labelledby="duality-heading"
      >
        <div className={styles.inner}>
          <header className={styles.dualityHeader}>
            <p className={styles.eyebrow}>{aboutDuality.eyebrow}</p>
            <SplitHeading
              as="h2"
              id="duality-heading"
              className={styles.sectionTitle}
            >
              {`${aboutDuality.architecture.statement} ${aboutDuality.engineering.statement}`}
            </SplitHeading>
          </header>

          <div className={styles.dualityGrid} data-rise-block>
            {/* Left: Architecture */}
            <article className={styles.dualityCard}>
              <span className={styles.cardIndex}>
                {aboutDuality.architecture.index}
              </span>
              <h3 className={styles.cardHeading}>
                {aboutDuality.architecture.aspects}
              </h3>
              <p className={styles.cardPerspective}>
                {aboutDuality.architecture.perspective}
              </p>
            </article>

            {/* Right: Engineering */}
            <article className={styles.dualityCard}>
              <span className={styles.cardIndex}>
                {aboutDuality.engineering.index}
              </span>
              <h3 className={styles.cardHeading}>
                {aboutDuality.engineering.aspects}
              </h3>
              <p className={styles.cardPerspective}>
                {aboutDuality.engineering.perspective}
              </p>
            </article>
          </div>

          <div className={styles.dualityResolution} data-rise-block>
            <p className={styles.resolutionText}>
              {aboutDuality.resolution}
            </p>
          </div>

          <DualityBalance />
        </div>
      </section>

      {/* 3. What remains constant */}
      <section
        className={`${styles.section} ${styles.surfaceSection}`}
        aria-labelledby="principles-heading"
      >
        <div className={styles.inner}>
          <header className={styles.principlesHeader}>
            <p className={styles.eyebrow}>{aboutPrinciples.eyebrow}</p>
            <SplitHeading
              as="h2"
              id="principles-heading"
              className={styles.sectionTitle}
            >
              {aboutPrinciples.title}
            </SplitHeading>
            <p className={styles.leadText}>{aboutPrinciples.lead}</p>
          </header>

          <div className={styles.principlesGrid} data-rise-block>
            {aboutPrinciples.items.map((principle) => (
              <article key={principle.index} className={styles.principleItem}>
                <span className={styles.principleIndex}>{principle.index}</span>
                <h3 className={styles.principleTitle}>{principle.title}</h3>
                <p className={styles.principleDescription}>
                  {principle.description}
                </p>
              </article>
            ))}
          </div>

          <MaterialSwatchDrawer />
        </div>
      </section>

      {/* 4. From first walk to first monsoon */}
      <section
        className={styles.section}
        aria-labelledby="stages-heading"
      >
        <div className={styles.inner}>
          <header className={styles.processHeader}>
            <p className={styles.eyebrow}>{aboutStages.eyebrow}</p>
            <SplitHeading
              as="h2"
              id="stages-heading"
              className={styles.sectionTitle}
            >
              {aboutStages.title}
            </SplitHeading>
            <p className={styles.processNote}>{aboutStages.note}</p>
          </header>

          <ol className={styles.stagesList} data-rise-block>
            {aboutStages.stages.map((stage) => (
              <li key={stage.index} className={styles.stageRow}>
                <span className={styles.stageIndex}>{stage.index}</span>
                <h3 className={styles.stageTitle}>{stage.title}</h3>
                <div className={styles.stageContent}>
                  <p className={styles.stageQuestion}>{stage.question}</p>
                  {stage.description ? (
                    <p className={styles.stageDescription}>
                      {stage.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Studio */}
      <section
        className={styles.section}
        aria-labelledby="studio-heading"
      >
        <div className={styles.inner}>
          <div className={styles.studioGrid}>
            <div className={styles.studioMedia} data-rise-block>
              <figure className={styles.studioImageFrame}>
                <Image
                  src={aboutStudio.image.src}
                  alt={aboutStudio.image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={styles.studioImage}
                />
              </figure>
              <figcaption className={styles.studioCaption}>
                <span>ASTHIWAR / STUDIO &amp; WORKSHOP</span>
                <span>COIMBATORE · TAMIL NADU</span>
              </figcaption>
            </div>

            <div className={styles.studioContent} data-rise-block>
              <p className={styles.eyebrow}>{aboutStudio.eyebrow}</p>
              <SplitHeading
                as="h2"
                id="studio-heading"
                className={styles.sectionTitle}
              >
                {aboutStudio.title}
              </SplitHeading>

              {aboutStudio.body.map((paragraph, i) => (
                <p key={i} className={styles.studioParagraph}>
                  {paragraph}
                </p>
              ))}

              <div className={styles.studioMetaTable}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Location</span>
                  <span className={styles.metaValue}>
                    {aboutStudio.location}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Address</span>
                  <span className={styles.metaPlaceholder}>
                    {aboutStudio.address}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Team</span>
                  <span className={styles.metaPlaceholder}>
                    {aboutStudio.team}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
