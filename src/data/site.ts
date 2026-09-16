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
      src: '/images/disciplines/realestate.jpg',
      alt: 'Real-time Tamil Nadu DTCP approved residential plot layout with avenue trees and paved road networks.',
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
      src: '/images/disciplines/architecture.jpeg',
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
      src: '/images/disciplines/Structural.jpeg',
      alt: 'Precision reinforced concrete structural frame, high-yield steel rebar tying, and seismic column detailing.',
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
      src: '/images/disciplines/Construction.jpeg',
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
      src: '/images/disciplines/interior.jpeg',
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
      src: '/images/disciplines/green-building.jpg',
      alt: 'Sustainable bioclimatic green architecture, stabilized earth mud walls, natural courtyard cross-ventilation, and shaded verandas.',
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

export type ProjectDatum = {
  structure: string;
  envelope: string;
  thermalDelta: string;
  coordinates: string;
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
  /** Looping video shown in the project header in place of `image`, which stays as its poster. */
  video?: string;
  /** Cycled on hover in the archive grid. */
  gallery: ReadonlyArray<{ src: string; alt: string }>;
  summary: string;
  overview: string;
  challenge: string;
  approach: string;
  materials: readonly string[];
  timeline: readonly ProjectTimelineEntry[];
  datum?: ProjectDatum;
};

