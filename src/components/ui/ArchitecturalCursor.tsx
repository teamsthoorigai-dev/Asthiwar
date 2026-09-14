'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ArchitecturalCursor.module.css';

export function ArchitecturalCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [cursorMode, setCursorMode] = useState<'default' | 'hover' | 'expanded'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);

  const isVisibleRef = useRef(false);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only activate on pointer fine devices (desktops/laptops)
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    // Activates scoped CSS in globals.css to hide the default browser arrow
    document.documentElement.setAttribute('data-custom-cursor', 'active');

    const onMouseMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      // Instantly position center dot with zero latency
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;

      // Yield immediately to native cursor when hovering text fields
      const inputEl = targetEl.closest('input, textarea, select, [contenteditable="true"]');
      if (inputEl) {
        setIsTextInput(true);
        return;
      }
      setIsTextInput(false);

      const el = targetEl.closest<HTMLElement>(
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
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const render = () => {
      // Smooth inertial interpolation for outer ring (lerp 0.2)
      pos.current.x += (target.current.x - pos.current.x) * 0.2;
      pos.current.y += (target.current.y - pos.current.y) * 0.2;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    const onDragStart = (e: DragEvent) => {
      // Prevent browser native image drag from hijacking mouse events
      if ((e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('dragstart', onDragStart);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    rafId.current = requestAnimationFrame(render);

    return () => {
      document.documentElement.removeAttribute('data-custom-cursor');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('dragstart', onDragStart);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const isHidden = !isVisible || isTextInput;

  return (
    <>
      <div
        ref={dotRef}
        className={[styles.cursorDot, isHidden && styles.hidden].filter(Boolean).join(' ')}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={[
          styles.cursorRing,
          cursorMode === 'hover' && styles.cursorHoverRing,
          cursorMode === 'expanded' && styles.cursorExpandedRing,
          isHidden && styles.hidden,
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
