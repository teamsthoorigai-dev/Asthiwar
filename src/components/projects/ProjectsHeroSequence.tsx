'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpRight, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import styles from './ProjectsHeroSequence.module.css';

const FRAME_COUNT = 300;
const CONCURRENCY = 6;

export type Stage = {
  readonly at: number;
  readonly index: string;
  readonly label: string;
  readonly title: string;
  readonly note: string;
};

const stages: readonly Stage[] = [
  {
    at: 0.10,
    index: '01',
    label: 'DESIGN / CONTEXT',
    title: 'Thoughtful architecture begins with context.',
    note: 'ASTHIWAR creates thoughtful, sustainable and timeless spaces shaped by site, sunlight and microclimate.',
  },
  {
    at: 0.35,
    index: '02',
    label: 'ENGINEERING / STRUCTURE',
    title: 'Architecture meets engineering precision.',
    note: 'We combine architectural excellence with ductile engineering precision to build an uncompromised structural frame.',
  },
  {
    at: 0.60,
    index: '03',
    label: 'MATERIAL / COMFORT',
    title: 'Sustainable choices shape every layer.',
    note: 'Natural cooling, breathable lime, lower-carbon methods and honest tactile finishes support healthier living.',
  },
  {
    at: 0.82,
    index: '04',
    label: 'BUILD / DELIVERY',
    title: 'One coordinated process carries the project through.',
    note: 'We bring architecture, engineering, and meticulous execution together from initial ground cut to seasonal handover.',
  },
];

function getStageIndex(progress: number): number {
  if (progress >= 0.78) return 3;
  if (progress >= 0.52) return 2;
  if (progress >= 0.26) return 1;
  return 0;
}

function getSparsePriorityList(count: number): number[] {
  const result: number[] = [];
  const seen = new Set<number>();
  const add = (i: number) => {
    if (i >= 0 && i < count && !seen.has(i)) {
      seen.add(i);
      result.push(i);
    }
  };

  add(0);
  add(count - 1);
  const step = Math.max(4, Math.round(count / 20));
  for (let i = step; i < count - 1; i += step) add(i);
  for (let i = 1; i < count - 1; i += 1) add(i);

  return result;
}

