/**
 * Shared site content. Carried over verbatim from the previous ASTHIWAR build
 * (asthiwar-v1-main/web/src/data/site.ts) — the `process` arrays in particular
 * are the most convincing copy on the site and should not be paraphrased.
 *
 * Consumed by: homepage section 08 (DisciplinesSticky), section 10
 * (ScopeColumns), and /services.
 */

export type Service = {
  slug: string;
  index: string;
  title: string;
  /** One-liner used in the sticky list and as the services lead line. */
  short: string;
  capabilities: readonly string[];
  process: readonly string[];
  image: { src: string; alt: string };
};

export const services: readonly Service[] = [
  {
    slug: 'real-estate',
    index: '01',
    title: 'Real Estate',
    short: 'Strategic property advisory, land acquisition and development.',
    capabilities: [
      'Land acquisition & feasibility',
      'Title & regulatory due diligence',
      'Development advisory & valuation',
      'Asset positioning & master planning',
    ],
    process: [
      'Assess site potential',
      'Verify legal & zoning titles',
      'Structure project feasibility',
      'Facilitate seamless handover',
    ],
    image: {
      src: '/images/hero.jpg',
      alt: 'ASTHIWAR real estate acquisition and prime residential property development.',
    },
  },
  {
    slug: 'architecture',
    index: '02',
    title: 'Architecture',
    short: 'Designing spaces with clarity, context and purpose.',
    capabilities: [
      'Site and climate analysis',
      'Concept and spatial planning',
      'Approvals and documentation',
      'Tender and site coordination',
    ],
    process: [
      'Read the site',
      'Test the section',
      'Coordinate every system',
      'Issue buildable information',
    ],
    image: {
      src: '/images/asthivar-villa.jpg',
      alt: 'Bespoke modern tropical stone residence featuring cantilevered concrete volumes and warm illumination.',
    },
  },
  {
    slug: 'structural',
    index: '03',
    title: 'Structural',
    short: 'Engineering-led solutions built for lasting strength.',
    capabilities: [
      'Structural concept design',
      'Analysis and detailing',
      'Existing-building assessment',
      'Site review and consulting',
    ],
    process: [
      'Map the loads',
      'Simplify the grid',
      'Detail buildable junctions',
      'Verify on site',
    ],
    image: {
      src: '/images/asthivar-villa.jpg',
      alt: 'Completed stone villa at dusk, its upper floor carried on a deep cantilever over the terrace.',
    },
  },
  {
    slug: 'construction',
    index: '04',
    title: 'Construction',
    short: 'Precise execution with quality and transparency.',
    capabilities: [
      'Pre-construction planning',
      'Site execution',
      'Quality and progress records',
      'Commissioning and handover',
    ],
    process: [
      'Price the information',
      'Plan the sequence',
      'Record what is built',
      'Close every detail',
    ],
    image: {
      src: '/images/materials.jpg',
      alt: 'Architectural drafting tables, masonry specimens, and precision execution instruments.',
    },
  },
  {
    slug: 'interiors',
    index: '05',
    title: 'Interior',
    short: 'Crafting interiors that elevate everyday experiences.',
    capabilities: [
      'Space planning',
      'Material and lighting strategy',
      'Custom joinery',
      'Furniture and styling',
    ],
    process: [
      'Audit the shell',
      'Set a material family',
      'Prototype critical details',
      'Coordinate fabrication',
    ],
    image: {
      src: '/images/courtyard.jpg',
      alt: 'Planted central courtyard opening to the sky with warm teakwood and stone finishes.',
    },
  },
  {
    slug: 'green-building',
    index: '06',
    title: 'Green Buildings',
    short: 'Sustainable methods for healthier spaces.',
    capabilities: [
      'Passive design studies',
      'Envelope and daylight review',
      'Water strategy',
      'Material impact review',
    ],
    process: [
      'Set performance priorities',
      'Model passive moves',
      'Reduce material impact',
      'Review after occupation',
    ],
    image: {
      src: '/images/jaali.jpg',
      alt: 'Perforated terracotta jaali screen casting geometric shade and drawing passive ventilation.',
    },
  },
];

export const faqs = [
  {
    q: 'Why ASTHIWAR?',
    a: 'Asthiwar delivers integrated real estate, design, and construction solutions backed by 750+ quality checks. We build sustainable, future-ready spaces with transparent estimation, customization, and uncompromised excellence.',
  },
  {
    q: 'Can I hire Asthiwar for just one service, like interior design?',
    a: 'Yes. Each discipline works independently, so you can engage a single service or the full process from land to move-in.',
  },
  {
    q: 'Can we visit your built projects?',
    a: "You may be able to visit a project that is currently in progress. For finished projects, we prefer to walk you through the exterior and for interior using photos and videos, as we value and protect our clients' privacy.",
  },
  {
    q: 'How do I get started?',
    a: 'Get an instant online estimate, then request a consultation — the team reviews your goals and site before recommending the right services.',
  },
  {
    q: 'Do you handle both residential and commercial projects?',
    a: 'We manage residential, commercial, institutional and industrial projects, from small-scale builds to large developments',
  },
  {
    q: 'How accurate are your estimations?',
    a: 'Our estimations are transparent, detailed, and aligned with market standards. They are not just estimations but online quotations to start your dream project.',
  },
  {
    q: 'Can you customize designs for clients?',
    a: 'Every project is tailored to client needs, lifestyle, and budget.',
  },
  {
    q: 'Do you help with property investment decisions?',
    a: 'Yes, we provide market insights and feasibility studies to guide smart investment choices.',
  },
  {
    q: 'How does Asthiwar ensure material transparency?',
    a: 'We provide clients with complete visibility into materials used, including brand specifications, certifications, and sourcing details. This ensures trust and accountability at every stage.',
  },
  {
    q: 'How are site updates shared with clients?',
    a: 'We provide real-time digital updates through online dashboards, milestone reports, and notifications, keeping clients informed about progress at every stage.',
  },
] as const;

