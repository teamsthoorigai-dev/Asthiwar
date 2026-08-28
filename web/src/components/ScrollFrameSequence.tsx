'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type ScrollFrameSequenceProps = {
  /** Number of source frames on disk, 1-based. */
  frameCount: number;
  /** Maximum frames decoded on capable desktop clients. */
  sampleCount?: number;
  /** Builds the URL for a 1-based source frame number. */
  frameSrc: (frame: number) => string;
  /** Length of the scroll track in viewport heights. */
  track?: number;
  /** Rendered over the canvas. Receives scrub progress in [0, 1]. */
  overlay?: (progress: number) => ReactNode;
  /** Accessible description of the sequence. */
  label?: string;
  className?: string;
};

/** Sparse anchors make the whole timeline scrubbable before local detail arrives. */
function anchorOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (index: number) => {
    if (index >= 0 && index < count && !seen.has(index)) {
      seen.add(index);
      order.push(index);
    }
  };

  push(0);
  push(count - 1);
  const stride = Math.max(6, Math.round(count / 14));
  for (let index = stride; index < count - 1; index += stride) push(index);
  return order;
}

function sampledFrames(sourceCount: number, targetCount: number): number[] {
  if (targetCount >= sourceCount)
    return Array.from({ length: sourceCount }, (_, index) => index + 1);
  const result: number[] = [];
  const seen = new Set<number>();
  for (let index = 0; index < targetCount; index += 1) {
    const frame = Math.round((index / (targetCount - 1)) * (sourceCount - 1)) + 1;
    if (!seen.has(frame)) {
      seen.add(frame);
      result.push(frame);
    }
  }
  if (result[result.length - 1] !== sourceCount) result.push(sourceCount);
  return result;
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

export function ScrollFrameSequence({
  frameCount,
  sampleCount = 180,
  frameSrc,
  track = 6,
  overlay,
  label = '',
  className = '',
}: ScrollFrameSequenceProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    let disposed = false;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const lightweight =
      connection?.saveData === true ||
      connection?.effectiveType === '2g' ||
      window.matchMedia('(max-width: 767px)').matches;
    const desiredCount = lightweight
      ? Math.min(90, sampleCount)
      : Math.min(sampleCount, frameCount);
    const frames = sampledFrames(frameCount, desiredCount);
    const total = frames.length;

    const images = new Map<number, HTMLImageElement>();
    const requested = new Set<number>();
    const queue: number[] = [];
    const anchors = anchorOrder(total);
    const anchorSet = new Set(anchors);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let target = 0;
    let current = 0;
    let animationFrame = 0;
    let lastProgress = -1;
    let drawn = -1;

    const targetIndex = () => Math.round(target * (total - 1));

    const nearestDecoded = (index: number): number => {
      if (images.has(index)) return index;
      for (let distance = 1; distance < total; distance += 1) {
        if (index - distance >= 0 && images.has(index - distance)) return index - distance;
        if (index + distance < total && images.has(index + distance)) return index + distance;
      }
      return -1;
    };

    const paint = (index: number, force = false) => {
      const pick = nearestDecoded(index);
      if (pick < 0 || (pick === drawn && !force)) return;
      const image = images.get(pick);
      if (!image) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const boxRatio = canvasWidth / canvasHeight;
      const drawWidth = boxRatio > imageRatio ? canvasWidth : canvasHeight * imageRatio;
      const drawHeight = boxRatio > imageRatio ? canvasWidth / imageRatio : canvasHeight;

      context.drawImage(
        image,
        (canvasWidth - drawWidth) / 2,
        (canvasHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      drawn = pick;
    };

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, lightweight ? 1.25 : 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      paint(drawn < 0 ? 0 : drawn, true);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    const revealAfter = Math.min(anchors.length, lightweight ? 5 : 7);
    let anchorsSettled = 0;
    let inFlight = 0;
    const maxParallel = lightweight ? 4 : 6;
    const maxCached = lightweight ? 28 : 48;

    const enqueue = (index: number, urgent = false) => {
      if (index < 0 || index >= total || requested.has(index) || queue.includes(index)) return;
      if (urgent) queue.unshift(index);
      else queue.push(index);
    };

    const evictDistantFrames = () => {
      if (images.size <= maxCached) return;
      const centre = targetIndex();
      const candidates = [...images.keys()]
        .filter((index) => index !== drawn && !anchorSet.has(index))
        .sort((a, b) => Math.abs(b - centre) - Math.abs(a - centre));
      while (images.size > maxCached && candidates.length > 0) {
        const index = candidates.shift();
        if (index === undefined) break;
        const image = images.get(index);
        images.delete(index);
        requested.delete(index);
        if (image) image.src = '';
      }
    };

    const pump = () => {
      while (!disposed && inFlight < maxParallel && queue.length > 0) {
        const index = queue.shift();
        if (index === undefined || requested.has(index)) continue;

        const image = new Image();
        image.decoding = 'async';
        if (index === 0) image.fetchPriority = 'high';
        requested.add(index);
        inFlight += 1;

        const settle = (ok: boolean) => {
          inFlight -= 1;
          if (disposed) return;
          if (ok) {
            images.set(index, image);
            evictDistantFrames();
          } else {
            requested.delete(index);
          }
          if (anchorSet.has(index)) {
            anchorsSettled += 1;
            setLoadPct(Math.min(100, Math.round((anchorsSettled / anchors.length) * 100)));
          }
          if (anchorsSettled >= revealAfter) setReady(true);
          paint(targetIndex());
          pump();
        };

        image.onload = () => settle(true);
        image.onerror = () => settle(false);
        image.src = frameSrc(frames[index] ?? 1);
      }
    };

    const prefetchAround = (index: number) => {
      enqueue(index, true);
      const radius = lightweight ? 4 : 7;
      for (let distance = 1; distance <= radius; distance += 1) {
        enqueue(index + distance, distance <= 2);
        enqueue(index - distance, distance <= 2);
      }
      pump();
    };

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const distance = section.offsetHeight - window.innerHeight;
      return distance <= 0 ? 0 : clamp01(-rect.top / distance);
    };

    const tick = () => {
      const delta = target - current;
      current = reduceMotion || Math.abs(delta) < 0.0005 ? target : current + delta * 0.2;
      paint(Math.round(current * (total - 1)));
      const rounded = Math.round(current * 300) / 300;
      if (rounded !== lastProgress) {
        lastProgress = rounded;
        setProgress(rounded);
      }
      animationFrame = Math.abs(target - current) < 0.0005 ? 0 : requestAnimationFrame(tick);
    };

    const schedule = () => {
      target = readProgress();
      prefetchAround(targetIndex());
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    for (const anchor of anchors) enqueue(anchor);
    schedule();
    pump();

    return () => {
      disposed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      for (const image of images.values()) {
        image.onload = null;
        image.onerror = null;
      }
      images.clear();
    };
  }, [frameCount, frameSrc, sampleCount]);

  return (
    <div
      ref={sectionRef}
      className={`scroll-sequence ${className}`}
      style={{ height: `${track * 100}vh` }}
    >
      <div ref={stageRef} className="scroll-sequence__stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          className="scroll-sequence__canvas"
          data-ready={ready || undefined}
        />

        {!ready ? (
          <div className="sequence-loader" role="status" aria-live="polite">
            <div className="sequence-loader__track">
              <div style={{ width: `${loadPct}%` }} />
            </div>
            <p>Preparing the site record · {loadPct}%</p>
          </div>
        ) : null}

        {overlay ? overlay(progress) : null}
      </div>
    </div>
  );
}
