import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';

import { SiteFooter, SiteHeader } from '@/components/SiteShell';
import { homeComparisonContent as content } from '@/data/home-comparison';
import { faqs, projects, services } from '@/data/site';
import styles from './home-1.module.css';

export const metadata: Metadata = {
  title: 'Home variant 1 — Datum',
  description: 'A field-guide approach to ASTHIWAR architecture and construction.',
  robots: { index: false, follow: false },
};

const maskStyle = (icon: string): CSSProperties => ({
  WebkitMaskImage: `url("${icon}")`,
  maskImage: `url("${icon}")`,
});

const pad = (index: number) => String(index + 1).padStart(2, '0');

/* Listed rather than indexed by template string so a renamed class fails the
   build instead of silently resolving to undefined. */
const cycleClasses = [styles.cycle0, styles.cycle1, styles.cycle2, styles.cycle3];
const fillClasses = [styles.fill0, styles.fill1, styles.fill2, styles.fill3];

/** Splits the initial off a process verb — LPAS's device on ASTHIWAR's own verbs. */
function Verb({ word }: { word: string }) {
  return (
    <>
      <span className={styles.stepInitial}>{word.charAt(0)}</span>
      {word.slice(1)}
    </>
  );
}

export default function HomeVariantOne() {
  return (
    <div className={styles.page}>
      <SiteHeader transparentAtTop />
      <div className={styles.scrollProgress} aria-hidden="true" />

      <main id="main-content">
        {/* 1 — Hero */}
        <section className={styles.hero} aria-labelledby="home-one-title">
          <div className={`${styles.heroMedia} ${styles.settleMedia}`}>
            <Image
              src="/images/hero.jpg"
              alt="A courtyard residence framed by concrete, stone, palms and a reflecting pool"
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className={styles.heroScrim} aria-hidden="true" />

          <div className={`${styles.shell} ${styles.heroInner}`}>
            <p className={styles.heroLabel}>{content.hero.label}</p>
            <h1 id="home-one-title" className={styles.heroTitle}>
              {content.hero.title}
            </h1>

            <div className={styles.heroFoot}>
              <p className={styles.heroLede}>{content.hero.body}</p>
              <div className={styles.heroActions}>
                <Link href={content.hero.secondaryAction.href} className={styles.btnPrimary}>
                  {content.hero.secondaryAction.label}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <Link href={content.hero.primaryAction.href} className={styles.btnGhost}>
                  {content.hero.primaryAction.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.heroRail} aria-hidden="true">
            <span>± 0.00</span>
            <i />
            <span>Field 01</span>
          </div>

          <a className={styles.scrollCue} href="#home-one-process">
            {content.hero.scrollLabel}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </section>

        <div className={styles.afterHero}>
          <div className={styles.dockAnchor} aria-hidden="false">
            <div className={styles.shell}>
              <div className={styles.dock}>
                <div className={styles.dockInner}>
                  <span className={styles.dockLabel}>Know your budget first</span>
                  <Link href={content.cost.action.href} className={styles.dockCta}>
                    {content.cost.action.label}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 2 — Process */}
          <section
            className={styles.process}
            id="home-one-process"
            aria-labelledby="home-one-process-title"
          >
            <div className={`${styles.shell} ${styles.processGrid}`}>
              <header className={`${styles.processAside} ${styles.reveal}`}>
                <p className={styles.sectionLabel}>{content.process.label}</p>
                <h2 id="home-one-process-title" className={styles.sectionTitle}>
                  {content.process.title}
                </h2>
                <p className={styles.sectionLede}>{content.process.body}</p>
                <p className={styles.processCount}>
                  <span>{pad(content.process.steps.length - 1)}</span>
                  <span>Stages, start to season</span>
                </p>
              </header>

              <ol className={styles.processList}>
                {content.process.steps.map((step, index) => (
                  <li key={step.verb} className={`${styles.step} ${styles.reveal}`}>
                    <span className={styles.stepIndex}>{pad(index)}</span>
                    <h3 className={styles.stepVerb}>
                      <Verb word={step.verb} />
                    </h3>
                    <p className={styles.stepBody}>{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 3 — Sustainability.
              On wide screens this pins: the photograph and the heading hold
              still while the four principles cycle one at a time. The track
              supplies the scroll length, the stage does the pinning, and the
              cycle is driven entirely by the track's own view-timeline.
              Below 64rem — and without scroll timelines, or under
              prefers-reduced-motion — none of that applies and the four
              principles render as the plain stacked list they already were. */}
          <section className={styles.sustain} aria-labelledby="home-one-sustain-title">
            <div className={styles.sustainTrack}>
              <div className={styles.sustainStage}>
                <div className={`${styles.shell} ${styles.sustainGrid}`}>
                  <figure className={`${styles.sustainMedia} ${styles.settleMedia}`}>
                    <Image
                      src="/images/sustainable.jpg"
                      alt="Earthen masonry and a perforated screen shown in direct sunlight"
                      fill
                      sizes="(max-width: 1023px) 100vw, 38vw"
                    />
                    <figcaption>{content.sustainability.imageLabel}</figcaption>
                  </figure>

                  <div className={`${styles.sustainContent} ${styles.reveal}`}>
                    <p className={`${styles.sectionLabel} ${styles.sectionLabelLight}`}>
                      {content.sustainability.label}
                    </p>
                    <h2 id="home-one-sustain-title" className={styles.sectionTitle}>
                      {content.sustainability.title}
                    </h2>
                    <p className={styles.sustainLede}>{content.sustainability.body}</p>
                    <Link
                      href={content.sustainability.action.href}
                      className={styles.textActionLight}
                    >
                      {content.sustainability.action.label}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>

                    <div className={styles.principles}>
                      {content.sustainability.principles.map((principle, index) => (
                        <article
                          className={`${styles.principle} ${cycleClasses[index] ?? ''}`}
                          key={principle.title}
                        >
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

                    {/* Segment rail. Hidden unless the cycle is active, so it
                        never promises progress the stacked list doesn't have. */}
                    <div className={styles.principleRail} aria-hidden="true">
                      {content.sustainability.principles.map((principle, index) => (
                        <span className={styles.railSegment} key={principle.title}>
                          <i className={fillClasses[index] ?? ''} />
                          {pad(index)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4 — Projects */}
          <section className={styles.projects} aria-labelledby="home-one-projects-title">
            <div className={styles.shell}>
              <header className={`${styles.projectsHead} ${styles.reveal}`}>
                <p className={styles.sectionLabel}>{content.projects.label}</p>
                <h2 id="home-one-projects-title" className={styles.sectionTitle}>
                  {content.projects.title}
                </h2>
                <Link href={content.projects.action.href} className={styles.textAction}>
                  {content.projects.action.label}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </header>

              <div className={styles.projectGrid}>
                {projects.map((project, index) => (
                  <Link
                    href={`/projects/${project.slug}`}
                    key={project.slug}
                    className={`${styles.project} ${styles.reveal}${
                      index === 0 ? ` ${styles.projectFeature}` : ''
                    }`}
                  >
                    <div className={`${styles.projectFigure} ${styles.settleMedia}`}>
                      <Image
                        src={project.image}
                        alt={project.imageAlt}
                        fill
                        /* The shell caps at 92rem, so a bare vw hint makes Next
                           serve a 3840px candidate no viewport needs. Plain
                           media conditions only — math functions in `sizes`
                           are not widely honoured and fall back to 100vw. */
                        sizes={
                          index === 0
                            ? '(max-width: 767px) 100vw, (max-width: 1600px) 92vw, 1472px'
                            : '(max-width: 767px) 100vw, (max-width: 1600px) 46vw, 736px'
                        }
                      />
                      <span className={styles.projectArrow} aria-hidden="true">
                        <ArrowUpRight size={20} />
                      </span>
                    </div>
                    <div className={styles.projectMeta}>
                      <span className={styles.projectIndex}>P-{pad(index)}</span>
                      <h3 className={styles.projectTitle}>{project.title}</h3>
                      <div className={styles.projectTags}>
                        <span>{project.type}</span>
                        <span>{project.status}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 5 — Services */}
          <section className={styles.services} aria-labelledby="home-one-services-title">
            <div className={styles.shell}>
              <header className={`${styles.servicesHead} ${styles.reveal}`}>
                <p className={`${styles.sectionLabel} ${styles.sectionLabelLight}`}>
                  {content.services.label}
                </p>
                <h2 id="home-one-services-title" className={styles.sectionTitle}>
                  {content.services.title}
                </h2>
                <p className={styles.sectionLede}>{content.services.body}</p>
              </header>

              <div className={styles.serviceList}>
                {services.map((service) => (
                  <Link
                    href={`/services#${service.slug}`}
                    key={service.slug}
                    className={`${styles.serviceRow} ${styles.reveal}`}
                  >
                    <span className={styles.serviceIndex}>{service.index}</span>
                    <h3 className={styles.serviceTitle}>{service.title}</h3>
                    <p className={styles.serviceShort}>{service.short}</p>
                    <ArrowUpRight className={styles.serviceArrow} size={22} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 6 — Cost. The conversion peak. */}
          <section className={styles.cost} aria-labelledby="home-one-cost-title">
            <div className={styles.costTexture} aria-hidden="true">
              {/* Decorative only, sitting at 0.11 opacity — a small candidate
                  is indistinguishable here and much cheaper on mobile data. */}
              <Image src="/images/jaali.jpg" alt="" fill sizes="40vw" quality={45} />
            </div>

            <div className={`${styles.shell} ${styles.costInner}`}>
              <header className={`${styles.costHead} ${styles.reveal}`}>
                <p className={styles.sectionLabel}>{content.cost.label}</p>
                <h2 id="home-one-cost-title" className={styles.sectionTitle}>
                  {content.cost.title}
                </h2>
              </header>

              <div className={`${styles.costPanel} ${styles.reveal}`}>
                <div>
                  <p className={styles.costFigure}>
                    <span className={styles.costCurrency} aria-hidden="true">
                      ₹
                    </span>
                    <strong className={styles.costNumber}>{content.cost.figure}</strong>
                  </p>
                  <p className={styles.costUnit}>{content.cost.unit}</p>
                </div>

                <div className={styles.costCopy}>
                  <p className={styles.costNote}>{content.cost.disclaimer}</p>
                  <Link href={content.cost.action.href} className={styles.costCta}>
                    {content.cost.action.label}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 7 — FAQ */}
          <section className={styles.faq} aria-labelledby="home-one-faq-title">
            <div className={`${styles.shell} ${styles.faqGrid}`}>
              <header className={`${styles.faqHead} ${styles.reveal}`}>
                <p className={styles.sectionLabel}>{content.faq.label}</p>
                <h2 id="home-one-faq-title" className={styles.sectionTitle}>
                  {content.faq.title}
                </h2>
              </header>

              <div className={styles.faqList}>
                {faqs.map((faq, index) => (
                  <details key={faq.question} name="home-one-faq">
                    <summary>
                      <span className={styles.faqIndex}>{pad(index)}</span>
                      <span className={styles.faqQuestion}>{faq.question}</span>
                      <span className={styles.faqToggle} aria-hidden="true" />
                    </summary>
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter cta="land" />
    </div>
  );
}
