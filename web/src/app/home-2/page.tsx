import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';

import { SiteFooter, SiteHeader } from '@/components/SiteShell';
import { homeComparisonContent as content } from '@/data/home-comparison';
import { faqs, projects, services } from '@/data/site';
import styles from './home-2.module.css';

export const metadata: Metadata = {
  title: 'Home variant 2 — Sun Screen',
  description: 'An atmospheric, image-led design direction for ASTHIWAR.',
  robots: { index: false, follow: false },
};

const maskStyle = (icon: string): CSSProperties => ({
  WebkitMaskImage: `url("${icon}")`,
  maskImage: `url("${icon}")`,
});

export default function HomeVariantTwo() {
  return (
    <div className={styles.page}>
      <SiteHeader transparentAtTop />
      <div className={styles.scrollProgress} aria-hidden="true" />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="home-two-title">
          <div className={styles.heroMedia}>
            <Image
              src="/images/hero.jpg"
              alt="A shaded courtyard residence with stone walls, palms and a reflecting pool"
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />

          <div className={styles.shutters} aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} />
            ))}
          </div>

          <div className={`${styles.shell} ${styles.heroInner}`}>
            <p className={styles.heroLabel}>{content.hero.label}</p>
            <h1 id="home-two-title">{content.hero.title}</h1>
            <div className={styles.heroFoot}>
              <p>{content.hero.body}</p>
              <div className={styles.heroActions}>
                <Link href={content.hero.primaryAction.href} className={styles.lightAction}>
                  {content.hero.primaryAction.label}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <Link href={content.hero.secondaryAction.href} className={styles.ghostAction}>
                  {content.hero.secondaryAction.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.sunPath} aria-hidden="true">
            <span />
          </div>
          <a className={styles.scrollCue} href="#home-two-process">
            {content.hero.scrollLabel}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </section>

        <section className={styles.process} id="home-two-process" aria-labelledby="home-two-process-title">
          <div className={`${styles.shell} ${styles.processIntro}`}>
            <p className={styles.sectionLabel}>{content.process.label}</p>
            <div>
              <h2 id="home-two-process-title">{content.process.title}</h2>
              <p>{content.process.body}</p>
            </div>
          </div>

          <div className={styles.processViewport}>
            <div className={`${styles.shell} ${styles.processRail}`} role="list">
              {content.process.steps.map((step, index) => (
                <article className={styles.processStep} key={step.verb} role="listitem">
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.verb}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>

          <figure className={`${styles.shell} ${styles.processFigure}`}>
            <div>
              <Image
                src="/images/materials.jpg"
                alt="Stone, timber, brick screen and architectural drawings arranged as material samples"
                fill
                sizes="(max-width: 767px) 100vw, 64vw"
              />
            </div>
            <figcaption>
              <span>One information set</span>
              <span>From material sample to handover</span>
            </figcaption>
          </figure>
        </section>

        <section className={styles.sustainability} aria-labelledby="home-two-sustain-title">
          <div className={styles.sustainVisual}>
            <Image
              src="/images/sustainable.jpg"
              alt="Deep shade moving across earthen masonry and a ventilating screen"
              fill
              sizes="(max-width: 899px) 100vw, 50vw"
            />
            <div className={styles.orbits} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>{content.sustainability.imageLabel}</p>
          </div>

          <div className={styles.sustainContent}>
            <p className={styles.sectionLabel}>{content.sustainability.label}</p>
            <h2 id="home-two-sustain-title">{content.sustainability.title}</h2>
            <p className={styles.sustainLead}>{content.sustainability.body}</p>
            <Link href={content.sustainability.action.href} className={styles.inkAction}>
              {content.sustainability.action.label}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>

            <div className={styles.principles}>
              {content.sustainability.principles.map((principle) => (
                <article className={styles.principle} key={principle.title}>
                  <span
                    className={styles.principleIcon}
                    style={maskStyle(principle.icon)}
                    aria-hidden="true"
                  />
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.projects} aria-labelledby="home-two-projects-title">
          <div className={`${styles.shell} ${styles.sectionHead}`}>
            <p className={styles.sectionLabel}>{content.projects.label}</p>
            <h2 id="home-two-projects-title">{content.projects.title}</h2>
            <Link href={content.projects.action.href} className={styles.inkAction}>
              {content.projects.action.label}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={`${styles.shell} ${styles.projectFlow}`}>
            {projects.map((project, index) => (
              <Link
                href={`/projects/${project.slug}`}
                className={styles.project}
                key={project.slug}
              >
                <div className={styles.projectFigure}>
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 767px) 100vw, 74vw"
                  />
                  <span className={styles.projectArrow} aria-hidden="true">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className={styles.projectBody}>
                  <span className={styles.projectIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{project.title}</h3>
                  <p>
                    {project.type} · {project.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.services} aria-labelledby="home-two-services-title">
          <div className={`${styles.shell} ${styles.servicesHead}`}>
            <p className={styles.sectionLabel}>{content.services.label}</p>
            <div>
              <h2 id="home-two-services-title">{content.services.title}</h2>
              <p>{content.services.body}</p>
            </div>
          </div>

          <div className={styles.serviceList}>
            {services.map((service) => (
              <Link
                href={`/services#${service.slug}`}
                className={styles.service}
                key={service.slug}
              >
                <span>{service.index}</span>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.cost} aria-labelledby="home-two-cost-title">
          <div className={styles.costImage} aria-hidden="true">
            <Image src="/images/jaali.jpg" alt="" fill sizes="(max-width: 899px) 100vw, 52vw" />
          </div>
          <div className={`${styles.shell} ${styles.costInner}`}>
            <p className={styles.sectionLabel}>{content.cost.label}</p>
            <h2 id="home-two-cost-title">{content.cost.title}</h2>
            <div className={styles.costDetails}>
              <div className={styles.costFigure}>
                <span>₹</span>
                <strong>{content.cost.figure}</strong>
                <p>{content.cost.unit}</p>
              </div>
              <div className={styles.costCopy}>
                <p>{content.cost.disclaimer}</p>
                <Link href={content.cost.action.href} className={styles.lightAction}>
                  {content.cost.action.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.faq} aria-labelledby="home-two-faq-title">
          <div className={`${styles.shell} ${styles.faqLayout}`}>
            <div className={styles.faqHead}>
              <p className={styles.sectionLabel}>{content.faq.label}</p>
              <h2 id="home-two-faq-title">{content.faq.title}</h2>
            </div>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details key={faq.question} name="home-two-faq">
                  <summary>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {faq.question}
                    <span className={styles.faqToggle} aria-hidden="true" />
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter cta="land" />
    </div>
  );
}
