'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { processStages } from '@/data/home';
import { gsap, ScrollTrigger, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './ProcessStages.module.css';

const { stages, layers } = processStages;

/** Seven stages map onto five assembly layers. */
function layerForStage(stageIndex: number) {
  return Math.min(layers.length - 1, Math.floor((stageIndex / stages.length) * layers.length));
}

/**
 * Homepage section 12. Novascape's master-plan legend becomes ASTHIWAR's
 * seven-stage process, with the assembly image building up as you read down.
 */
export function ProcessStages() {
  const [activeLayer, setActiveLayer] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  // M5 stagger down the list.
  useEffect(() => {
    const el = listRef.current;
    if (!el || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(`.${styles.stage}`, {
        y: MOTION.riseY,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: MOTION.riseStagger,
        scrollTrigger: revealTrigger(el),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Cross-fade the assembly image as each stage passes.
  useEffect(() => {
    const el = listRef.current;
    if (!el || REDUCED()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      // One trigger reading scroll progress, rather than per-row onEnter
      // callbacks: callbacks do not replay after a large jump, so a reload or
      // deep-link partway down would leave the wrong layer showing.
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
        onUpdate: (self) => {
          const stageIndex = Math.min(
            stages.length - 1,
            Math.floor(self.progress * stages.length),
          );
          setActiveLayer(layerForStage(stageIndex));
        },
      });

      return () => trigger.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <Section aria-labelledby="stages-title">
      <SectionHeader
        id="stages-title"
        eyebrow={processStages.eyebrow}
        title={processStages.title}
        body={processStages.body}
      />

      <div className={styles.grid}>
        <div className={styles.media}>
          {layers.map((layer, i) => (
            <div
              key={layer.src}
              className={[styles.layer, i === activeLayer && styles.layerActive]
                .filter(Boolean)
                .join(' ')}
              aria-hidden={i !== activeLayer}
            >
              <Image
                src={layer.src}
                alt={i === activeLayer ? layer.alt : ''}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={styles.image}
              />
            </div>
          ))}
        </div>

        <div>
          <ol className={styles.list} ref={listRef}>
            {stages.map((stage, i) => (
              <li className={styles.stage} key={stage.title}>
                <span className={styles.number} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.stageTitle}>{stage.title}</h3>
                <p className={styles.question}>{stage.question}</p>
              </li>
            ))}
          </ol>

          <p className={styles.note}>{processStages.note}</p>

          <div className={styles.cta}>
            <Button href={processStages.cta.href} variant="ghost">
              {processStages.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
