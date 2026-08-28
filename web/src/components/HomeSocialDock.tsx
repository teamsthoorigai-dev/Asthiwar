'use client';

import { Facebook, Instagram, Youtube } from 'lucide-react';
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.008c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.53-8.413Z" />
    </svg>
  );
}

const socialChannels = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
  { label: 'WhatsApp', Icon: WhatsAppIcon },
  { label: 'Facebook', Icon: Facebook },
] as const;

type DockPosition = {
  x: number;
  y: number;
};

const VIEWPORT_GAP = 8;

export function HomeSocialDock() {
  const dockRef = useRef<HTMLElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [position, setPosition] = useState<DockPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const keepInViewport = (x: number, y: number) => {
    const dock = dockRef.current;
    if (!dock) return { x, y };

    const rect = dock.getBoundingClientRect();
    return {
      x: Math.min(Math.max(VIEWPORT_GAP, x), window.innerWidth - rect.width - VIEWPORT_GAP),
      y: Math.min(Math.max(VIEWPORT_GAP, y), window.innerHeight - rect.height - VIEWPORT_GAP),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    const dock = dockRef.current;
    if (!dock) return;

    const rect = dock.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    isDraggingRef.current = true;
    setIsDragging(true);
    setPosition({ x: rect.left, y: rect.top });
    event.preventDefault();
  };

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!isDraggingRef.current) return;

      setPosition(
        keepInViewport(
          event.clientX - dragOffset.current.x,
          event.clientY - dragOffset.current.y,
        ),
      );
    };

    const handlePointerEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const handleResize = () => {
      setPosition((current) => (current ? keepInViewport(current.x, current.y) : current));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('resize', handleResize);
    };
  });

  const dockStyle = position
    ? ({ left: position.x, top: position.y, right: 'auto', bottom: 'auto' } satisfies CSSProperties)
    : undefined;

  return (
    <nav
      ref={dockRef}
      className="home-social-dock"
      aria-label="Social media links. Drag to reposition."
      data-dragging={isDragging || undefined}
      style={dockStyle}
      onPointerDown={handlePointerDown}
    >
      <ul>
        {socialChannels.map(({ label, Icon }) => (
          <li key={label}>
            <span className="home-social-dock__item" aria-label={`${label} link coming soon`} title={label}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
