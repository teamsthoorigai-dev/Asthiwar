import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/PageHero';
import { SectionHeading, SiteLayout } from '@/components/SiteShell';

export const metadata: Metadata = {
  title: 'Studio',
  description:
    'Inside ASTHIWAR, where architecture, structural thinking, interiors and construction stay in one coordinated practice in Coimbatore, Tamil Nadu.',
  openGraph: {
    title: 'Studio — ASTHIWAR',
    description:
      'Inside ASTHIWAR, where architecture, structural thinking, interiors and construction stay in one coordinated practice.',
    url: '/about',
    images: [{ url: '/images/hero.jpg', width: 1600, height: 1000, alt: 'ASTHIWAR Studio' }],
  },
  alternates: {
    canonical: '/about',
  },
};

const process = [
  [
    '01',
    'Listen',
    'Map the brief, routines, priorities, budget, and the decisions that are still open.',
  ],
  [
    '02',
    'Read',
    'Study access, climate, neighbours, soil, regulation, water, and what the site already does well.',
  ],
  [
    '03',
    'Test',
    'Compare plans and sections against daylight, ventilation, structure, movement, and cost.',
  ],
  [
    '04',
    'Coordinate',
    'Bring architecture, structure, services, interiors, and specifications into one information set.',
  ],
  [
    '05',
    'Plan',
    'Sequence procurement, labour, approvals, mock-ups, and quality checks before site pressure rises.',
  ],
  [
    '06',
    'Build',
    'Record progress, inspect concealed work, resolve junctions, and keep the design team close to execution.',
  ],
  [
    '07',
    'Tune',
    'Commission the building, close defects, explain maintenance, and review performance after occupation.',
  ],
] as const;

export default function AboutPage() {
  return (
    <SiteLayout footerCta="land">
      <PageHero
        className="studio-hero"
        eyebrow="The studio"
        title="A building practice, not a relay race."
        intro="ASTHIWAR brings architecture, structural thinking, interiors, and construction into one accountable conversation—from the first site walk to seasonal performance after handover."
        image="/images/hero.jpg"
        imageAlt="A shaded stone-and-concrete residence arranged around a reflective courtyard pool"
        imageCaption={['ASTHIWAR / FIELD RECORD', 'INTEGRATED DESIGN + BUILD']}
        meta={
          <>
            <span>Architecture + engineering</span>
            <span>Coordinated execution</span>
          </>
        }
      />

      <section className="about-position section section--paper">
        <div className="shell about-position__grid">
          <p className="eyebrow">Our position</p>
          <h2>Design intent is only useful when the site can carry it.</h2>
          <figure className="about-position__visual">
            <Image
              src="/images/workshop.jpg"
              alt="Sunlit interior with a timber table, shaded windows, and warm natural finishes"
              width={1200}
              height={1200}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <figcaption>
              <span>Studio image / placeholder</span>
              <span>Replace with approved project photography</span>
            </figcaption>
          </figure>
          <div className="about-position__copy">
            <p>
              Too many buildings are drawn by one team, engineered by another, priced by a third,
              and interpreted on site by a fourth. Each handoff loses context. We built ASTHIWAR to
              keep the reasons behind a decision visible to the people responsible for delivering
              it.
            </p>
            <p>
              Integration does not mean one idea goes unchallenged. It means architecture,
              structure, cost, climate, and craft can challenge each other early—while change is
              still useful and affordable.
            </p>
          </div>
        </div>
      </section>

      <section className="about-duality section section--carbon">
        <div className="shell">
          <SectionHeading
            light
            eyebrow="Two ways of seeing / one building"
            title="Architecture asks what life needs. Engineering asks what the idea demands."
            body="The best answer is neither compromise nor excess. It is a building whose space and load path feel inevitable together."
          />
          <div className="about-duality__diagram">
            <div>
              <span>01 / Architecture</span>
              <h3>Light, sequence, privacy, proportion, material, and daily use.</h3>
              <p>The room as it is experienced.</p>
            </div>
            <div className="about-duality__joint" aria-hidden="true">
              <span>ASTHIWAR</span>
            </div>
            <div>
              <span>02 / Engineering</span>
              <h3>Load, span, soil, water, movement, durability, and assembly.</h3>
              <p>The room as it is made possible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-principles section section--mineral">
        <div className="shell">
          <SectionHeading
            eyebrow="What remains constant"
            title="Principles strong enough to survive different sites."
            body="The architecture changes. These obligations do not."
          />
          <div className="studio-principles__list">
            {[
              [
                '01',
                'Climate before form',
                'Use orientation, shade, mass, air, and water as primary design material.',
              ],
              [
                '02',
                'Buildability before image',
                'A detail must explain its sequence, tolerance, access, and maintenance.',
              ],
              [
                '03',
                'Material before finish',
                'Choose assemblies for ageing, repair, sourcing, touch, and environmental cost.',
              ],
              [
                '04',
                'Evidence before adjectives',
                'Use drawings, prototypes, records, and performance—not vague claims—to build trust.',
              ],
            ].map(([index, title, copy]) => (
              <article key={index}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process-section studio-process section section--paper">
        <div className="shell">
          <SectionHeading
            eyebrow="From first walk to first monsoon"
            title="Seven stages, with the right question asked at each one."
            body="The process is deliberately front-loaded: coordination is cheaper on paper than under a poured slab."
          />
          <ol className="process-list">
            {process.map(([index, title, copy]) => (
              <li key={index}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteLayout>
  );
}
