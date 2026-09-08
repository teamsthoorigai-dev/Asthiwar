'use client';

import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger, FLOAT, REDUCED } from './gsap';

/**
 * Motion F3 — depth drift. The signature of the float language.
 *
 * Within each `[data-float-section]` under `scopeRef`, layers scrub past each
 * other at different rates while the section crosses the viewport:
 *
 *   [data-drift="back"]   image      yPercent  -8 →  8
 *   (unmarked)            heading    anchored at 0
 *   [data-drift="front"]  index/body yPercent   6 → -6
 *
 * The ranges are deliberately tiny. The viewer must not be able to see this
 * happening — only feel that the composition breathes. FLOAT caps both layers
 * under ±10%; anything larger reads as parallax showboating.
 *
 * Drift is desktop only. Below 768px the layers stack vertically, where
 * counter-motion separates elements that are meant to read as one block.
 */
export function useDepthDrift(scopeRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || REDUCED()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      const sections = scope.querySelectorAll<HTMLElement>('[data-float-section]');

      sections.forEach((section) => {
        const layers: Array<[string, number]> = [
          ['[data-drift="back"]', FLOAT.driftBack],
          ['[data-drift="front"]', -FLOAT.driftFront],
        ];

        layers.forEach(([selector, amount]) => {
          const targets = section.querySelectorAll<HTMLElement>(selector);
          if (targets.length === 0) return;

          gsap.fromTo(
            targets,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
                // Only the layers actually on screen carry a compositor hint
                onToggle: (self) => {
                  targets.forEach((t) => {
                    t.style.willChange = self.isActive ? 'transform' : 'auto';
                  });
                },
              },
            },
          );
        });
      });

      ScrollTrigger.refresh();
    });

    return () => mm.revert();
  }, [scopeRef]);
}
