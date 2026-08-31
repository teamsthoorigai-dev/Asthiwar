'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useCallback } from 'react';

import { ProjectCard } from '@/components/ProjectCard';
import { ScrollFrameSequence } from '@/components/ScrollFrameSequence';
import { SectionHeading, SiteFooter, SiteHeader } from '@/components/SiteShell';
import { faqs, projects, services } from '@/data/site';

const FRAME_COUNT = 300;

const heroStages = [
  {
    at: 0.11,
    index: '01',
    title: 'Thoughtful architecture begins with context.',
    label: 'Design / context',
    note: 'ASTHIWAR creates thoughtful, sustainable and timeless spaces.',
  },
  {
    at: 0.32,
    index: '02',
    title: 'Architecture meets engineering precision.',
    label: 'Engineering / structure',
    note: 'We combine architectural excellence with engineering precision to build a better tomorrow.',
  },
  {
    at: 0.56,
    index: '03',
    title: 'Sustainable choices shape every layer.',
    label: 'Material / comfort',
    note: 'Natural cooling, lower-carbon methods and green building solutions support healthier spaces.',
  },
  {
    at: 0.8,
    index: '04',
    title: 'One coordinated process carries the project through.',
    label: 'Build / delivery',
    note: 'We bring architecture, engineering and execution together through one coordinated process.',
  },
] as const;

function stageFor(progress: number) {
  let active: (typeof heroStages)[number] = heroStages[0];
  for (const stage of heroStages) {
    if (progress >= stage.at) active = stage;
  }
  return active;
}

export function JourneyPage() {
  const frameSrc = useCallback(
    (frame: number) => `/frames/frame-${String(frame).padStart(3, '0')}.jpg`,
    []
  );

  return (
    <div className="home-page">
      <SiteHeader />
      <main id="main-content">
        <ScrollFrameSequence
          frameCount={FRAME_COUNT}
          sampleCount={180}
          frameSrc={frameSrc}
          track={6.5}
          label="A fixed-camera construction record moving from red earth and foundations to a completed home at dusk"
          className="hero-sequence"
          overlay={(progress) => <HeroOverlay progress={progress} />}
        />

        <StudioIntroduction />
        <FeaturedProjects />
        <EstimateSection />
      </main>
      <SiteFooter cta="land" />
    </div>
  );
}

