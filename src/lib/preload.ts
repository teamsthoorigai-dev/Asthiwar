import { getImageProps } from 'next/image';
import { readConnection } from './frameSequence';

/**
 * Save-Data or 2G. Such visitors get what is on their screen and nothing ahead
 * of it.
 */
export function isDataConstrained(): boolean {
  const { saveData, effectiveType } = readConnection();
  return Boolean(saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
}

export function pageLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

export function idle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 300);
  });
}

/** Laid out, so not inside anything display:none — the closed menu's logo, phone-only photos on desktop. */
export function isRendered(el: Element): boolean {
  return el.checkVisibility?.() ?? el.getClientRects().length > 0;
}

/**
 * Starts an image now rather than when it scrolls near, and resolves once it
 * has loaded or failed. The browser still picks the srcset candidate it would
 * have picked on scroll, so the early copy is the one shown.
 */
export function loadNow(
  img: HTMLImageElement,
  { priority = 'low', timeoutMs = 10_000 }: { priority?: RequestPriority; timeoutMs?: number } = {},
): Promise<void> {
  if (img.complete) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    timer = setTimeout(done, timeoutMs);
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });

    // In modern browsers, mutating an existing DOM node's loading attribute to 'eager'
    // often fails to wake the network stack for offscreen elements. An offscreen Image
    // with identical sizes/srcset forces an immediate fetch into the HTTP cache.
    const prefetch = new Image();
    prefetch.decoding = 'async';
    prefetch.fetchPriority = priority;
    if (img.sizes) prefetch.sizes = img.sizes;
    if (img.srcset) prefetch.srcset = img.srcset;
    prefetch.src = img.currentSrc || img.src;
    prefetch.onload = done;
    prefetch.onerror = done;
  });
}

/** Runs `task` over `items`, at most `concurrency` at a time, starting nothing new once aborted. */
export async function eachLimit<T>(
  items: readonly T[],
  concurrency: number,
  signal: AbortSignal,
  task: (item: T) => Promise<unknown>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (!signal.aborted && next < items.length) {
      const item = items[next];
      next += 1;
      await task(item);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

/**
 * Fetches, into the browser cache, an image a page will show later.
 *
 * With `sizes`, the URL is built the way next/image builds it, and the browser
 * picks from that srcset exactly as it will when the real <Image> renders, so
 * the page later finds the same file already cached. Without `sizes`, the raw
 * file is fetched, as a <video> poster uses it.
 */
export function warmImage(src: string, sizes?: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.onload = () => resolve();
    img.onerror = () => resolve();

    if (sizes === undefined) {
      img.src = src;
      return;
    }

    const { props } = getImageProps({ src, alt: '', fill: true, sizes });
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  });
}

/** This page's lazy images still waiting for a scroll, top to bottom. */
export function warmPageImages(signal: AbortSignal, concurrency: number): Promise<void> {
  const waiting = Array.from(document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')).filter(isRendered);
  // A lazy image that never reports back must not hold up whatever runs after this.
  return eachLimit(waiting, concurrency, signal, (img) => loadNow(img, { priority: 'low', timeoutMs: 10_000 }));
}
