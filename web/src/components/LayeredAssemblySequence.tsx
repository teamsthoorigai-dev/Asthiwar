'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

const canvas = { width: 1024, height: 750, axis: 512 } as const;

const layers = [
  {
    index: '01',
    title: 'Ground & Boundary',
    description: 'Site, plinth and\nsecured perimeter',
    source: '/assembly-layers/01-ground-foundations.webp',
    x: 0,
    y: 520,
    width: 1024,
    height: 229,
    travel: 0,
    window: [0, 0.05],
  },
  {
    index: '02',
    title: 'Ground Structure',
    description: 'Engineered masonry and\nentrance canopies',
    source: '/assembly-layers/02-structure.webp',
    x: 65,
    y: 355,
    width: 911,
    height: 161,
    travel: 80,
    window: [0.06, 0.36],
  },
  {
    index: '03',
    title: 'First Floor Envelope',
    description: 'Stone facade and\nprivate balcony suites',
    source: '/assembly-layers/03-envelope.webp',
    x: 55,
    y: 15,
    width: 916,
    height: 301,
    travel: 150,
    window: [0.2, 0.55],
  },
  {
    index: '04',
    title: 'Facade & Jaali Screens',
    description: 'CNC lattice screens\nand accent lighting',
    source: '/assembly-layers/04-interior-services.webp',
    x: 172,
    y: 10,
    width: 761,
    height: 342,
    travel: 190,
    window: [0.37, 0.73],
  },
  {
    index: '05',
    title: 'Architectural Framing',
    description: 'Cantilevered portals\nand roofline',
    source: '/assembly-layers/05-roof-landscape.webp',
    x: 55,
    y: 0,
    width: 911,
    height: 405,
    travel: 101,
    window: [0.53, 0.92],
  },
] as const;

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

