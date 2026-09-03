'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

import { SectionHeading } from '@/components/SiteShell';
import { faqs, services } from '@/data/site';

const sustainabilityPrinciples = [
  {
    label: 'Natural Cooling',
    lines: ['Natural Cooling'],
    icon: '/icons/natural-cooling.svg',
    width: 78,
    height: 78,
  },
  {
    label: 'Low Cement / Cement Free',
    lines: ['Low Cement /', 'Cement Free'],
    icon: '/icons/low-cement.svg',
    width: 89,
    height: 78,
  },
  {
    label: 'Long-term Well-being',
    lines: ['Long-term', 'Well-being'],
    icon: '/icons/long-term-wellbeing.svg',
    width: 88,
    height: 81,
  },
  {
    label: 'Environmental Responsibility',
    lines: ['Environmental', 'Responsibility'],
    icon: '/icons/environmental-responsibility.svg',
    width: 78,
    height: 78,
  },
] as const;

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

export function SustainabilitySection() {
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
            <h2 id="sustainability-title">
              Comfort
              <br />designed in, before
              <br />energy is spent.
            </h2>
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

        <div
          className="sustainability-principles group/track"
          role="group"
          aria-label="Sustainable design principles. The icons move from left to right; hover or focus to pause."
          tabIndex={0}
        >
          <div className="sustainability-principles__track group-hover/track:[animation-play-state:paused] focus-visible:[animation-play-state:paused]">
            {[0, 1].map((copyIndex) => (
              <ul
                key={copyIndex}
                className="sustainability-principles__group"
                aria-hidden={copyIndex === 1 ? true : undefined}
              >
                {sustainabilityPrinciples.map((principle) => (
                  <motion.li 
                    key={`${copyIndex}-${principle.label}`}
                    className="relative flex flex-col items-center justify-center p-4 cursor-default text-center min-h-[8.5rem] border-l border-[#19241d]/30 transition-all duration-300 hover:z-10 group-hover/track:opacity-50 group-hover/track:grayscale-[70%] hover:!opacity-100 hover:!grayscale-0"
                    whileHover={{ 
                      scale: 1.05, 
                      y: -8,
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
                      borderColor: "transparent"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0)",
                      boxShadow: "none",
                      borderRadius: "4px"
                    }}
                  >
                    <motion.span 
                      className="grid place-items-center w-15 h-15 mb-2"
                      whileHover={{ scale: 1.15, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Image
                        src={principle.icon}
                        alt=""
                        width={principle.width}
                        height={principle.height}
                        aria-hidden="true"
                        className="object-contain drop-shadow-sm transition-all duration-300 hover:drop-shadow-md"
                      />
                    </motion.span>
                    <motion.span 
                      className="grid text-current font-medium leading-tight text-[0.82rem] transition-all duration-300"
                    >
                      {principle.lines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Preview of the inputs the full calculator asks for; each row opens /cost-calculator. */
const estimateFields = [
  { label: 'Location', action: 'Select' },
  { label: 'Built-up area', action: 'Enter area' },
  { label: 'Construction quality', action: 'Select' },
] as const;

export function EstimateSection() {
  return (
    <section className="estimate-band section section--clay">
      <div className="shell estimate-band__grid">
        <div className="estimate-band__intro">
          <p className="eyebrow">Cost calculator</p>
          <h2>Understand your budget before you design.</h2>
        </div>
        <div className="estimate-band__panel">
          <ul className="estimate-band__fields">
            {estimateFields.map((field) => (
              <li key={field.label}>
                <Link href="/cost-calculator" className="estimate-field">
                  <span className="estimate-field__label">{field.label}</span>
                  <span className="estimate-field__action">
                    {field.action}
                    <ArrowDownRight size={13} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="estimate-band__figure" aria-label="Indicative construction range">
            <div className="estimate-band__number">
              <span>₹</span>
              <strong>&mdash;</strong>
            </div>
            <p className="estimate-band__label">Estimated project cost</p>
            <p className="estimate-band__note">
              Estimated cost only. Final project cost depends on design, specifications, site
              conditions, materials and project requirements.
            </p>
            <Link href="/cost-calculator" className="button button--primary">
              Calculate your cost <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
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
