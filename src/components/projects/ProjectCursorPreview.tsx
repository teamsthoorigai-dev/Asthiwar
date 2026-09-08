'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './ProjectCursorPreview.module.css';

type Props = {
  src: string;
  alt: string;
  title: string;
  location: string;
  visible: boolean;
};

export function ProjectCursorPreview({ src, alt, title, location, visible }: Props) {
  const portalRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -400, y: -400 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Offset preview by 24px so it doesn't block the cursor
      pos.current.x = e.clientX + 24;
      pos.current.y = e.clientY - 105;

      if (portalRef.current) {
        portalRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  if (!visible) return null;

  return (
    <div ref={portalRef} className={styles.previewPortal} aria-hidden="true">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="320px"
        className={styles.previewImage}
        priority
      />
      <div className={styles.previewMeta}>
        <span>{title}</span>
        <span>{location}</span>
      </div>
    </div>
  );
}
