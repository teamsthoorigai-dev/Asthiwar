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
  const [isSelecting, setIsSelecting] = useState(false);

  const isVisibleRef = useRef(false);
  const isMouseDownRef = useRef(false);
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

    const updatePosition = (clientX: number, clientY: number) => {
      target.current.x = clientX;
      target.current.y = clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
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

    const onMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      const targetEl = e.target as HTMLElement | null;
      // If clicking inside selectable text containers (not buttons, interactive controls, or custom cursor triggers)
      const interactiveEl = targetEl?.closest('a, button, [role="button"], [role="slider"], [data-cursor]');
      if (!interactiveEl && targetEl?.closest('p, h1, h2, h3, h4, h5, h6, span, li, dt, dd, blockquote, code, pre, label, article, section')) {
        setIsSelecting(true);
        document.documentElement.setAttribute('data-cursor-selecting', 'true');
      }
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
      // Check if any text is actively selected
      const selection = window.getSelection();
      const hasSelection = selection ? selection.toString().length > 0 : false;
      if (!hasSelection) {
        setIsSelecting(false);
        document.documentElement.removeAttribute('data-cursor-selecting');
      }
    };

    const onSelectionChange = () => {
      const selection = window.getSelection();
      const hasSelection = selection ? selection.toString().length > 0 : false;
      if (hasSelection) {
        setIsSelecting(true);
        document.documentElement.setAttribute('data-cursor-selecting', 'true');
      } else if (!isMouseDownRef.current) {
        setIsSelecting(false);
        document.documentElement.removeAttribute('data-cursor-selecting');
      }
    };

    const onSelectStart = () => {
      setIsSelecting(true);
      document.documentElement.setAttribute('data-cursor-selecting', 'true');
    };

    const onMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const onBlur = () => {
      isMouseDownRef.current = false;
      setIsSelecting(false);
      document.documentElement.removeAttribute('data-cursor-selecting');
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
      // Prevent browser native drag-and-drop on text, links, and images
      // from hijacking pointer tracking and freezing the custom cursor
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('[draggable="true"]')) {
        e.preventDefault();
      }
    };

    const onDragOver = (e: DragEvent) => {
      // Keep coordinates live if any drag operation occurs
      updatePosition(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('dragover', onDragOver, { passive: true });
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('selectstart', onSelectStart);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('blur', onBlur);

    rafId.current = requestAnimationFrame(render);

    return () => {
      document.documentElement.removeAttribute('data-custom-cursor');
      document.documentElement.removeAttribute('data-cursor-selecting');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('dragover', onDragOver);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('selectstart', onSelectStart);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('blur', onBlur);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const isHidden = !isVisible || isTextInput || isSelecting;

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
