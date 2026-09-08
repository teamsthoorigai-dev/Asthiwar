import type Lenis from 'lenis';

/**
 * There is exactly one Lenis instance, owned by SmoothScroll. The menu overlay
 * needs to pause it while open, so it is registered here rather than threaded
 * through context.
 *
 * Under reduced motion no instance exists, so the body class does the locking.
 */
let instance: Lenis | null = null;

export function registerLenis(next: Lenis | null) {
  instance = next;
}

export function lockScroll() {
  instance?.stop();
  document.body.dataset.scrollLocked = 'true';
}

export function unlockScroll() {
  instance?.start();
  delete document.body.dataset.scrollLocked;
}
