'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ArchitecturalCursor.module.css';

export function ArchitecturalCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [cursorMode, setCursorMode] = useState<'default' | 'hover' | 'expanded'>('default');
  const [isVisible, setIsVisible] = useState(false);

  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only activate on pointer fine devices (desktops/laptops)
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Instantly position center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        '[data-cursor], a, button, [role="button"], [role="slider"]',
      );

      if (el) {
        const customType = el.getAttribute('data-cursor');
        if (customType) {
          setCursorLabel(customType.toUpperCase());
          setCursorMode('expanded');
        } else if (el.getAttribute('role') === 'slider') {
          setCursorLabel('DRAG');
          setCursorMode('expanded');
        } else {
          setCursorLabel('');
          setCursorMode('hover');
        }
      } else {
        setCursorLabel('');
        setCursorMode('default');
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const render = () => {
      // Smooth inertial interpolation for outer ring
      pos.current.x += (target.current.x - pos.current.x) * 0.2;
      pos.current.y += (target.current.y - pos.current.y) * 0.2;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={dotRef}
        className={[styles.cursorDot, !isVisible && styles.hidden].filter(Boolean).join(' ')}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={[
          styles.cursorRing,
          cursorMode === 'hover' && styles.cursorHoverRing,
          cursorMode === 'expanded' && styles.cursorExpandedRing,
          !isVisible && styles.hidden,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {cursorLabel && <span className={styles.cursorLabel}>{cursorLabel}</span>}
      </div>
    </>
  );
}