export function ProjectsHeroSequence() {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const counterNumberRef = useRef<HTMLElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const stageCopyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLOListElement>(null);

  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [currentStageData, setCurrentStageData] = useState<Stage>(stages[0]);
  const [canvasReady, setCanvasReady] = useState(false);

  const scrollToSection = useCallback((targetProgress: number) => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const rect = track.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const trackTop = rect.top + scrollTop;
    const trackHeight = track.offsetHeight - window.innerHeight;
    const dest = trackTop + trackHeight * targetProgress;

    window.scrollTo({
      top: dest,
      behavior: 'smooth',
    });
  }, []);

  const scrollToArchive = useCallback(() => {
    const archive = document.getElementById('project-archive');
    if (archive) {
      archive.scrollIntoView({ behavior: 'smooth' });
    } else if (trackRef.current) {
      const track = trackRef.current;
      const rect = track.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      window.scrollTo({
        top: rect.top + scrollTop + track.offsetHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    if (REDUCED()) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      const ctx2d = canvas.getContext('2d', { alpha: false });
      if (!ctx2d) return;

      const images: HTMLImageElement[] = new Array(FRAME_COUNT);
      const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);
      let currentFrame = -1;
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

      const paint = (img: HTMLImageElement) => {
        sizeCanvas();
        const scale = Math.max(
          canvas.width / img.naturalWidth,
          canvas.height / img.naturalHeight
        );
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx2d.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      };

      const nearestLoaded = (index: number) => {
        if (loaded[index]) return index;
        for (let d = 1; d < FRAME_COUNT; d += 1) {
          if (index - d >= 0 && loaded[index - d]) return index - d;
          if (index + d < FRAME_COUNT && loaded[index + d]) return index + d;
        }
        return -1;
      };

      const render = (index: number) => {
        const use = nearestLoaded(index);
        if (use === -1 || use === currentFrame) return;
        currentFrame = use;
        paint(images[use]);
      };

      const load = (index: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.src = `/frames/frame-${String(index + 1).padStart(3, '0')}.webp`;
          images[index] = img;
          img.onload = () => {
            loaded[index] = true;
            resolve();
          };
          img.onerror = () => resolve();
        });

      // Load first frame immediately
      load(0).then(() => {
        if (cancelled) return;
        setCanvasReady(true);
        render(0);

        // Progressively fetch sparse frames first, then all remaining
        const priorityQueue = getSparsePriorityList(FRAME_COUNT);
        let queueIdx = 0;

        const worker = async (): Promise<void> => {
          while (!cancelled && queueIdx < priorityQueue.length) {
            const nextFrame = priorityQueue[queueIdx];
            queueIdx += 1;
            if (!loaded[nextFrame]) {
              await load(nextFrame);
            }
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
          const progress = self.progress;
          const frameIndex = Math.min(
            FRAME_COUNT - 1,
            Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
          );
          render(frameIndex);

          // Update Counter HUD
          if (counterNumberRef.current) {
            counterNumberRef.current.textContent = String(frameIndex + 1).padStart(3, '0');
          }
          if (progressLineRef.current) {
            progressLineRef.current.style.transform = `scaleX(${progress})`;
          }

          // Intro fade out
          const introOpacity =
            progress <= 0.03 ? 1 : progress >= 0.15 ? 0 : 1 - (progress - 0.03) / 0.12;
          if (introRef.current) {
            introRef.current.style.opacity = String(introOpacity);
            introRef.current.style.pointerEvents = introOpacity < 0.1 ? 'none' : 'auto';
          }

          // Stage Copy fade in
          const stageCopyOpacity =
            progress <= 0.08
              ? 0
              : progress <= 0.16
              ? (progress - 0.08) / 0.08
              : progress >= 0.94
              ? Math.max(0, 1 - (progress - 0.94) / 0.06)
              : 1;
          if (stageCopyRef.current) {
            stageCopyRef.current.style.opacity = String(stageCopyOpacity);
          }

          // Stage active calculation
          const sIdx = getStageIndex(progress);
          setActiveStageIdx(sIdx);
          setCurrentStageData(stages[sIdx]);

          // Update rail items active state directly for responsiveness
          if (railRef.current) {
            const items = railRef.current.querySelectorAll('li');
            items.forEach((item, idx) => {
              if (idx === sIdx && progress > 0.04) {
                item.setAttribute('data-active', 'true');
              } else {
                item.removeAttribute('data-active');
              }
            });
          }
        },
      });

      const onResize = () => {
        currentFrame = -1;
        render(Math.min(FRAME_COUNT - 1, Math.round((trigger.progress || 0) * (FRAME_COUNT - 1))));
      };
      window.addEventListener('resize', onResize);

      return () => {
        cancelled = true;
        window.removeEventListener('resize', onResize);
        trigger.kill();
        images.forEach((img) => {
          if (img) {
            img.onload = null;
            img.onerror = null;
            if (!img.complete) img.src = '';
          }
        });
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      className={styles.section}
      ref={trackRef}
      aria-label="Construction sequence: 300 frames of architectural assembly"
    >
      <div className={styles.stage}>
        {/* Fullscreen scrubbed canvas */}
        <canvas
          ref={canvasRef}
          className={[styles.canvas, canvasReady && styles.canvasReady]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        />

        {/* Immediate first paint poster & reduced-motion fallback */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={posterRef}
          className={[styles.poster, canvasReady && styles.posterHidden]
            .filter(Boolean)
            .join(' ')}
          src="/frames/frame-001.webp"
          alt="ASTHIWAR site excavation and foundation reinforcement"
          width={1440}
          height={810}
          decoding="async"
        />

        {/* Atmosphere scrims and blueprint framing grid */}
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.gridOverlay} aria-hidden="true" />

        {/* Main Hero Overlay */}
        <div className={styles.overlay}>
          {/* Intro Text & Action (matches reference screenshot) */}
          <div className={styles.intro} ref={introRef}>
            <p className={styles.eyebrow}>PROJECTS</p>
            <h1 className={styles.title}>Projects</h1>
            <div className={styles.introFoot}>
              <p className={styles.introText}>
                A collection of spaces shaped by context, material and intent.
              </p>
              <div className={styles.actions}>
                <Link href="/cost-calculator" className={styles.calculatorButton}>
                  <span>Cost Calculator</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <button
                type="button"
                className={styles.scrollCue}
                onClick={scrollToArchive}
                aria-label="Scroll to projects archive"
              >
                <ArrowDown size={14} aria-hidden="true" />
                <span>Scroll to the archive</span>
              </button>
            </div>
          </div>

          {/* Active Stage Detailed Card (fades in as user scrolls) */}
          <div className={styles.stageCopyContainer} ref={stageCopyRef} aria-live="polite">
            <div className={styles.stageCopy}>
              <p className={styles.stageEyebrow}>
                {currentStageData.index} // {currentStageData.label}
              </p>
              <h2 className={styles.stageTitle}>{currentStageData.title}</h2>
              <p className={styles.stageNote}>{currentStageData.note}</p>
            </div>
          </div>

          {/* Stages Progression Rail (Right side) */}
          <ol
            ref={railRef}
            className={styles.rail}
            aria-label="Construction sequence stages"
          >
            {stages.map((stage, idx) => (
              <li
                key={stage.index}
                data-active={idx === activeStageIdx ? 'true' : undefined}
                onClick={() => scrollToSection(stage.at)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    scrollToSection(stage.at);
                  }
                }}
                aria-label={`Jump to stage ${stage.index}: ${stage.label}`}
              >
                <span className={styles.railIndex}>{stage.index}</span>
                <span className={styles.railLabel}>{stage.label}</span>
              </li>
            ))}
          </ol>

          {/* Controls button (Right edge, matching screenshot) */}
          <button
            type="button"
            className={styles.controlsButton}
            onClick={scrollToArchive}
            title="Browse all archive projects"
            aria-label="Jump to project archive filters and cards"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
          </button>

          {/* Telemetry Counter HUD (Bottom Right) */}
          <div className={styles.counter} aria-label="Current frame indicator">
            <div className={styles.counterMeta}>
              <span>FIELD</span>
              <span>RECORD</span>
            </div>
            <div className={styles.counterValues}>
              <strong ref={counterNumberRef}>001</strong>
              <span>/ {String(FRAME_COUNT).padStart(3, '0')}</span>
            </div>
            <div className={styles.progressBar} aria-hidden="true">
              <div ref={progressLineRef} className={styles.progressFill} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
