'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const heroImage = '/images/asthivar-villa.jpg';

const steps = ['Groundwork', 'Structure', 'Envelope', 'Handover'] as const;

function clamp(value: number, minimum = 0, maximum = 1) {
  return value < minimum ? minimum : value > maximum ? maximum : value;
}

function span(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function outCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function HomeRevealHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const headlineFirstRef = useRef<HTMLSpanElement>(null);
  const headlineSecondRef = useRef<HTMLSpanElement>(null);
  const ledeFirstRef = useRef<HTMLSpanElement>(null);
  const ledeSecondRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const segmentFillRefs = useRef<Array<HTMLElement | null>>([]);
  const segmentDotRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const image = imageRef.current;
    const veil = veilRef.current;
    const rule = ruleRef.current;
    const caption = captionRef.current;
    const cue = cueRef.current;
    const headlineFirst = headlineFirstRef.current;
    const headlineSecond = headlineSecondRef.current;
    const ledeFirst = ledeFirstRef.current;
    const ledeSecond = ledeSecondRef.current;

    if (
      !section ||
      !frame ||
      !image ||
      !veil ||
      !rule ||
      !caption ||
      !cue ||
      !headlineFirst ||
      !headlineSecond ||
      !ledeFirst ||
      !ledeSecond
    ) {
      return;
    }

    let target = 0;
    let current = 0;
    let animationFrame = 0;

    const readScroll = () => {
      const total = section.offsetHeight - window.innerHeight;
      target = total > 0 ? clamp(-section.getBoundingClientRect().top / total) : 0;
    };

    const render = (progress: number) => {
      const reveal = outCubic(span(progress, 0, 0.34));
      const settle = outCubic(span(progress, 0, 0.9));

      frame.style.clipPath = `inset(${((1 - reveal) * 100).toFixed(2)}% 0% 0% 0%)`;
      image.style.transform = `translate3d(0, ${(24 - 32 * settle).toFixed(1)}px, 0) scale(${(
        1.16 -
        0.14 * settle
      ).toFixed(4)})`;
      veil.style.opacity = (0.66 - 0.54 * settle).toFixed(3);
      rule.style.transform = `scaleX(${reveal.toFixed(3)})`;
      caption.style.opacity = span(progress, 0.3, 0.46).toFixed(3);

      const copyOut = span(progress, 0.72, 0.81);
      const copyIn = span(progress, 0.84, 0.93);
      headlineFirst.style.opacity = (1 - copyOut).toFixed(3);
      ledeFirst.style.opacity = (1 - copyOut).toFixed(3);
      headlineSecond.style.opacity = copyIn.toFixed(3);
      ledeSecond.style.opacity = copyIn.toFixed(3);
      cue.style.opacity = (1 - span(progress, 0, 0.1)).toFixed(3);

      const processPosition = progress * (steps.length - 1);
      stepRefs.current.forEach((step, index) => {
        step?.classList.toggle('home-hero__step--on', processPosition >= index - 0.02);
      });
      segmentFillRefs.current.forEach((fill, index) => {
        const amount = clamp(processPosition - index);
        if (fill) fill.style.transform = `scaleX(${amount.toFixed(3)})`;
        segmentDotRefs.current[index]?.classList.toggle('home-hero__dot--on', amount > 0.98);
      });

      let activeStage = 1;
      steps.forEach((_, index) => {
        if (processPosition >= index - 0.02) activeStage = index + 1;
      });
      section.dataset['progress'] = progress.toFixed(3);
      section.dataset['stage'] = String(activeStage).padStart(2, '0');
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      render(1);
      return;
    }

    const loop = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.0002) current = target;
      render(current);
      animationFrame = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    window.addEventListener('load', readScroll);
    readScroll();
    current = target;
    render(current);
    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      window.removeEventListener('load', readScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="home-hero"
      id="home-hero"
      aria-labelledby="home-hero-title"
      data-progress="0.000"
      data-stage="01"
    >
      <div className="home-hero__stage">
        <div className="home-hero__copy">
          <div className="home-hero__tick" aria-hidden="true" />
          <h1 className="home-hero__heads" id="home-hero-title">
            <span ref={headlineFirstRef} className="home-hero__head">
              One team.
              <br />
              Every layer.
            </span>
            <span
              ref={headlineSecondRef}
              className="home-hero__head home-hero__head--second"
              aria-hidden="true"
            >
              One team.
              <br />
              One building.
            </span>
          </h1>
          <p className="home-hero__lede">
            <span ref={ledeFirstRef}>Design, engineering and construction—held together.</span>
            <span ref={ledeSecondRef} aria-hidden="true">
              Five trades, one drawing set, one line of accountability.
            </span>
          </p>
        </div>

        <figure className="home-hero__wrap">
          <div ref={frameRef} className="home-hero__frame">
            <Image
              ref={imageRef}
              className="home-hero__image"
              src={heroImage}
              alt="A completed ASTHIWAR twin residence seen from the street corner, with jaali screens set into its upper facade."
              width={2000}
              height={1414}
              priority
              draggable={false}
            />
            <div ref={veilRef} className="home-hero__veil" aria-hidden="true" />
            <span ref={ruleRef} className="home-hero__rule" aria-hidden="true" />
          </div>

          <figcaption ref={captionRef} className="home-hero__caption home-hero__mono">
            <span className="home-hero__number">01</span>
            <span>Completed residence — details to be confirmed</span>
          </figcaption>
        </figure>

        <div className="home-hero__process" aria-label="Building assembly progress">
          <div ref={cueRef} className="home-hero__cue" aria-hidden="true">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0v12M1 7l5 5 5-5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <div className="home-hero__steps home-hero__mono">
            {steps.map((step, index) => (
              <div className="home-hero__step-group" key={step}>
                <div
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  className={`home-hero__step${index === 0 ? ' home-hero__step--on' : ''}`}
                >
                  <span className="home-hero__number">0{index + 1}</span>
                  <span className="home-hero__step-name">{step}</span>
                </div>
                {index < steps.length - 1 ? (
                  <>
                    <div
                      ref={(element) => {
                        segmentDotRefs.current[index] = element;
                      }}
                      className="home-hero__dot"
                      aria-hidden="true"
                    />
                    <div className="home-hero__segment" aria-hidden="true">
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
