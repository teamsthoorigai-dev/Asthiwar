'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './MapReveal.module.css';

export type MapRevealProps = {
  previewAlt: string;
  previewSrc: string;
  title: string;
  detail: string;
  buttonLabel: string;
  embedSrc: string;
  embedTitle: string;
};

/**
 * Defers the third-party map until a visitor asks for it. The preview is a
 * local site photograph rather than an unverified office-location marker.
 */
export function MapReveal({
  previewAlt,
  previewSrc,
  title,
  detail,
  buttonLabel,
  embedSrc,
  embedTitle,
}: MapRevealProps) {
  const [isMapVisible, setIsMapVisible] = useState(false);

  if (isMapVisible) {
    return (
      <div className={styles.map}>
        <iframe
          className={styles.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embedSrc}
          title={embedTitle}
        />
      </div>
    );
  }

  return (
    <button className={styles.preview} type="button" onClick={() => setIsMapVisible(true)}>
      <Image
        alt={previewAlt}
        className={styles.image}
        fill
        sizes="(max-width: 1024px) 100vw, 78rem"
        src={previewSrc}
      />
      <span className={styles.caption}>
        <span className={styles.captionTitle}>{title}</span>
        <span className={styles.captionDetail}>{detail}</span>
        <span className={styles.action}>{buttonLabel}</span>
      </span>
    </button>
  );
}
