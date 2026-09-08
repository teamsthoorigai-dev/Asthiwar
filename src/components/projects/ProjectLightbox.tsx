'use client';

import Image from 'next/image';
import { useCallback, useEffect } from 'react';
import styles from './ProjectLightbox.module.css';

type Props = {
  shots: ReadonlyArray<{ src: string; alt: string }>;
  title: string;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function ProjectLightbox({
  shots,
  title,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: Props) {
  const currentShot = shots[currentIndex] || shots[0];

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % shots.length);
  }, [currentIndex, onNavigate, shots.length]);

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + shots.length) % shots.length);
  }, [currentIndex, onNavigate, shots.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !currentShot) return null;

  return (
    <div
      className={styles.lightboxBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image lightbox`}
    >
      <div className={styles.topBar}>
        <div className={styles.metaInfo}>
          <span>{title}</span>
          <span>•</span>
          <span className={styles.counter}>
            {String(currentIndex + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}
          </span>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close full-screen image viewer"
        >
          &times;
        </button>
      </div>

      <div className={styles.stageArea}>
        {shots.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnLeft}`}
            onClick={handlePrev}
            aria-label="Previous photograph"
          >
            &#8592;
          </button>
        )}

        <Image
          src={currentShot.src}
          alt={currentShot.alt || title}
          fill
          sizes="90vw"
          className={styles.activeImage}
          priority
        />

        {shots.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnRight}`}
            onClick={handleNext}
            aria-label="Next photograph"
          >
            &#8594;
          </button>
        )}
      </div>

      <div className={styles.captionBar}>
        {currentShot.alt || `${title} architectural detail`}
      </div>
    </div>
  );
}