function HeroOverlay({ progress }: { progress: number }) {
  const stage = stageFor(progress);
  const introOpacity =
    progress <= 0.025 ? 1 : progress >= 0.12 ? 0 : 1 - (progress - 0.025) / 0.095;
  const stageOpacity = progress <= 0.08 ? 0 : Math.min(1, (progress - 0.08) / 0.08);
  const frame = Math.max(1, Math.round(progress * FRAME_COUNT));

  return (
    <div className="hero-overlay">
      <div className="hero-overlay__scrim" aria-hidden="true" />
      <div className="hero-overlay__grid" aria-hidden="true" />

      <div className="hero-overlay__intro shell" style={{ opacity: introOpacity }}>
        <p className="eyebrow eyebrow--light">ASTHIWAR / Design &amp; build company</p>
        <h1>
          Designing spaces.
          <br />
          Building tomorrow.
        </h1>
        <div className="hero-overlay__intro-foot">
          <div>
            <p>
              Thoughtful architecture, precise engineering and sustainable design-build solutions.
            </p>
            <div className="hero-overlay__actions">
              <Link href="/projects" className="button button--light">
                View projects <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/cost-calculator" className="button button--outline-light">
                Cost calculator
              </Link>
            </div>
          </div>
          <span className="hero-overlay__cue">
            <ArrowDown size={16} aria-hidden="true" />
            Follow the process
          </span>
        </div>
      </div>

      <div className="hero-overlay__stage shell" style={{ opacity: stageOpacity }}>
        <div key={stage.index} className="hero-overlay__stage-copy">
          <p className="eyebrow eyebrow--light">
            {stage.index} / {stage.label}
          </p>
          <h2>{stage.title}</h2>
          <p>{stage.note}</p>
        </div>
      </div>

      <div className="hero-overlay__counter">
        <span>FIELD RECORD</span>
        <strong>{String(frame).padStart(3, '0')}</strong>
        <span>/ {FRAME_COUNT}</span>
        <div aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      <ol className="hero-overlay__rail" aria-label="Construction sequence stages">
        {heroStages.map((item) => (
          <li
            key={item.index}
            data-active={item.index === stage.index && progress > 0.08 ? true : undefined}
          >
            <span>{item.index}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StudioIntroduction() {
  return (
    <section className="home-intro section section--paper">
      <div className="shell">
        <p className="eyebrow">About ASTHIWAR</p>
        <div className="home-intro__statement">
          <h2>
            Design.
            <br />
            Engineering.
            <br />
            Built with intent.
          </h2>
          <div>
            <p>
              ASTHIWAR is a design &amp; build company focused on creating thoughtful, sustainable
              and timeless spaces. We bring architecture, engineering and execution together through
              one coordinated process.
            </p>
            <Link href="/about" className="text-link">
              Explore our story <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <figure className="home-intro__material">
          <Image
            src="/images/materials.jpg"
            alt="Earth, timber, stone, and mineral material samples in the ASTHIWAR studio"
            width={1600}
            height={1000}
            sizes="(max-width: 1024px) 100vw, 92vw"
          />
          <figcaption>
            <span>Material study / 04</span>
            <span>Touch before specification</span>
          </figcaption>
        </figure>

        <div
          className="home-intro__facts home-intro__facts--three"
          aria-label="ASTHIWAR project principles"
        >
          <div>
            <span>01</span>
            <h3>Architectural excellence</h3>
            <p>Thoughtful designs that stand the test of time.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Engineering precision</h3>
            <p>Built with accuracy, strength and quality.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Sustainable future</h3>
            <p>Creating healthier spaces for a better tomorrow.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesSection() {
  return (
    <section className="services-index section section--mineral">
      <div className="shell">
        <SectionHeading
          eyebrow="Our services"
          title="Five disciplines. One continuous process."
          body="Architecture, interior, construction, structural engineering and green building brought together through one coordinated process."
        />
        <div className="services-index__list">
          {services.map((service) => (
            <Link key={service.slug} href={`/services#${service.slug}`} className="service-row">
              <span>{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.short}</p>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProjects() {
  return (
    <section className="featured-projects section section--paper">
      <div className="shell">
        <SectionHeading
          eyebrow="Featured projects"
          title="Built form. In context."
          body="A collection of spaces shaped by context, material and intent. Verified project information will be added after approval."
        />
        <div className="featured-projects__grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={index}
              featured={index === 0}
            />
          ))}
        </div>
        <div className="section-end-link">
          <Link href="/projects" className="text-link">
            View all projects <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SustainabilitySection() {
  const elements = [
    {
      index: '01',
      title: 'Natural cooling',
      description:
        'Designing for the natural flow of air to keep interiors cooler and reduce reliance on artificial ventilation.',
      image: '/images/courtyard.jpg',
      imageAlt: 'Shaded courtyard with open circulation and a mature tree at its centre',
    },
    {
      index: '02',
      title: 'Low-cement construction',
      description:
        'Exploring lower-carbon construction methods and material choices while maintaining structural integrity.',
      image: '/images/materials.jpg',
      imageAlt: 'Masonry, stone, timber, and concrete samples beside architectural drawings',
    },
    {
      index: '03',
      title: 'Long-term well-being',
      description:
        'Creating spaces that lower operational costs while improving indoor air quality and everyday well-being.',
      image: '/images/hero.jpg',
      imageAlt: 'Climate-responsive home arranged around water, shade, and mature planting',
    },
  ] as const;

  return (
    <section className="sustainability-band" aria-labelledby="sustainability-title">
      <div className="shell sustainability-band__frame">
        <div className="sustainability-band__hero">
          <Image
            src="/images/sustainable.jpg"
            alt="Earthen masonry and a perforated screen shown in direct sunlight"
            fill
            sizes="(max-width: 1536px) 92vw, 1472px"
            className="sustainability-band__hero-image"
          />
          <div className="sustainability-band__hero-scrim" aria-hidden="true" />
          <div className="sustainability-band__copy">
            <p className="eyebrow eyebrow--light">Sustainable by design</p>
            <h2 id="sustainability-title">Comfort designed in, before energy is spent.</h2>
            <p>
              Natural cooling, lower-carbon material choices, and healthier spaces are considered
              before mechanical energy is added.
            </p>
            <Link href="/sustainable-construction" className="text-link text-link--light">
              Explore sustainable construction <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className="sustainability-band__caption">Shade depth study / South-west edge</p>
        </div>

        <div className="sustainability-band__elements">
          <div className="sustainability-band__cards">
            {elements.map((element) => (
              <Link
                key={element.index}
                href="/sustainable-construction"
                className="sustainability-card"
                aria-label={`${element.title}: explore sustainable construction`}
              >
                <Image
                  src={element.image}
                  alt={element.imageAlt}
                  fill
                  sizes="(max-width: 767px) 92vw, 31vw"
                />
                <span className="sustainability-card__scrim" aria-hidden="true" />
                <span className="sustainability-card__index">{element.index}</span>
                <span className="sustainability-card__copy">
                  <strong>{element.title}</strong>
                  <span>{element.description}</span>
                </span>
                <span className="sustainability-card__arrow" aria-hidden="true">
                  <ArrowUpRight size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EstimateSection({ showPricingLink = true }: { showPricingLink?: boolean } = {}) {
  return (
    <section className="estimate-band section section--mineral">
      <div className="shell estimate-band__grid">
        <div className="estimate-band__intro">
          <p className="eyebrow">Construction cost calculator</p>
          <h2>Understand your estimated project budget before you begin.</h2>
        </div>
        <div className="estimate-band__panel">
          <div className="estimate-band__figure" aria-label="Indicative construction range">
            <div className="estimate-band__number">
              <span>₹</span>
              <strong>X,XXX</strong>
            </div>
            <p>Estimated cost per sq.ft.</p>
            <Link href="/cost-calculator" className="button button--primary">
              Calculate your cost <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="estimate-band__copy">
            <p>
              Estimated cost only. Final project cost depends on design, specifications, site
              conditions, materials and project requirements.
            </p>
            {showPricingLink ? (
              <Link href="/cost-calculator" className="text-link">
                Understand pricing <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NotesAndQuestions() {
  return (
    <section className="notes-questions section section--paper">
      <div className="shell notes-questions__grid">
        <aside className="client-note">
          <p className="eyebrow">Verified client testimonial</p>
          <blockquote>Verified client testimonial to be added.</blockquote>
          <p>Client details to be confirmed</p>
        </aside>
        <div className="faq-list">
          <p className="eyebrow">FAQ</p>
          <h2>Questions before you begin.</h2>
          <div>
            {faqs.map((faq, index) => (
              <details key={faq.question} name="home-faq">
                <summary>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {faq.question}
                  <ArrowDown className="faq-list__arrow" size={18} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
