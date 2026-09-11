'use client';

import { useEffect } from 'react';

/**
 * Publishes the vertical scrollbar's width as `--scrollbar`.
 *
 * `100vw` counts the scrollbar; a container centred with `margin-inline: auto`
 * does not. Anything that insets itself from the viewport with a vw calc — the
 * services scroller's panels, for one — therefore lands half a scrollbar to the
 * right of every container-bound section on every other page.
 *
 * CSS cannot work this out on its own: `calc(100vw - 100%)` is substituted as a
 * token and re-resolved against whichever element reads it, and registering the
 * property as a `<length>` rejects the percentage. So it is measured here.
 *
 * The default in globals.css is 0px, which is already right for overlay
 * scrollbars (macOS, touch), where this effect measures 0 anyway.
 */
export function ScrollbarWidth() {
  useEffect(() => {
    const write = () => {
      const width = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar', `${Math.max(0, width)}px`);
    };

    write();
    window.addEventListener('resize', write);
    return () => {
      window.removeEventListener('resize', write);
      document.documentElement.style.removeProperty('--scrollbar');
    };
  }, []);

  return null;
}