/* ---- Projects ---- */

const TBC = 'To be confirmed';

export type ProjectTimelineEntry = {
  phase: string;
  duration: string;
  note: string;
};

export type Project = {
  slug: string;
  title: string;
  location: string;
  type: string;
  category: string;
  area: string;
  year: string;
  status: string;
  image: { src: string; alt: string };
  /** Cycled on hover in the archive grid. */
  gallery: ReadonlyArray<{ src: string; alt: string }>;
  summary: string;
  overview: string;
  challenge: string;
  approach: string;
  materials: readonly string[];
  timeline: readonly ProjectTimelineEntry[];
};

export const projects: readonly Project[] = [
  {
    slug: 'ather',
    title: 'Ather Residence',
    location: 'Coimbatore, Tamil Nadu',
    type: 'Residential Villa',
    category: 'Residential',
    area: TBC,
    year: '2026',
    status: 'Completed',
    image: { src: '/Ather/ather-06.jpeg', alt: 'Ather Residence exterior facade with clean grey and cream plaster finish and glass balcony railing' },
    gallery: [
      { src: '/Ather/ather-06.jpeg', alt: 'Exterior facade with glass balcony railing' },
      { src: '/Ather/ather-07.jpeg', alt: 'Exterior envelope nearing completion under scaffolding' },
      { src: '/Ather/ather-03.jpeg', alt: 'Concrete frame and masonry shell mid-construction' },
      { src: '/Ather/ather-01.jpeg', alt: 'Rooftop terrace under construction at sunset' },
      { src: '/Ather/ather-02.jpeg', alt: 'Interior textured plaster finish being applied' },
      { src: '/Ather/ather-05.jpeg', alt: 'Interior joinery and cabinetry installation' },
      { src: '/Ather/ather-04.jpeg', alt: 'Site progress during superstructure phase' },
    ],
    summary: TBC,
    overview: TBC,
    challenge: TBC,
    approach: TBC,
    materials: [TBC],
    timeline: [
      { phase: 'Design & Planning', duration: TBC, note: TBC },
      { phase: 'Superstructure', duration: TBC, note: TBC },
      { phase: 'Envelope & Finishes', duration: TBC, note: TBC },
      { phase: 'Handover', duration: TBC, note: TBC },
    ],
  },
  {
    slug: 'trevea',
    title: 'Trevea Townhouses',
    location: 'Coimbatore, Tamil Nadu',
    type: 'Residential Townhouse Development',
    category: 'Residential',
    area: TBC,
    year: '2026',
    status: 'In Progress',
    image: { src: '/Trevea/trevea-03.jpeg', alt: 'Trevea Townhouses — contemporary brick accent facades with white rendered volumes' },
    gallery: [
      { src: '/Trevea/trevea-03.jpeg', alt: 'Rendered elevation of brick accent townhouse facade' },
      { src: '/Trevea/trevea-09.jpeg', alt: 'Isometric floor plan showing first-floor layout' },
      { src: '/Trevea/trevea-01.jpeg', alt: 'Exterior superstructure under scaffolding' },
      { src: '/Trevea/trevea-04.jpeg', alt: 'Reinforced concrete slab and beam construction with rebar' },
      { src: '/Trevea/trevea-02.jpeg', alt: 'Site progress — masonry and concrete frame' },
      { src: '/Trevea/trevea-05.jpeg', alt: 'Construction detail on site' },
      { src: '/Trevea/trevea-06.jpeg', alt: 'Structural work in progress' },
      { src: '/Trevea/trevea-07.jpeg', alt: 'Site overview during mid-construction phase' },
      { src: '/Trevea/trevea-08.jpeg', alt: 'Construction progress — walls and openings' },
      { src: '/Trevea/trevea-10.jpeg', alt: 'Site detail during construction' },
      { src: '/Trevea/trevea-11.jpeg', alt: 'Site overview' },
    ],
    summary: TBC,
    overview: TBC,
    challenge: TBC,
    approach: TBC,
    materials: [TBC],
    timeline: [
      { phase: 'Design & Planning', duration: TBC, note: TBC },
      { phase: 'Superstructure', duration: TBC, note: TBC },
      { phase: 'Envelope & Finishes', duration: TBC, note: TBC },
      { phase: 'Handover', duration: TBC, note: TBC },
    ],
  },
];

/** True when a field is still a placeholder — render it muted, never hidden. */
export function isUnconfirmed(value: string): boolean {
  return value === TBC;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Categories that are actually set. Empty while every project is unconfirmed. */
export function projectCategories(): string[] {
  return [...new Set(projects.map((p) => p.category))].filter((c) => !isUnconfirmed(c));
}
