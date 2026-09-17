'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SplitHeading } from './SplitHeading';
import { gsap, REDUCED } from '@/lib/gsap';
import { PAGE_HERO_SIZES } from '@/lib/imageSizes';
import styles from './PageHero.module.css';

export type PageHeroImage =
  | string
  | {
      src: string;
      alt?: string;
    };

export type PageHeroProps = {
  eyebrow: string;
  title: string;
  body?: ReactNode;
  image?: PageHeroImage;
  imageAlt?: string;
  imageCaption?: readonly [string, string] | [string, string];
  /** Looping background video shown in the media slot instead of the image. `image` is kept as its poster. */
  video?: string;
  /** 'contain' shows the image at its full, uncropped proportions. Defaults to 'cover'. */
  imageFit?: 'cover' | 'contain';
  meta?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  body,
  image,
  imageAlt,
  imageCaption,
  video,
  imageFit = 'cover',
  meta,
  align = 'left',
  className,
  children,
}: PageHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const scaleLayerRef = useRef<HTMLDivElement>(null);
  const parallaxLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const imageSrc = typeof image === 'string' ? image : image?.src;
  const resolvedAlt =
    imageAlt ?? (typeof image === 'object' ? image?.alt : undefined) ?? '';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => setVideoPlaying(true);
    v.addEventListener('playing', onPlaying);
    if (!v.paused && v.readyState >= 3) {
      setVideoPlaying(true);
    } else {
      v.play().catch(() => {});
    }
    return () => {
      v.removeEventListener('playing', onPlaying);
    };
  }, [video]);

  useEffect(() => {
    const hero = heroRef.current;
    const media = mediaRef.current;
    const scaleLayer = scaleLayerRef.current;
    const parallaxLayer = parallaxLayerRef.current;

    if (REDUCED() || !hero || !media || !scaleLayer || !parallaxLayer) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        scaleLayer,
        { scale: 1.06 },
        {
          scale: 1,
          duration: 1.4,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );

      gsap.fromTo(
        parallaxLayer,
        { yPercent: 0 },
        {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: media,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, hero);

    return () => context.revert();
  }, [imageSrc]);

  return (
    <section
      ref={heroRef}
      className={[styles.pageHero, className].filter(Boolean).join(' ')}
      aria-labelledby="page-hero-title"
    >
      <div className={styles.inner}>
        <div
          className={[
            styles.content,
            align === 'center' ? styles.alignCenter : styles.alignLeft,
          ].join(' ')}
        >
          <p className={styles.eyebrow}>{eyebrow}</p>
          <SplitHeading as="h1" id="page-hero-title" className={styles.title}>
            {title}
          </SplitHeading>

          <div className={styles.introRow}>
            {body ? (
              typeof body === 'string' ? (
                <p className={styles.body}>{body}</p>
              ) : (
                <div className={styles.body}>{body}</div>
              )
            ) : null}

            {meta ? <div className={styles.meta}>{meta}</div> : null}
          </div>

          {children ? <div className={styles.extra}>{children}</div> : null}
        </div>
      </div>

      {imageSrc ? (
        <div className={styles.mediaWrapper}>
          {video ? (
            <div className={styles.videoContainer}>
              <Image
                src={imageSrc}
                alt={resolvedAlt}
                fill
                priority
                sizes={PAGE_HERO_SIZES}
                className={[styles.videoPoster, videoPlaying && styles.videoPosterHidden]
                  .filter(Boolean)
                  .join(' ')}
              />
              <video
                ref={videoRef}
                className={styles.videoElement}
                src={video}
                aria-label={resolvedAlt}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onPlaying={() => setVideoPlaying(true)}
              />
            </div>
          ) : (
            <div ref={mediaRef} className={styles.media}>
              <div ref={scaleLayerRef} className={styles.scaleLayer}>
                <div ref={parallaxLayerRef} className={styles.parallaxLayer}>
                  <Image
                    src={imageSrc}
                    alt={resolvedAlt}
                    fill
                    preload
                    sizes={PAGE_HERO_SIZES}
                    className={styles.image}
                    style={{ objectFit: imageFit }}
                  />
                </div>
              </div>
            </div>
          )}
          {imageCaption ? (
            <figcaption className={styles.caption}>
              <span>{imageCaption[0]}</span>
              <span>{imageCaption[1]}</span>
            </figcaption>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
