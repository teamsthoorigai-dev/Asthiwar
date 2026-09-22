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

/** What a gallery picture shows: the completed building, the design work, or the build on site. */
export type ProjectStage = 'finished' | 'design' | 'construction';

/** `width` and `height` are the picture's own pixel size; the gallery lays its tiles out from them before the image has loaded. */
export type ProjectShot = { src: string; alt: string; stage: ProjectStage; width: number; height: number };

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
  /** Every picture of the project. The project page splits them into sections by `stage`. */
  gallery: ReadonlyArray<ProjectShot>;
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
    image: { src: '/Ather/finished/aether-finished-02.jpg', alt: 'Aether  contemporary duplex facade in Cheran ma nagar, Coimbatore' },
    video: '/Ather/AetherLandscape.mp4',
    gallery: [
     // { stage: 'finished', src: '/Ather/finished/aether-finished-01.jpg', width: 5393, height: 4045, alt: 'Front elevation of the two completed villas in soft overcast light' },
      { stage: 'finished', src: '/Ather/finished/aether-finished-02.jpg', width: 1350, height: 1080, alt: 'The completed villas at golden hour, seen from the street' },
      { stage: 'finished', src: '/Ather/finished/aether-finished-03.jpg', width: 5506, height: 2803, alt: 'Street-level view along the front of both completed villas' },
      { stage: 'finished', src: '/Ather/finished/aether-finished-04.jpg', width: 4608, height: 3072, alt: 'Living hall with a fluted timber TV wall, ceiling fan and chandelier' },
      { stage: 'finished', src: '/Ather/finished/aether-finished-05.jpg', width: 4608, height: 3072, alt: 'Kitchen with timber cabinetry, black granite counters and lit open shelving' },
      { stage: 'finished', src: '/Ather/finished/21.jpg', width: 4608, height: 3072, alt: 'Kitchen looking towards the window, lit shelving on the left' },
      { stage: 'finished', src: '/Ather/finished/22.jpg', width: 4608, height: 3072, alt: 'Kitchen looking towards the window, lit shelving on the left' },
      { stage: 'finished', src: '/Ather/finished/23.jpg', width: 4608, height: 3072, alt: 'Kitchen looking towards the window, lit shelving on the left' },
      { stage: 'finished', src: '/Ather/finished/aether-finished-07.jpg', width: 4608, height: 3072, alt: 'Vanity with a vessel basin and mirror beside a lit timber niche' },
      { stage: 'design', src: '/Ather/design/aether-design-01.jpg', width: 4961, height: 3508, alt: 'Rendered corner view of the two villas with jaali screens, landscaping and parked cars' },
      { stage: 'design', src: '/Ather/design/aether-design-02.jpg', width: 3840, height: 2160, alt: 'Rendered front elevation of the two villas' },
      { stage: 'design', src: '/Ather/design/aether-design-07.jpg', width: 3222, height: 4027, alt: 'Villa-01 ground floor plan' },
      { stage: 'design', src: '/Ather/design/aether-design-08.jpg', width: 3266, height: 4083, alt: 'Villa-01 first floor plan' },
      { stage: 'design', src: '/Ather/design/aether-design-09.jpg', width: 3183, height: 4178, alt: 'Villa-02 ground floor plan' },
      { stage: 'design', src: '/Ather/design/aether-design-10.jpg', width: 3236, height: 4045, alt: 'Villa-02 first floor plan' },
      //{ stage: 'construction', src: '/Ather/construction/aether-construction-1.jpg', width: 1600, height: 720, alt: 'Column footing and reinforcement cage laid out across the foundation trench' },
      //{ stage: 'construction', src: '/Ather/construction/aether-construction-2.jpg', width: 1600, height: 720, alt: 'Reinforcement cages rising from the foundation with brickwork starting on the boundary' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-3.jpg', width: 1280, height: 720, alt: 'Workers marking column positions on the compacted foundation bed' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-4.jpg', width: 1280, height: 720, alt: 'Brick walls rising between reinforced concrete columns at plinth level' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-5.jpg', width: 1280, height: 900, alt: 'Worker on the first-floor roof slab with shuttering plates and reinforcement bars' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-7.jpg', width: 1600, height: 1200, alt: 'Plastered duplex facade with window openings ahead of exterior finishing' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-8.jpg', width: 1600, height: 900, alt: 'Brick facade under bamboo scaffolding during upper-floor construction' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-9.jpg', width: 1600, height: 900, alt: 'Painted exterior facade under scaffolding in the evening light' },
      { stage: 'construction', src: '/Ather/construction/aether-construction-10.jpg', width: 1280, height: 720, alt: 'Workers laying stone-pattern paver flooring at the entrance driveway' },
    ],
    summary:
      'A bespoke 2,450 sq.ft 3BHK semi-furnished duplexes situated on a prominent 60-ft and 30-ft corner road in Cheran ma nagar. Built with uncompromised material quality, skilled labour, perfect Vaasthu and Manai Adi Sastra adherence, and two-car luxury parking.',
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
    image: { src: '/Trevea/design/trivara-design-01.jpg', alt: 'Trivara Townhouses contemporary brick-accent facade in Vilankurichi, Coimbatore' },
    // Nothing is finished yet, so the project page shows the design and construction sections only.
    gallery: [
      { stage: 'design', src: '/Trevea/design/trivara-design-01.jpg', width: 1920, height: 1080, alt: 'Rendered elevation of the townhouses with exposed brick accents' },
      { stage: 'design', src: '/Trevea/design/trivara-design-2.jpg', width: 1241, height: 859, alt: 'Isometric view of the first floor, plots 8 & 9' },
      { stage: 'design', src: '/Trevea/design/trivara-design-3.jpg', width: 1241, height: 877, alt: 'Isometric view of the ground floor, plots 8 & 9' },
      { stage: 'design', src: '/Trevea/design/trivara-design-4.jpg', width: 1131, height: 1600, alt: 'Coloured ground floor plan, plots 8 & 9' },
      { stage: 'design', src: '/Trevea/design/trivara-design-5.jpg', width: 1131, height: 1600, alt: 'Coloured first floor plan, plot 10' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-01.jpg', width: 1600, height: 720, alt: 'Plinth beam reinforcement laid out on the excavated foundation, with workers and column starter bars' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-02.jpg', width: 1600, height: 720, alt: 'Cast plinth beams and column starter bars at foundation level' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-03.jpg', width: 1280, height: 720, alt: 'Ground-floor brick walls rising between concrete columns, with a wheelbarrow and stacked bricks' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-04.jpg', width: 1600, height: 900, alt: 'Columns rising from the slab at dusk, a worker curing the concrete with a hose' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-05.jpg', width: 1600, height: 900, alt: 'Columns in timber formwork on the slab at sunset, neighbouring houses beyond' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-06.jpg', width: 900, height: 1600, alt: 'Masons laying brickwork beside reinforcement bars, the sun low behind' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-07.jpg', width: 1600, height: 900, alt: 'Workers tying reinforcement over a sunken pit between brick walls' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-08.jpg', width: 1280, height: 720, alt: 'Workers coating the inside walls of a brick tank between reinforced columns' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-09.jpg', width: 1600, height: 900, alt: 'Reinforcement and shuttering for a slab beam, a worker fixing the formwork' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-10.jpg', width: 1600, height: 900, alt: 'Roof slab reinforcement laid out at sunset, workers at the edge' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-11.jpg', width: 1600, height: 900, alt: 'Slab reinforcement mesh across the full floor, neighbouring houses and palms behind' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-12.jpg', width: 1600, height: 1200, alt: 'Slab reinforcement with white conduit pipes laid across the mesh before the pour' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-13.jpg', width: 1600, height: 900, alt: 'Shuttering over an opening between brick walls, seen from roof level' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-14.jpg', width: 4080, height: 3060, alt: 'Masonry frame wrapped in scaffolding, seen from below' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-15.jpg', width: 1280, height: 572, alt: 'Two-storey concrete frame with brick infill, seen from the street' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-16.jpg', width: 1600, height: 900, alt: 'Plastered terrace parapet and stair-head room, a worker at the roof edge' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-17.jpg', width: 4080, height: 3060, alt: 'The scaffolded masonry frame from the same viewpoint in a lighter exposure' },
      { stage: 'construction', src: '/Trevea/construction/trivara-construction-18.jpg', width: 2268, height: 4032, alt: 'Timber door frame fixed in the concrete structure, hung with flower garlands' },
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

/** The gallery sections, in the order a project page shows them. */
export const projectStages: ReadonlyArray<{ stage: ProjectStage; label: string }> = [
  { stage: 'finished', label: 'Finished' },
  { stage: 'design', label: 'Design' },
  { stage: 'construction', label: 'Construction' },
];

/** A project's pictures split into sections. A stage with nothing in it yet is left out. */
export function galleryStages(project: Project) {
  return projectStages
    .map(({ stage, label }) => ({
      stage,
      label,
      shots: project.gallery.filter((shot) => shot.stage === stage),
    }))
    .filter(({ shots }) => shots.length > 0);
}

/**
 * Pictures per section an archive card cycles through. A card stacks every frame
 * it shows, so it takes a taste of each stage rather than the whole gallery.
 */
const CARD_FRAMES_PER_STAGE = 2;

/** The frames an archive card cycles on hover; the first is the card's still. */
export function cardShots(project: Project): ReadonlyArray<ProjectShot> {
  return galleryStages(project).flatMap(({ shots }) => shots.slice(0, CARD_FRAMES_PER_STAGE));
}

/** Categories that are actually set. Empty while every project is unconfirmed. */
export function projectCategories(): string[] {
  return [...new Set(projects.map((p) => p.category))].filter((c) => !isUnconfirmed(c));
}
