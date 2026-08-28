import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { PageHero } from '@/components/PageHero';
import { SectionHeading, SiteLayout } from '@/components/SiteShell';
import { projects, services } from '@/data/site';
import { getServicesJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Architecture, interior, construction, structural engineering and green building by ASTHIWAR in Coimbatore, Tamil Nadu.',
  openGraph: {
    title: 'Services — ASTHIWAR',
    description:
      'Architecture, interior, construction, structural engineering and green building by ASTHIWAR.',
    url: '/services',
    images: [{ url: '/images/hero.jpg', width: 1600, height: 1000, alt: 'ASTHIWAR Services' }],
  },
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return (
    <SiteLayout footerCta="land">
      <JsonLd data={getServicesJsonLd(services)} />
      <PageHero
        tone="forest"
        eyebrow="Our services"
        title="Five disciplines. One continuous process."
        intro="ASTHIWAR brings architecture, engineering and execution together through one coordinated process."
        meta={
          <>
            <span>05 disciplines</span>
            <span>One continuous process</span>
          </>
        }
      />

      <section className="services-page section section--paper">
        <div className="shell">
          <SectionHeading
            eyebrow="Design & build company"
            title="Architecture, engineering and execution brought together."
            body="Thoughtful architecture, precise engineering and sustainable design-build solutions."
          />

          <div className="services-page__stack">
            {services.map((service, serviceIndex) => {
              const related = projects[serviceIndex % projects.length];
              return (
                <article key={service.slug} id={service.slug} className="service-detail">
                  <div className="service-detail__heading">
                    <span>{service.index}</span>
                    <h2>{service.title}</h2>
                    <p>{service.description}</p>
                  </div>
                  <div className="service-detail__capabilities">
                    <p className="eyebrow">What is included</p>
                    <ul>
                      {service.capabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="service-detail__process">
                    <p className="eyebrow">How the work moves</p>
                    <ol>
                      {service.process.map((item, index) => (
                        <li key={item}>
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                  {related ? (
                    <Link
                      href={`/projects/${related.slug}`}
                      className="service-detail__project"
                    >
                      <Image
                        src={related.image}
                        alt=""
                        width={640}
                        height={420}
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                      <span>
                        Related work
                        <strong>{related.title}</strong>
                      </span>
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="scope-note section section--forest">
        <div className="shell scope-note__grid">
          <div className="scope-note__copy">
            <p className="eyebrow eyebrow--light">Let&apos;s talk</p>
            <h2>Start with a conversation.</h2>
            <p>Tell us about your project, your site and what you want to build.</p>
            <Link href="/contact" className="button button--light">
              Book consultation <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <figure className="scope-note__visual">
            <Image
              src="/images/hero.jpg"
              alt="Contemporary residence shaped by deep shade, warm material and precise structural lines"
              width={1600}
              height={1000}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </figure>
        </div>
      </section>
    </SiteLayout>
  );
}
