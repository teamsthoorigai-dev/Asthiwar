'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpRight, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import styles from './ProjectsHeroSequence.module.css';

const FRAME_COUNT = 300;
const CONCURRENCY = 6;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
};

// The full sequence is ~300 webp frames (~20MB). Prefetching all of it in the
// background is fine on a normal connection, but on a throttled/metered one
// it saturates the pipe and starves everything else on the page (JS, fonts,
// the archive images below) — which is what made the whole page feel stuck
// for the better part of a minute under DevTools 3G throttling.
function isConstrainedConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as unknown as { connection?: NetworkInformationLike }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType && conn.effectiveType !== '4g') return true;
  return false;
}

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
  const stageRef = useRef<HTMLDivElement>(null);
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
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
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
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!track || !stage || !canvas) return;

    if (REDUCED()) {
      return;
    }

    const ctx2d = canvas.getContext('2d', { alpha: false });
    if (!ctx2d) return;

    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);
    let currentFrame = -1;
    let targetFrame = 0;
    let cancelled = false;

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = isMobile
        ? Math.round((canvas.clientWidth * (9 / 16)) * dpr)
        : Math.round(canvas.clientHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const paint = (img: HTMLImageElement) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      // sizeCanvas() is intentionally NOT called here: reading canvas.clientWidth
      // forces a synchronous layout reflow, and this fires on every single touch-
      // move/wheel tick while scrubbing — that reflow-per-frame was the source of
      // the scroll feeling laggy on mobile. Sizing only happens on init/resize.
      if (canvas.width === 0 || canvas.height === 0) return;

      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      if (isMobile) {
        // On phones: fit the full 16:9 frame within canvas bounds without clipping or letterboxing
        const scale = Math.min(canvas.width / sw, canvas.height / sh);
        const dw = Math.round(sw * scale);
        const dh = Math.round(sh * scale);
        const dx = Math.round((canvas.width - dw) / 2);
        const dy = Math.round((canvas.height - dh) / 2);
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
      } else {
        // Desktop: cover fit for cinematic viewport bleed
        const scale = Math.max(canvas.width / sw, canvas.height / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        ctx2d.drawImage(
          img,
          0,
          0,
          sw,
          sh,
          (canvas.width - dw) / 2,
          (canvas.height - dh) / 2,
          dw,
          dh
        );
      }
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
      targetFrame = index;
      const use = nearestLoaded(index);
      if (use === -1) return;
      currentFrame = use;
      paint(images[use]);
    };

    const load = (index: number): Promise<void> => {
      if (index < 0 || index >= FRAME_COUNT) return Promise.resolve();
      if (loaded[index] && images[index]) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        if (index === 0) img.fetchPriority = 'high';
        img.src = `/frames/frame-${String(index + 1).padStart(3, '0')}.webp`;
        images[index] = img;
        img.onload = () => {
          loaded[index] = true;
          if (!cancelled) {
            const curDist = currentFrame === -1 ? Infinity : Math.abs(currentFrame - targetFrame);
            const newDist = Math.abs(index - targetFrame);
            if (newDist <= curDist) {
              render(targetFrame);
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    // Load first frame immediately for initial paint
    load(0).then(() => {
      if (cancelled) return;
      setCanvasReady(true);
      sizeCanvas();
      render(0);
      ScrollTrigger.refresh();

      if (isConstrainedConnection()) {
        // Don't eagerly download the rest of the sequence on a slow/metered
        // connection. Frames still load on demand, a handful at a time, as
        // the user actually scrubs (see the ±3 neighbor loads in updateFrame).
        return;
      }

      // Progressively fetch sparse frames first across the full sequence, then remaining
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

    const updateFrame = (frameIndex: number) => {
      targetFrame = frameIndex;
      render(frameIndex);

      if (!loaded[frameIndex]) {
        void load(frameIndex);
      }
      for (let offset = 1; offset <= 3; offset += 1) {
        if (frameIndex + offset < FRAME_COUNT && !loaded[frameIndex + offset]) {
          void load(frameIndex + offset);
        }
        if (frameIndex - offset >= 0 && !loaded[frameIndex - offset]) {
          void load(frameIndex - offset);
        }
      }

      if (counterNumberRef.current) {
        counterNumberRef.current.textContent = String(frameIndex + 1).padStart(3, '0');
      }
      const progress = frameIndex / (FRAME_COUNT - 1);
      if (progressLineRef.current) {
        progressLineRef.current.style.transform = `scaleX(${progress})`;
      }

      const introOpacity =
        progress <= 0.03 ? 1 : progress >= 0.12 ? 0 : 1 - (progress - 0.03) / 0.09;
      if (introRef.current) {
        introRef.current.style.opacity = String(introOpacity);
        introRef.current.style.pointerEvents = introOpacity < 0.1 ? 'none' : 'auto';
      }

      const stageCopyOpacity =
        progress <= 0.06
          ? 0
          : progress <= 0.14
          ? (progress - 0.06) / 0.08
          : 1;
      if (stageCopyRef.current) {
        stageCopyRef.current.style.opacity = String(stageCopyOpacity);
        stageCopyRef.current.style.pointerEvents = stageCopyOpacity > 0.5 ? 'auto' : 'none';
      }

      const sIdx = getStageIndex(progress);
      setActiveStageIdx(sIdx);
      setCurrentStageData(stages[sIdx]);

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
    };

    const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;

    let isMobileLocked = isMobileInitial;

    const lockMobile = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      isMobileLocked = true;
      document.documentElement.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
    };

    const unlockMobile = () => {
      isMobileLocked = false;
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };

    if (isMobileInitial) {
      lockMobile();
    }

    // Re-engage the frame scrubber when the user scrolls back up past the top
    // of the archive to the very start of the page. Re-locks on frame 300 so
    // the next upward swipe scrubs backward toward frame 1 (unlockMobile still
    // fires normally at the far end, so scrolling down again replays forward
    // to 300 and releases into the archive exactly as before).
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    const relockAtEnd = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      lockMobile();
      targetFrame = FRAME_COUNT - 1;
      updateFrame(FRAME_COUNT - 1);
    };

    const onWindowScroll = () => {
      if (typeof window === 'undefined') return;
      const currentY = window.scrollY;

      if (isMobileLocked) {
        if (currentY > 0) window.scrollTo(0, 0);
        lastScrollY = 0;
        return;
      }

      if (window.innerWidth < 768 && currentY <= 0 && lastScrollY > currentY) {
        relockAtEnd();
      }
      lastScrollY = currentY;
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    let trigger: ScrollTrigger | null = null;
    if (!isMobileInitial) {
      trigger = ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const frameIndex = Math.min(
            FRAME_COUNT - 1,
            Math.max(0, Math.round(self.progress * (FRAME_COUNT - 1)))
          );
          updateFrame(frameIndex);
        },
      });
    }

    // Mobile Frame Lock:
    // Keeps the page locked at the top while 300 frames scrub,
    // and ONLY releases the lock once frame 300 is reached so the page
    // advances smoothly into the archive with ZERO empty white space.
    let mobileTouchStartY = 0;
    let mobileTouchStartFrame = 0;

    // Touch/wheel events on mobile can fire far faster than the screen can
    // paint. Without this, every single event ran a full updateFrame() (canvas
    // draw + several DOM writes) synchronously, which is what made scrubbing
    // feel like it lagged behind the finger. Collapse bursts down to one
    // updateFrame() per animation frame instead.
    let mobileRafId: number | null = null;
    let pendingMobileFrame: number | null = null;

    const scheduleMobileFrame = (frameIndex: number) => {
      pendingMobileFrame = frameIndex;
      if (mobileRafId !== null) return;
      mobileRafId = requestAnimationFrame(() => {
        mobileRafId = null;
        if (pendingMobileFrame !== null) {
          updateFrame(pendingMobileFrame);
          pendingMobileFrame = null;
        }
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
      if (e.touches.length > 0) {
        mobileTouchStartY = e.touches[0].clientY;
        mobileTouchStartFrame = targetFrame;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
      if (e.touches.length === 0) return;
      const touchY = e.touches[0].clientY;
      const dy = mobileTouchStartY - touchY;

      if (isMobileLocked) {
        if (e.cancelable) e.preventDefault();
        const sensitivity = (FRAME_COUNT - 1) / (window.innerHeight * 0.7);
        const frameDelta = Math.round(dy * sensitivity);
        const newFrame = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, mobileTouchStartFrame + frameDelta)
        );
        // Touch position is absolute (anchored to where the gesture started),
        // not incremental. When re-locked at frame 300 for reverse scrubbing,
        // the very first touchmove of a new gesture often reports ~0 net
        // movement — which resolves to newFrame 300 again and would instantly
        // unlock before the user's swipe registers. Only unlock on a genuine
        // forward crossing into the last frame, not while already sitting on it.
        const wasBelowEnd = targetFrame < FRAME_COUNT - 1;
        scheduleMobileFrame(newFrame);
        if (newFrame >= FRAME_COUNT - 1 && wasBelowEnd) {
          unlockMobile();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
      if (isMobileLocked) {
        if (e.cancelable) e.preventDefault();
        const step = Math.max(1, Math.round(Math.abs(e.deltaY) * 0.25));
        const newFrame =
          e.deltaY > 0
            ? Math.min(FRAME_COUNT - 1, targetFrame + step)
            : Math.max(0, targetFrame - step);
        // Update targetFrame synchronously so back-to-back wheel ticks within
        // the same animation frame accumulate correctly instead of all
        // computing their step from the same stale value.
        targetFrame = newFrame;
        scheduleMobileFrame(newFrame);
        if (newFrame >= FRAME_COUNT - 1) {
          unlockMobile();
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('wheel', onWheel, { passive: false });

    // Touch scrubbing on mobile canvas
    let isDragging = false;
    let startX = 0;
    let startFrame = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
      isDragging = true;
      startX = e.clientX;
      startFrame = targetFrame;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const sensitivity = FRAME_COUNT / (window.innerWidth * 1.2);
      const frameDelta = Math.round(dx * sensitivity);
      const newFrame = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, startFrame + frameDelta)
      );
      targetFrame = newFrame;
      render(newFrame);

      if (counterNumberRef.current) {
        counterNumberRef.current.textContent = String(newFrame + 1).padStart(3, '0');
      }
      if (progressLineRef.current) {
        progressLineRef.current.style.transform = `scaleX(${newFrame / (FRAME_COUNT - 1)})`;
      }
      if (!loaded[newFrame]) {
        void load(newFrame);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      currentFrame = -1;
      sizeCanvas();
      render(Math.min(FRAME_COUNT - 1, Math.round((trigger?.progress || 0) * (FRAME_COUNT - 1))));
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // On phones the canvas box is a 16:9 aspect-ratio band, so its height is
    // derived from its width and can change without the window resizing — a
    // scrollbar appearing, the address bar collapsing, a font landing. A stale
    // bitmap then gets a cover fit against the wrong box and crops again, which
    // is the bug this box exists to prevent. Repaint on the box, not the window.
    const boxObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            currentFrame = -1;
            sizeCanvas();
            render(
              Math.min(FRAME_COUNT - 1, Math.round((trigger?.progress || 0) * (FRAME_COUNT - 1)))
            );
          });
    boxObserver?.observe(canvas);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      unlockMobile();
      cancelled = true;
      clearTimeout(refreshTimer);
      if (mobileRafId !== null) cancelAnimationFrame(mobileRafId);
      boxObserver?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener('resize', onResize);
      if (trigger) trigger.kill();
      images.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
          if (!img.complete) img.src = '';
        }
      });
    };
  }, []);

  return (
    <section
      className={styles.section}
      ref={trackRef}
      aria-label="Construction sequence: 300 frames of architectural assembly"
    >
      <div className={styles.stage} ref={stageRef}>
        {/* Media stage containing canvas sequence and poster */}
        <div className={styles.mediaStage}>
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
            loading="eager"
            fetchPriority="high"
          />

          {/* Atmosphere scrim */}
          <div className={styles.scrim} aria-hidden="true" />

          {/* Mobile-only HUD: stage pills top-left, mirrors the desktop rail */}
          <ol className={styles.frameHud} aria-hidden="true">
            {stages.map((st, idx) => (
              <li
                key={st.index}
                className={[styles.frameHudPill, idx === activeStageIdx && styles.frameHudPillActive]
                  .filter(Boolean)
                  .join(' ')}
              >
                {st.index}
              </li>
            ))}
          </ol>

          {/* Telemetry Counter HUD: on mobile also covers the Gemini watermark
              baked into the bottom-right of every frame */}
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

        {/* Blueprint framing grid */}
        <div className={styles.gridOverlay} aria-hidden="true" />

        {/* Main Hero Overlay */}
        <div className={styles.overlay}>
          {/* Intro Text & Action */}
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
                <button
                  type="button"
                  className={styles.scrollCue}
                  onClick={scrollToArchive}
                  aria-label="Scroll to projects archive"
                >
                  <ArrowDown size={14} aria-hidden="true" />
                  <span>Scroll to archive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Stage Detailed Card (fades in as user scrolls) */}
          <div className={styles.stageCopyContainer} ref={stageCopyRef} aria-live="polite">
            <div className={styles.stageCopy}>
              <div className={styles.stagePills} aria-hidden="true">
                {stages.map((st, idx) => (
                  <span
                    key={st.index}
                    className={[
                      styles.stagePill,
                      idx === activeStageIdx && styles.stagePillActive,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {st.index}
                  </span>
                ))}
              </div>
              <p className={styles.stageEyebrow}>
                {currentStageData.index} // {currentStageData.label}
              </p>
              <h2 className={styles.stageTitle}>{currentStageData.title}</h2>
              <p className={styles.stageNote}>{currentStageData.note}</p>
              <div className={styles.stageActions}>
                <button
                  type="button"
                  className={styles.stageScrollCue}
                  onClick={scrollToArchive}
                  aria-label="Scroll to projects archive"
                >
                  <ArrowDown size={14} aria-hidden="true" />
                  <span>Scroll to archive</span>
                </button>
              </div>
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
        </div>
      </div>
    </section>
  );
}