export function LayeredAssemblySequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const axisRef = useRef<HTMLDivElement>(null);
  const plumbLeftRef = useRef<HTMLDivElement>(null);
  const plumbRightRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const headlineFirstRef = useRef<HTMLSpanElement>(null);
  const headlineSecondRef = useRef<HTMLSpanElement>(null);
  const ledeFirstRef = useRef<HTMLSpanElement>(null);
  const ledeSecondRef = useRef<HTMLSpanElement>(null);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pipRefs = useRef<Array<HTMLDivElement | null>>([]);
  const leaderRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const segmentFillRefs = useRef<Array<HTMLElement | null>>([]);
  const segmentDotRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const wrap = wrapRef.current;
    const rig = rigRef.current;
    const overlay = overlayRef.current;
    const axis = axisRef.current;
    const plumbLeft = plumbLeftRef.current;
    const plumbRight = plumbRightRef.current;
    const cue = cueRef.current;
    const headlineFirst = headlineFirstRef.current;
    const headlineSecond = headlineSecondRef.current;
    const ledeFirst = ledeFirstRef.current;
    const ledeSecond = ledeSecondRef.current;

    if (
      !section ||
      !wrap ||
      !rig ||
      !overlay ||
      !axis ||
      !plumbLeft ||
      !plumbRight ||
      !cue ||
      !headlineFirst ||
      !headlineSecond ||
      !ledeFirst ||
      !ledeSecond
    ) {
      return;
    }

    let wrapWidth = 0;
    let wrapHeight = 0;
    let wide = true;
    let target = 0;
    let current = 0;
    let animationFrame = 0;

    const measure = () => {
      const bounds = wrap.getBoundingClientRect();
      wrapWidth = bounds.width;
      wrapHeight = bounds.height;
      wide = wrapWidth > 640;
    };

    const readScroll = () => {
      const total = section.offsetHeight - window.innerHeight;
      target = total > 0 ? clamp(-section.getBoundingClientRect().top / total) : 0;
    };

    const render = (progress: number) => {
      let top = Number.POSITIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      const positions = layers.map((layer, index) => {
        const docked = outCubic(span(progress, layer.window[0], layer.window[1]));
        const offset = layer.travel * docked;
        top = Math.min(top, layer.y + offset);
        bottom = Math.max(bottom, layer.y + layer.height + offset);
        const image = imageRefs.current[index];
        if (image) image.style.transform = `translateY(${offset.toFixed(1)}px)`;
        return offset;
      });

      const retire = span(progress, 0.55, 0.95);
      const annotationRoom = wide ? 260 - 196 * retire : 112 - 78 * retire;
      const paddingTop = wide ? 92 : 34;
      const paddingBottom = 86;
      const availableHeight = Math.max(160, wrapHeight - paddingTop - paddingBottom);
      const availableWidth = Math.max(160, wrapWidth - annotationRoom - 20);
      const scale = clamp(
        Math.min(availableHeight / (bottom - top), availableWidth / canvas.width),
        0.2,
        1.8
      );

      const stackCenterX = (wrapWidth - annotationRoom) / 2;
      const bandCenterY = paddingTop + availableHeight / 2;
      const originX = stackCenterX - (canvas.width / 2) * scale;
      const originY = bandCenterY - ((top + bottom) / 2) * scale;
      rig.style.transform = `translate(${originX.toFixed(1)}px, ${originY.toFixed(1)}px) scale(${scale.toFixed(4)})`;

      const screenX = (coordinate: number) => originX + coordinate * scale;
      const screenY = (coordinate: number) => originY + coordinate * scale;
      const labelX = Math.min(
        stackCenterX + (canvas.width / 2) * scale + 16,
        wrapWidth - 252
      );

      layers.forEach((layer, index) => {
        const anchor = screenY(layer.y + (positions[index] ?? 0) + layer.height * 0.42);
        const fade = 1 - span(progress, layer.window[1] - 0.12, layer.window[1] + 0.03);
        const pip = pipRefs.current[index];
        const label = labelRefs.current[index];
        const leader = leaderRefs.current[index];

        if (pip) {
          pip.style.left = `${screenX(canvas.axis).toFixed(1)}px`;
          pip.style.top = `${anchor.toFixed(1)}px`;
          pip.style.opacity = (0.2 + 0.8 * fade).toFixed(3);
        }
        if (label) {
          label.style.top = `${anchor.toFixed(1)}px`;
          label.style.opacity = fade.toFixed(3);
          if (wide) {
            label.style.left = `${labelX.toFixed(1)}px`;
            label.style.right = 'auto';
          } else {
            label.style.left = 'auto';
            label.style.right = '4px';
          }
        }
        if (leader) leader.style.width = `${(34 * fade).toFixed(1)}px`;
      });

      const axisTop = screenY(layers[4].y + (positions[4] ?? 0) + layers[4].height * 0.42);
      const axisBottom = screenY(layers[0].y + (positions[0] ?? 0) + layers[0].height * 0.42);
      axis.style.left = `${screenX(canvas.axis).toFixed(1)}px`;
      axis.style.top = `${axisTop.toFixed(1)}px`;
      axis.style.height = `${Math.max(0, axisBottom - axisTop).toFixed(1)}px`;
      axis.style.opacity = (1 - span(progress, 0.55, 0.9)).toFixed(3);

      const guideOpacity = (1 - span(progress, 0.12, 0.62)).toFixed(3);
      [
        [plumbLeft, 140],
        [plumbRight, 890],
      ].forEach(([element, coordinate]) => {
        const guide = element as HTMLDivElement;
        guide.style.left = `${screenX(coordinate as number).toFixed(1)}px`;
        guide.style.top = `${screenY(top + 14).toFixed(1)}px`;
        guide.style.height = `${((bottom - top - 14) * scale).toFixed(1)}px`;
        guide.style.opacity = guideOpacity;
      });

      const copyHandoff = span(progress, 0.74, 0.93);
      headlineFirst.style.opacity = (1 - copyHandoff).toFixed(3);
      ledeFirst.style.opacity = (1 - copyHandoff).toFixed(3);
      headlineSecond.style.opacity = copyHandoff.toFixed(3);
      ledeSecond.style.opacity = copyHandoff.toFixed(3);
      cue.style.opacity = (1 - span(progress, 0, 0.1)).toFixed(3);

      const processPosition = progress * (steps.length - 1);
      stepRefs.current.forEach((step, index) => {
        step?.classList.toggle('assembly-sequence__step--on', processPosition >= index - 0.02);
      });
      segmentFillRefs.current.forEach((fill, index) => {
        const amount = clamp(processPosition - index);
        if (fill) fill.style.transform = `scaleX(${amount.toFixed(3)})`;
        segmentDotRefs.current[index]?.classList.toggle(
          'assembly-sequence__dot--on',
          amount > 0.98
        );
      });

      let activeStage = 1;
      steps.forEach((_, index) => {
        if (processPosition >= index - 0.02) activeStage = index + 1;
      });
      section.dataset['progress'] = progress.toFixed(3);
      section.dataset['stage'] = String(activeStage).padStart(2, '0');
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    measure();

    if (reduceMotion) {
      render(1);
      const handleResize = () => {
        measure();
        render(1);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const handleResize = () => {
      measure();
      readScroll();
    };
    const loop = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.0002) current = target;
      render(current);
      animationFrame = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize);
    readScroll();
    current = target;
    render(current);
    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="assembly-sequence"
      id="assembly-sequence"
      aria-labelledby="assembly-sequence-title"
      data-progress="0.000"
      data-stage="01"
    >
      <div className="assembly-sequence__stage">
        <div className="assembly-sequence__copy">
          <div className="assembly-sequence__tick" aria-hidden="true" />
          <h1 className="assembly-sequence__heads" id="assembly-sequence-title">
            <span ref={headlineFirstRef} className="assembly-sequence__head">
              One team.
              <br />
              Every layer.
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
            <span ref={ledeFirstRef}>Design, engineering and construction—held together.</span>
            <span ref={ledeSecondRef} aria-hidden="true">
              Five trades, one drawing set, one line of accountability.
            </span>
          </p>
          <div className="assembly-sequence__actions">
            <Link href="/projects" className="button button--light">
              Explore projects <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/cost-calculator" className="button button--outline-light">
              Cost calculator
            </Link>
          </div>
        </div>

        <div ref={wrapRef} className="assembly-sequence__wrap">
          <div
            ref={rigRef}
            className="assembly-sequence__rig"
            style={{ width: canvas.width, height: canvas.height }}
            aria-hidden="true"
          >
            {layers.map((layer, index) => (
              <img
                key={layer.index}
                ref={(element) => {
                  imageRefs.current[index] = element;
                }}
                src={layer.source}
                alt=""
                width={layer.width}
                height={layer.height}
                draggable={false}
                decoding="async"
                loading="eager"
                style={{
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  zIndex: 10 + index,
                }}
              />
            ))}
          </div>

          <div ref={overlayRef} className="assembly-sequence__overlay" aria-hidden="true">
            <div
              ref={plumbLeftRef}
              className="assembly-sequence__plumb assembly-sequence__plumb--left"
            />
            <div
              ref={plumbRightRef}
              className="assembly-sequence__plumb assembly-sequence__plumb--right"
            />
            <div ref={axisRef} className="assembly-sequence__axis" />

            {layers.map((layer, index) => (
              <div key={layer.index}>
                <div
                  ref={(element) => {
                    labelRefs.current[index] = element;
                  }}
                  className="assembly-sequence__label assembly-sequence__mono"
                >
                  <span
                    ref={(element) => {
                      leaderRefs.current[index] = element;
                    }}
                    className="assembly-sequence__leader"
                  />
                  <span className="assembly-sequence__label-pip" />
                  <span className="assembly-sequence__label-text">
                    <span className="assembly-sequence__label-heading">
                      <span className="assembly-sequence__number">{layer.index}</span>
                      <span>{layer.title}</span>
                    </span>
                    <span className="assembly-sequence__description">{layer.description}</span>
                  </span>
                </div>
                <div
                  ref={(element) => {
                    pipRefs.current[index] = element;
                  }}
                  className="assembly-sequence__pip"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="assembly-sequence__process" aria-label="Building assembly progress">
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
                  className={`assembly-sequence__step${index === 0 ? ' home-hero__step--on' : ''}`}
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
