import Image from 'next/image';
import type { ReactNode } from 'react';

export function PageHero({
  className = '',
  tone = 'carbon',
  eyebrow,
  title,
  intro,
  image,
  imageAlt = '',
  imageCaption = ['ASTHIWAR / FIELD RECORD', 'COIMBATORE · TAMIL NADU'],
  meta,
  children,
}: {
  className?: string;
  tone?: 'carbon' | 'forest';
  eyebrow: string;
  title: string;
  intro: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: [string, string];
  meta?: ReactNode;
  children?: ReactNode;
}) {
  const classes = [
    'page-hero',
    tone === 'forest' ? 'page-hero--forest' : '',
    image ? 'page-hero--image' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      <div className="page-hero__linework" aria-hidden="true" />
      <div className="shell page-hero__inner">
        <div className="page-hero__content">
          <p className="eyebrow eyebrow--light">{eyebrow}</p>
          <h1>{title}</h1>
          <div className="page-hero__intro-row">
            <p>{intro}</p>
            {meta ? <div className="page-hero__meta">{meta}</div> : null}
          </div>
          {children}
        </div>
      </div>
      {image ? (
        <figure className="page-hero__image-wrap">
          <Image
            src={image}
            alt={imageAlt}
            width={1600}
            height={1000}
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
          <figcaption>
            <span>{imageCaption[0]}</span>
            <span>{imageCaption[1]}</span>
          </figcaption>
        </figure>
      ) : null}
    </section>
  );
}
