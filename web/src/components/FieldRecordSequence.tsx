'use client';

import { ArrowDown } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';

import { ScrollFrameSequence } from '@/components/ScrollFrameSequence';

const FRAME_COUNT = 300;

/**
 * The scroll-scrubbed construction record fronts /projects. The overlay copy
 * is passed in so the sequence can head whichever page it sits on.
 */
const heroStages = [
  {
    at: 0.11,
    index: '01',
    title: 'Thoughtful architecture begins with context.',
    label: 'Design / context',
    note: 'ASTHIWAR creates thoughtful, sustainable and timeless spaces.',
  },
  {
    at: 0.32,
    index: '02',
    title: 'Architecture meets engineering precision.',
    label: 'Engineering / structure',
    note: 'We combine architectural excellence with engineering precision to build a better tomorrow.',
  },
  {
    at: 0.56,
    index: '03',
    title: 'Sustainable choices shape every layer.',
    label: 'Material / comfort',
    note: 'Natural cooling, lower-carbon methods and green building solutions support healthier spaces.',
  },
  {
    at: 0.8,
    index: '04',
    title: 'One coordinated process carries the project through.',
    label: 'Build / delivery',
    note: 'We bring architecture, engineering and execution together through one coordinated process.',
  },
] as const;

function stageFor(progress: number) {
  let active: (typeof heroStages)[number] = heroStages[0];
  for (const stage of heroStages) {
    if (progress >= stage.at) active = stage;
  }
  return active;
}

export type FieldRecordSequenceProps = {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  /** Buttons rendered under the intro paragraph. */
  actions?: ReactNode;
  /** Short prompt beside the down arrow. */
  cue?: string;
};

export function FieldRecordSequence({
  eyebrow,
  title,
  intro,
  actions,
  cue = 'Follow the process',
}: FieldRecordSequenceProps) {
  const frameSrc = useCallback(
    (frame: number) => `/frames/frame-${String(frame).padStart(3, '0')}.jpg`,
    []
  );

  return (
    <ScrollFrameSequence
      frameCount={FRAME_COUNT}
      sampleCount={180}
      frameSrc={frameSrc}
      track={6.5}
      label="A fixed-camera construction record moving from red earth and foundations to a completed home at dusk"
      className="hero-sequence"
      overlay={(progress) => (
        <HeroOverlay
          progress={progress}
          eyebrow={eyebrow}
          title={title}
          intro={intro}
          actions={actions}
          cue={cue}
        />
      )}
    />
  );
}

function HeroOverlay({
  progress,
  eyebrow,
  title,
  intro,
  actions,
  cue,
}: FieldRecordSequenceProps & { progress: number }) {
  const stage = stageFor(progress);
  const introOpacity =
    progress <= 0.025 ? 1 : progress >= 0.12 ? 0 : 1 - (progress - 0.025) / 0.095;
  const stageOpacity = progress <= 0.08 ? 0 : Math.min(1, (progress - 0.08) / 0.08);
  const frame = Math.max(1, Math.round(progress * FRAME_COUNT));

  return (
    <div className="hero-overlay">
      <div className="hero-overlay__scrim" aria-hidden="true" />
      <div className="hero-overlay__grid" aria-hidden="true" />

      <div className="hero-overlay__intro shell" style={{ opacity: introOpacity }}>
        <p className="eyebrow eyebrow--light">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="hero-overlay__intro-foot">
          <div>
            <p>{intro}</p>
            {actions ? <div className="hero-overlay__actions">{actions}</div> : null}
          </div>
          <span className="hero-overlay__cue">
            <ArrowDown size={16} aria-hidden="true" />
            {cue}
          </span>
        </div>
      </div>

      <div className="hero-overlay__stage shell" style={{ opacity: stageOpacity }}>
        <div
          key={stage.index}
          className="hero-overlay__stage-copy"
          data-stage={stage.index}
        >
          <p className="eyebrow eyebrow--light">
            {stage.index} / {stage.label}
          </p>
          <h2>{stage.title}</h2>
          <p>{stage.note}</p>
        </div>
      </div>

      <div className="hero-overlay__counter">
        <span>FIELD RECORD</span>
        <strong>{String(frame).padStart(3, '0')}</strong>
        <span>/ {FRAME_COUNT}</span>
        <div aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      <ol className="hero-overlay__rail" aria-label="Construction sequence stages">
        {heroStages.map((item) => (
          <li
            key={item.index}
            data-active={item.index === stage.index && progress > 0.08 ? true : undefined}
          >
            <span>{item.index}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
