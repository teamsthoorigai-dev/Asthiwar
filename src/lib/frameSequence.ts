/**
 * The /projects construction sequence: 300 webp frames (~20MB), held in one
 * module-level store so every consumer shares the same downloads.
 *
 * The homepage warms this store in the background; ProjectsHeroSequence reads
 * from it. Next.js keeps module state across client-side navigation, so frames
 * fetched on the homepage are already decoded images when /projects mounts —
 * no second request, not even a revalidation.
 */

export const FRAME_COUNT = 300;

/** Frames the warm-up downloads first and times, to decide whether to fetch the rest. */
const PROBE_FRAMES = 8;

/** Zero-based index to its file. */
export function framePath(index: number): string {
  return `/frames/frame-${String(index + 1).padStart(3, '0')}.webp`;
}

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
};

/** What the browser reports about the connection. Every field may be missing. */
export function readConnection(): NetworkInformationLike {
  if (typeof navigator === 'undefined') return {};
  return (navigator as unknown as { connection?: NetworkInformationLike }).connection ?? {};
}

const frames: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);
const inFlight = new Map<number, Promise<boolean>>();
const listeners = new Set<(index: number) => void>();

export function isFrameReady(index: number): boolean {
  return frames[index] !== undefined;
}

/** The decoded frame, or undefined until it has loaded. */
export function getFrame(index: number): HTMLImageElement | undefined {
  return frames[index];
}

/** Called with the index of every frame that finishes loading, whoever requested it. */
export function onFrameReady(listener: (index: number) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Resolves true once the frame is ready, false if it failed. A frame already
 * loading is not requested twice; a failed one is retried on the next call.
 */
export function loadFrame(index: number, priority: RequestPriority = 'auto'): Promise<boolean> {
  if (index < 0 || index >= FRAME_COUNT) return Promise.resolve(false);
  if (frames[index]) return Promise.resolve(true);

  const pending = inFlight.get(index);
  if (pending) return pending;

  const request = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = priority;

    const onLoaded = () => {
      inFlight.delete(index);
      frames[index] = img;
      listeners.forEach((listener) => listener(index));
      resolve(true);
    };

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(onLoaded).catch(onLoaded);
      } else {
        onLoaded();
      }
    };
    img.onerror = () => {
      inFlight.delete(index);
      resolve(false);
    };
    img.src = framePath(index);
  });

  inFlight.set(index, request);
  return request;
}

let order: number[] | null = null;

/**
 * Every frame once, coarse to fine: both ends, then each pass halves the gap.
 * Any prefix of this order is spread evenly across the whole sequence, so a
 * scrub that starts before loading finishes jumps between nearby frames rather
 * than freezing on one stretch of it.
 */
function progressiveOrder(): number[] {
  if (order) return order;

  const seen = new Uint8Array(FRAME_COUNT);
  const result: number[] = [];
  const add = (index: number) => {
    if (!seen[index]) {
      seen[index] = 1;
      result.push(index);
    }
  };

  add(0);
  add(FRAME_COUNT - 1);
  for (let stride = 2 ** Math.floor(Math.log2(FRAME_COUNT - 1)); stride >= 1; stride /= 2) {
    for (let index = 0; index < FRAME_COUNT; index += stride) add(index);
  }

  order = result;
  return order;
}

type WarmOptions = {
  /** Parallel downloads. */
  concurrency: number;
  /** Aborting stops new downloads; ones already in flight still land in the store. */
  signal: AbortSignal;
  priority?: RequestPriority;
  /** Only the first this-many frames of the progressive order. Defaults to all of them. */
  limit?: number;
  /** Called as each frame of the batch settles, loaded or failed. */
  onProgress?: (settled: number, total: number) => void;
  /**
   * When set, the first PROBE_FRAMES double as a speed test: if they take
   * longer than this, the rest are left to load on demand.
   */
  probeBudgetMs?: number;
};

/** Downloads the sequence in progressive order, skipping frames already held. */
export async function warmFrames({
  concurrency,
  signal,
  priority = 'low',
  limit = FRAME_COUNT,
  onProgress,
  probeBudgetMs,
}: WarmOptions): Promise<'done' | 'aborted' | 'too-slow'> {
  const queue = progressiveOrder().slice(0, limit);
  let next = 0;
  let settled = 0;

  const drainUntil = (end: number) => {
    const worker = async () => {
      while (!signal.aborted && next < end) {
        const index = queue[next];
        next += 1;
        if (!isFrameReady(index)) await loadFrame(index, priority);
        settled += 1;
        onProgress?.(settled, queue.length);
      }
    };
    return Promise.all(Array.from({ length: concurrency }, worker));
  };

  if (probeBudgetMs !== undefined) {
    const started = performance.now();
    await drainUntil(Math.min(PROBE_FRAMES, queue.length));
    if (signal.aborted) return 'aborted';
    if (performance.now() - started > probeBudgetMs) return 'too-slow';
  }

  await drainUntil(queue.length);
  return signal.aborted ? 'aborted' : 'done';
}
