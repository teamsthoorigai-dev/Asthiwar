import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { SectionHeading, SiteLayout } from '@/components/SiteShell';

export const metadata: Metadata = {
  title: 'Sustainable Construction',
  description:
    "Explore ASTHIWAR's approach to natural cooling, low-cement and cement-free construction, and green building solutions in Tamil Nadu.",
  openGraph: {
    title: 'Sustainable Construction — ASTHIWAR',
    description:
      "Explore ASTHIWAR's approach to natural cooling, low-cement and cement-free construction, and green building solutions.",
    url: '/sustainable-construction',
    images: [
      {
        url: '/images/sustainable.jpg',
        width: 1200,
        height: 900,
        alt: 'Sustainable Construction by ASTHIWAR',
      },
    ],
  },
  alternates: {
    canonical: '/sustainable-construction',
  },
};

const passiveMoves = [
  [
    '01',
    'Orientation',
    'Place openings, rooms, and mass in response to sun, wind, view, noise, and the way the site is occupied.',
  ],
  [
    '02',
    'Shade',
    'Stop direct heat before it reaches glass and wall; make overhangs, screens, trees, and thresholds do measurable work.',
  ],
  [
    '03',
    'Cross-ventilation',
    'Give air a clear inlet, a useful path through occupied space, and a high or low-pressure outlet.',
  ],
  [
    '04',
    'Thermal mass',
    'Use material capacity where day-night temperature swings and ventilation strategy can make it effective.',
  ],
  [
    '05',
    'Daylight',
    'Bring useful, controlled light deep enough to reduce demand without adding glare and unwanted heat.',
  ],
  [
    '06',
    'Water',
    'Slow, collect, recharge, reuse, and make drainage visible before the first monsoon tests the drawing.',
  ],
] as const;

const materialLedger = [
  [
    'Concrete',
    'Reduce volume, simplify spans, specify strength honestly, and review supplementary cementitious material.',
  ],
  [
    'Masonry',
    'Match unit, joint, finish, and structural role; source locally where performance and craft remain reliable.',
  ],
  [
    'Timber',
    'Prefer durable, repairable, traceable material and avoid using rare species as a luxury shorthand.',
  ],
  [
    'Finishes',
    'Choose breathable, low-toxicity, maintainable surfaces whose patina is understood before handover.',
  ],
] as const;

export default function SustainableConstructionPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Sustainable by design"
        title="Comfort designed in, before energy is spent."
        intro="ASTHIWAR is expanding its design-build offering around Natural Cooling, Low-Cement / Cement-Free Construction and Green Building Solutions."
        image="/images/sustainable.jpg"
        imageAlt="Earthen masonry and a perforated screen shown in direct sunlight"
        meta={
          <>
            <span>Natural Cooling</span>
            <span>Low-cement / cement-free</span>
            <span>Long-term well-being</span>
          </>
        }
      />

      <section className="sustainability-position section section--forest">
        <div className="shell sustainability-position__grid">
          <p className="eyebrow eyebrow--light">Three pillars</p>
          <h2>Natural cooling. Low-cement / cement-free construction. Long-term well-being.</h2>
          <div>
            <p>
              Designing for the natural flow of air to keep interiors cooler and reduce reliance on
              artificial ventilation.
            </p>
            <p>
              Exploring lower-carbon construction methods and material choices while maintaining
              structural integrity.
            </p>
            <p>
              Creating spaces that lower operational costs while improving indoor air quality and
              everyday well-being.
            </p>
          </div>
        </div>
      </section>

      <section className="passive-moves section section--paper">
        <div className="shell">
          <SectionHeading
            eyebrow="Natural cooling"
            title="Comfort begins in plan and section."
            body="Designing for the natural flow of air to keep interiors cooler and reduce reliance on artificial ventilation."
          />
          <ol>
            {passiveMoves.map(([index, title, copy]) => (
              <li key={index}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="material-ledger section section--mineral">
        <div className="shell">
          <SectionHeading
            eyebrow="Low-cement / cement-free construction"
            title="Ask less material to do more useful work."
            body="Exploring lower-carbon construction methods and material choices while maintaining structural integrity."
          />
          <div className="material-ledger__table">
            <div className="material-ledger__head" aria-hidden="true">
              <span>Material family</span>
              <span>Review question</span>
              <span>Evidence</span>
            </div>
            {materialLedger.map(([material, review], index) => (
              <article key={material}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{material}</h3>
                <p>{review}</p>
                <strong>
                  {
                    [
                      'Mix design + quantity',
                      'Source + assembly',
                      'Traceability + care',
                      'VOC + repair guide',
                    ][index]
                  }
                </strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="performance-loop section section--carbon">
        <div className="shell performance-loop__grid">
          <div>
            <p className="eyebrow eyebrow--light">Long-term well-being</p>
            <h2>Everyday well-being continues after handover.</h2>
            <p>
              Creating spaces that lower operational costs while improving indoor air quality and
              everyday well-being.
            </p>
            <Link href="/contact" className="button button--primary">
              Discuss a sustainable brief <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ol>
            <li>
              <span>01</span>
              <strong>Commission</strong>
              <p>Test systems and explain operation.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Observe</strong>
              <p>Review comfort through a warm and wet period.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Tune</strong>
              <p>Adjust controls, habits, and unresolved details.</p>
            </li>
            <li>
              <span>04</span>
              <strong>Record</strong>
              <p>Carry the learning into the next building.</p>
            </li>
          </ol>
        </div>
      </section>
    </SiteLayout>
  );
}
