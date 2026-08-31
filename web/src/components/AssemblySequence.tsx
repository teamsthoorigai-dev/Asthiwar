'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { createAssemblyScene, STAGE_WINDOWS, type AssemblyScene } from './assembly/scene';

const steps = ['Foundation', 'Frame', 'Envelope', 'Finish'] as const;

function clamp(value: number, minimum = 0, maximum = 1) {
  return value < minimum ? minimum : value > maximum ? maximum : value;
}

function span(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

/**
 * Scroll-driven four-stage building assembly, rendered with WebGL.
 *
 * The scroll shell — sticky stage, copy handoff, step indicator, reduced-motion
 * handling — is unchanged from the layered-image version it replaces. Only the
 * visual is different: the five architectural cut-outs are composited as
 * textured planes so the reference materials and colours remain intact.
 */
export function AssemblySequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const headlineFirstRef = useRef<HTMLSpanElement>(null);
  const headlineSecondRef = useRef<HTMLSpanElement>(null);
  const ledeFirstRef = useRef<HTMLSpanElement>(null);
  const ledeSecondRef = useRef<HTMLSpanElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const segmentFillRefs = useRef<Array<HTMLElement | null>>([]);
  const segmentDotRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const cue = cueRef.current;
    const headlineFirst = headlineFirstRef.current;
    const headlineSecond = headlineSecondRef.current;
    const ledeFirst = ledeFirstRef.current;
    const ledeSecond = ledeSecondRef.current;
    const process = processRef.current;

    if (
      !section ||
      !wrap ||
      !canvas ||
      !cue ||
      !headlineFirst ||
      !headlineSecond ||
      !ledeFirst ||
      !ledeSecond ||
      !process
    ) {
      return;
    }

    let assembly: AssemblyScene | null = null;
    try {
      assembly = createAssemblyScene(canvas);
      section.dataset['webgl'] = 'on';
    } catch {
      // No WebGL (old device, blocked context). Keep the poster visible while
      // the scroll copy and progress indicator continue to work.
      section.dataset['webgl'] = 'off';
    }
    section.dataset['sceneReady'] = 'false';

    let target = 0;
    let current = 0;
    let animationFrame = 0;
    let visible = true;
    let cancelled = false;

    let lastW = 0;
    let lastH = 0;
    const measure = () => {
      const bounds = wrap.getBoundingClientRect();
      const w = Math.round(bounds.width);
      const h = Math.round(bounds.height);
      if (w === lastW && h === lastH) return false;
      lastW = w;
      lastH = h;
      if (w > 0 && h > 0) assembly?.resize(w, h);
      return true;
    };


    const readScroll = () => {
      const total = section.offsetHeight - window.innerHeight;
      target = total > 0 ? clamp(-section.getBoundingClientRect().top / total) : 0;
    };

    const paintChrome = (progress: number) => {
      // Copy handoff runs only after the build has finished, so the text swap
      // never competes with the final stage landing.
      const copyHandoff = span(progress, 0.93, 1);
      headlineFirst.style.opacity = (1 - copyHandoff).toFixed(3);
      ledeFirst.style.opacity = (1 - copyHandoff).toFixed(3);
      headlineSecond.style.opacity = copyHandoff.toFixed(3);
      ledeSecond.style.opacity = copyHandoff.toFixed(3);
      cue.style.opacity = (1 - span(progress, 0, 0.1)).toFixed(3);

      // Step indicator advances on stage boundaries, not linearly, so the label
      // matches the stage you are actually looking at.
      let activeStage = 1;
      STAGE_WINDOWS.forEach(([start], index) => {
        if (progress >= start - 0.001) activeStage = index + 1;
      });

      stepRefs.current.forEach((step, index) => {
        step?.classList.toggle('assembly-sequence__step--on', index < activeStage);
      });
      segmentFillRefs.current.forEach((fill, index) => {
        const [start, end] = STAGE_WINDOWS[index + 1] ?? [1, 1];
        const prevEnd = STAGE_WINDOWS[index]?.[1] ?? 0;
        const amount = span(progress, prevEnd, start === end ? start : start);
        if (fill) fill.style.transform = `scaleX(${amount.toFixed(3)})`;
        segmentDotRefs.current[index]?.classList.toggle('assembly-sequence__dot--on', amount > 0.98);
      });

      section.dataset['progress'] = progress.toFixed(3);
      section.dataset['stage'] = String(activeStage).padStart(2, '0');
      process.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      process.setAttribute('aria-valuetext', steps[activeStage - 1] ?? steps[0]);
    };

    const draw = (progress: number) => {
      assembly?.render(progress);
      paintChrome(progress);
    };

    assembly?.ready
      .then(() => {
        if (cancelled) return;
        section.dataset['sceneReady'] = 'true';
        draw(current);
      })
      .catch(() => {
        if (cancelled) return;
        section.dataset['webgl'] = 'off';
        section.dataset['sceneReady'] = 'false';
        assembly?.dispose();
        assembly = null;
      });

    // The wrap is sized by the sticky grid, so its box is not final on mount.
    // Observe it rather than measuring once, or the drawing buffer stays 0-high.
    const resizeObserver = new ResizeObserver(() => {
      if (measure()) draw(current);
    });
    resizeObserver.observe(wrap);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    measure();

    if (reduceMotion) {
      draw(1);
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        document.body.classList.toggle(
          'assembly-hero-active',
          entry?.isIntersecting ?? false
        );
      });
      visibilityObserver.observe(section);
      const handleResize = () => {
        measure();
        draw(1);
      };
      window.addEventListener('resize', handleResize);
      return () => {
        cancelled = true;
        window.removeEventListener('resize', handleResize);
        visibilityObserver.disconnect();
        document.body.classList.remove('assembly-hero-active');
        resizeObserver.disconnect();
        assembly?.dispose();
      };
    }

    const tick = () => {
      readScroll();
      const delta = target - current;
      current = Math.abs(delta) < 0.0005 ? target : current + delta * 0.12;
      draw(current);
      animationFrame = visible ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      readScroll();
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      readScroll();
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    };

    // Stop rendering entirely when the hero is off-screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        document.body.classList.toggle('assembly-hero-active', visible);
        if (visible && !animationFrame) animationFrame = requestAnimationFrame(tick);
      },
      { rootMargin: '200px' }
    );
    observer.observe(section);

    readScroll();
    current = target;
    draw(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      document.body.classList.remove('assembly-hero-active');
      resizeObserver.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      assembly?.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="assembly-sequence"
      aria-labelledby="assembly-sequence-title"
      data-progress="0.000"
      data-stage="01"
      data-scene-ready="false"
    >
      <div className="assembly-sequence__stage">
        <div className="assembly-sequence__copy">
          <div className="assembly-sequence__tick" aria-hidden="true" />
          <h1 className="assembly-sequence__heads" id="assembly-sequence-title">
            <span ref={headlineFirstRef} className="assembly-sequence__head">
              Built in layers.
              <br />
              Held as one.
            </span>
            <span
              ref={headlineSecondRef}
              className="assembly-sequence__head assembly-sequence__head--second"
              aria-hidden="true"
            >
              One team.
              <br />
              One building.
            </span>
          </h1>
          <p className="assembly-sequence__lede">
            <span ref={ledeFirstRef}>
              Scroll through foundation, columns, envelope and finish.
            </span>
            <span ref={ledeSecondRef} aria-hidden="true">
              The complete facade, assembled into one continuous home.
            </span>
          </p>
          <div className="assembly-sequence__actions">
            <Link href="/projects" className="button button--light">
              View projects
            </Link>
            <Link href="/cost-calculator" className="button button--outline-light">
              Estimate your build
            </Link>
          </div>
        </div>

        <div ref={wrapRef} className="assembly-sequence__wrap">
          <Image
            className="assembly-sequence__poster"
            src="/assembly-layers/test_grabcut.png"
            alt="Completed multi-home facade with grey frames, pale stone walls, timber gates and planted boundary walls"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 61vw"
          />
          <canvas ref={canvasRef} className="assembly-sequence__canvas" aria-hidden="true" />
        </div>

        <div
          ref={processRef}
          className="assembly-sequence__process"
          role="progressbar"
          aria-label="Building assembly progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-valuetext="Foundation"
        >
          <div ref={cueRef} className="assembly-sequence__cue" aria-hidden="true">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0v12M1 7l5 5 5-5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <div className="assembly-sequence__steps assembly-sequence__mono">
            {steps.map((step, index) => (
              <div className="assembly-sequence__step-group" key={step}>
                <div
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  className={`assembly-sequence__step${index === 0 ? ' assembly-sequence__step--on' : ''}`}
                >
                  <span className="assembly-sequence__number">0{index + 1}</span>
                  <span className="assembly-sequence__step-name">{step}</span>
                </div>
                {index < steps.length - 1 ? (
                  <>
                    <div
                      ref={(element) => {
                        segmentDotRefs.current[index] = element;
                      }}
                      className="assembly-sequence__dot"
                      aria-hidden="true"
                    />
                    <div className="assembly-sequence__segment" aria-hidden="true">
                      <i
                        ref={(element) => {
                          segmentFillRefs.current[index] = element;
                        }}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