export const projects: readonly Project[] = [
  {
    slug: 'aether',
    title: 'Aether ',
    location: 'Cheran ma nagar, Coimbatore, Tamil Nadu',
    type: '3BHK Semi-Furnished Duplex',
    category: 'Residential',
    area: '2,450 sq.ft (3.3 Cents Plot)',
    year: '2025',
    status: 'Completed',
    image: { src: '/Ather/ather-06.jpeg', alt: 'Aether  contemporary duplex facade in Cheran ma nagar, Coimbatore' },
    video: '/Ather/AetherLandscape.mp4',
    gallery: [
      { src: '/Ather/1.jpg', alt: 'Exterior facade with glass balcony railing' },
      { src: '/Ather/2.jpg', alt: 'Exterior envelope nearing completion under scaffolding' },
      { src: '/Ather/3.jpeg', alt: 'Concrete frame and masonry shell mid-construction' },
      { src: '/Ather/4.jpeg', alt: 'Rooftop terrace under construction at sunset' },
      { src: '/Ather/5.jpeg', alt: 'Interior textured plaster finish being applied' },
      { src: '/Ather/6.jpeg', alt: 'Interior joinery and cabinetry installation' },
      { src: '/Ather/7.jpeg', alt: 'Site progress during superstructure phase' },
    ],
    summary:
      'A bespoke 2,450 sq.ft 3BHK semi-furnished duplex situated on a prominent 60-ft and 30-ft corner road in Cheran ma nagar. Built with uncompromised material quality, skilled labour, perfect Vaasthu and Manai Adi Sastra adherence, and two-car luxury parking.',
    overview:
      'Engineered on 3.3 cents of corner land, Aether harmonizes spatial abundance with rigorous structural planning. The thoughtfully designed layout features an expansive 16’ × 16’ living hall, two grand 16’ × 16’ master bedrooms, an additional 10’ × 16’ bedroom, a dedicated pooja room, an external utility zone, and covered parking for two full-size luxury vehicles.',
    challenge:
      'The corner junction of 60-foot and 30-foot roads required dual-frontage acoustic and visual privacy while ensuring abundant natural cross-ventilation. Furthermore, aligning room dimensions strictly with traditional Manai Adi Sastra benchmarks required zero-tolerance structural grid calibration.',
    approach:
      'ASTHIWAR integrated architecture and structural engineering under one hand. We staggered window fenestrations with deep balcony projections, deployed an optimized moment-resisting RC frame to keep living areas column-free, and ensured every space complies with solar and airflow paths for natural cooling.',
    materials: [
      'Primary Fe550D TMT Reinforcement Steel',
      'Solid High-Density Masonry Blocks',
      'Smooth Slaked Lime Plaster Wash',
      'First-Quality Teak Joinery & Doors',
      'Large-Format Vitrified Tile Flooring',
      'Toughened Glass Balcony Balustrades',
      'Weatherproof Exterior Emulsion Coatings',
    ],
    timeline: [
      { phase: 'Design & Vaasthu Alignment', duration: '2 Months', note: 'Site survey, Manai Adi Sastra grid calibration, concept and structural analysis' },
      { phase: 'Superstructure & Masonry', duration: '5 Months', note: 'Isolated column footings, RCC moment frame, precision block masonry' },
      { phase: 'Envelope & Finishes', duration: '4 Months', note: 'Concealed MEP installations, teak joinery, lime plaster, vitrified flooring' },
      { phase: 'Commissioning & Handover', duration: '1 Month', note: '750+ quality checklist sign-offs, service testing, turnkey handover in 2025' },
    ],
    datum: {
      structure: 'RCC Moment Frame & Machine-Cut Masonry',
      envelope: 'Recessed Balconies & Weather-Shield Plaster',
      thermalDelta: '-4.6°C Solar Differential',
      coordinates: '11°03\'12"N 76°59\'45"E • Cheran ma nagar',
    },
  },
  {
    slug: 'trivara',
    title: 'Trivara',
    location: 'Vilankurichi, Coimbatore, Tamil Nadu',
    type: '3BHK North-Facing Townhouses',
    category: 'Residential',
    area: '2,200 sq.ft (2.75 Cents Plot)',
    year: '2026',
    status: 'In Progress',
    image: { src: '/Trevea/trivara-2.jpeg', alt: 'Trivara Townhouses contemporary brick-accent facade in Vilankurichi, Coimbatore' },
    gallery: [
      { src: '/Trevea/trivara-2.jpeg', alt: 'Rendered elevation of brick accent townhouse facade' },
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
    summary:
      'A contemporary 2,200 sq.ft 3BHK townhouse development in Vilankurichi. Built on a 2.75-cent north-facing plot, combining efficient vertical volume planning with warm exposed brick accents and low-thermal-gain design.',
    overview:
      'Trivara re-envisions compact urban living in Coimbatore’s Vilankurichi growth hub. The north-facing residence maximizes vertical efficiency across multiple levels, featuring interconnected living-dining spaces, three generous private bedrooms, terrace garden access, and dedicated vehicle parking.',
    challenge:
      'A compact 2.75-cent plot footprint required balancing municipal setback requirements with generous interior volume, daylight distribution, and natural cross-ventilation without thermal buildup.',
    approach:
      'We adopted a north-facing orientation that captures soft ambient daylight without aggressive afternoon solar heat. Vertically staggered volumes are framed by ductile reinforced concrete beams and enriched with textured wire-cut brick accents to create a contemporary urban facade.',
    materials: [
      'Fe550D High-Yield Rebar Structural Frame',
      'Wire-Cut Exposed Terracotta Brick Accents',
      '53-Grade Certified Brand Cement',
      'Double-Glazed Sound-Dampening UPVC Windows',
      'Anti-Skid Vitrified Ceramic Tiling',
      'Integrated Rooftop Waterproofing & Drainage',
    ],
    timeline: [
      { phase: 'Planning & Soil Investigation', duration: '2 Months', note: 'Zoning approvals, soil test verification, structural blueprint generation' },
      { phase: 'Foundation & RCC Frame', duration: '5 Months', note: 'Poured RCC foundation, plinth beams, column framework, slab pours' },
      { phase: 'Masonry & Envelope Execution', duration: 'Ongoing', note: 'Exposed brick masonry, electrical conduits, plumbing rough-ins' },
      { phase: 'Interior Finishes & Handover', duration: '2026', note: 'Joinery, sanitary fittings, final facade detailing and client handover' },
    ],
    datum: {
      structure: 'Ductile RCC Frame & Exposed Brick Accent',
      envelope: 'North-Oriented Shaded Fenestration & UPVC',
      thermalDelta: '-5.2°C Passive Ventilation Shift',
      coordinates: '11°04\'18"N 77°00\'32"E • Vilankurichi',
    },
  },
];

/** True when a field is still a placeholder — render it muted, never hidden. */
export function isUnconfirmed(value: string): boolean {
  return value === TBC;
}

export function getProject(slug: string): Project | undefined {
  const normalized = slug === 'ather' ? 'aether' : slug === 'trevea' ? 'trivara' : slug;
  return projects.find((p) => p.slug === normalized);
}

/** Categories that are actually set. Empty while every project is unconfirmed. */
export function projectCategories(): string[] {
  return [...new Set(projects.map((p) => p.category))].filter((c) => !isUnconfirmed(c));
}
