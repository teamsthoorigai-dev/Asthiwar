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
    slug: 'interiors',
    index: '03',
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
    slug: 'structural',
    index: '05',
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
    slug: 'green-building',
    index: '06',
    title: 'Green Building',
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

/** Answers are approved copy from the previous build — do not rewrite them. */
export const faqs = [
  {
    q: 'How does the design-build process work?',
    a: 'Architecture, engineering and execution are coordinated through one process, from early design to project delivery.',
  },
  {
    q: 'What factors affect construction cost?',
    a: 'Location, built-up area, materials, construction quality, structural requirements, design complexity, timeline and sustainable construction choices all affect cost.',
  },
  {
    q: 'Can ASTHIWAR handle architecture and construction together?',
    a: 'Yes. ASTHIWAR brings architecture, engineering and execution together through one coordinated process.',
  },
  {
    q: 'What sustainable construction options are available?',
    a: 'ASTHIWAR is expanding its offering around natural cooling, low-cement or cement-free construction and green building solutions.',
  },
  {
    q: 'How accurate is the cost calculator?',
    a: 'It provides an estimated cost only. Final cost depends on design, specifications, site conditions, materials and project requirements.',
  },
  {
    q: 'How do I start a project with ASTHIWAR?',
    a: 'Tell us about your project, your site and what you want to build.',
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

/**
 * Project records are unconfirmed. Every field below is the literal string
 * "To be confirmed" by design — project rule 10 and docs/01-MASTER-PLAN.md
 * section 9. Do not replace these with invented names, dates or locations;
 * they become false claims the moment the site goes live.
 *
 * Slugs match the tiles already linked from the homepage WorkGallery.
 */
export const projects: readonly Project[] = [
  {
    slug: 'project-01',
    title: 'The Courtyard Residence',
    location: 'Coimbatore, Tamil Nadu',
    type: 'Private Residential Villa',
    category: 'Residential',
    area: '4,200 sq.ft',
    year: '2025',
    status: 'Completed',
    image: { src: '/images/courtyard.jpg', alt: 'Central planted courtyard open to the sky with warm teakwood and stone finishes' },
    gallery: [
      { src: '/images/courtyard.jpg', alt: 'Planted courtyard with rain catchment pool' },
      { src: '/images/asthivar-villa.jpg', alt: 'Exterior cantilevered stone masses' },
      { src: '/images/lime-plaster.jpg', alt: 'Breathable lime stucco interior walls' },
      { src: '/images/materials.jpg', alt: 'Material sample palette and joinery' },
    ],
    summary: 'A climate-responsive heirloom home organized around a central planted rainwater courtyard, utilizing passive stack ventilation to eliminate daytime mechanical air conditioning.',
    overview: 'Designed for a multi-generational family in Coimbatore, this residence balances monolithic exterior privacy with an open, light-filled sanctuary inside. The structural grid aligns directly with the natural airflow vectors of the Palghat gap.',
    challenge: 'Achieving complete thermal comfort during peak 38°C summer temperatures without high-energy HVAC dependence on a dense urban plot.',
    approach: 'Employed 300mm stabilized rammed earth external walls with high thermal mass, paired with a central thermal chimney courtyard and deep terracotta overhangs.',
    materials: ['Stabilized Rammed Earth', 'Chettinad Athangudi Tiles', 'Slaked Lime Plaster', 'Reclaimed Teakwood'],
    timeline: [
      { phase: 'Site & Climate Reading', duration: '6 Weeks', note: 'Wind tunnel and solar path simulation' },
      { phase: 'Coordinated Drawings', duration: '8 Weeks', note: 'Zero-clash structural and MEP blueprint' },
      { phase: 'Earth & Superstructure', duration: '24 Weeks', note: 'Monolithic ramming and RCC slab' },
      { phase: 'Finishes & Handover', duration: '14 Weeks', note: 'Handmade tile setting and lime burnishing' },
    ],
  },
  {
    slug: 'project-02',
    title: 'The Jaali Breeze House',
    location: 'Pollachi, Tamil Nadu',
    type: 'Sustainable Agricultural Estate',
    category: 'Sustainable',
    area: '3,600 sq.ft',
    year: '2024',
    status: 'Completed',
    image: { src: '/images/jaali.jpg', alt: 'Perforated clay brick screen casting dynamic geometric shade across the verandah' },
    gallery: [
      { src: '/images/jaali.jpg', alt: 'Perforated jaali brick screen' },
      { src: '/images/sustainable.jpg', alt: 'Exposed clay brick masonry and garden' },
      { src: '/images/courtyard.jpg', alt: 'Shaded verandah seating area' },
      { src: '/images/materials.jpg', alt: 'Natural terracotta tile samples' },
    ],
    summary: 'A farmhouse wrapped in an engineered clay jaali screen that filters harsh western sunlight while accelerating natural cross-breezes across the living pavilion.',
    overview: 'Located amidst coconut groves in Pollachi, the home is oriented along the prevailing southwest monsoon wind path. The perforated brick envelope acts as an acoustic and thermal buffer.',
    challenge: 'Balancing extreme monsoonal downpours with the need for continuous, unhindered natural airflow throughout the seasons.',
    approach: 'Engineered a double-skin facade featuring an outer porous terracotta jaali screen and recessed operable wooden louvres with deep verandah aprons.',
    materials: ['Kiln-Fired Wirecut Brick', 'Polished Kota Stone', 'Local Teakwood', 'Natural Oxide Flooring'],
    timeline: [
      { phase: 'Microclimate Modeling', duration: '4 Weeks', note: 'Wind mapping through plantation' },
      { phase: 'Structural Masonry', duration: '18 Weeks', note: 'Precision jaali pattern dry-stack testing' },
      { phase: 'Joinery & Verandahs', duration: '12 Weeks', note: 'Salvaged timber lintels installation' },
      { phase: 'Testing & Handover', duration: '4 Weeks', note: 'Monsoon weatherproofing audit' },
    ],
  },
  {
    slug: 'project-03',
    title: 'The Nilgiris Earth Sanctuary',
    location: 'Kotagiri, Tamil Nadu',
    type: 'Hill Retreat & Eco-Resort',
    category: 'Sustainable',
    area: '5,400 sq.ft',
    year: '2025',
    status: 'In Progress',
    image: { src: '/images/sustainable.jpg', alt: 'Terraced hillside residence built from on-site quarried earth and native stone' },
    gallery: [
      { src: '/images/sustainable.jpg', alt: 'Earth walls blending into tea plantation contours' },
      { src: '/images/asthivar-villa.jpg', alt: 'Stone retaining foundation' },
      { src: '/images/materials.jpg', alt: 'Soil stabilization test cylinders' },
      { src: '/images/workshop.jpg', alt: 'On-site block pressing workshop' },
    ],
    summary: 'A zero-cement earth sanctuary stepping down the contours of a Kotagiri tea estate, utilizing 100% site-excavated soil for structural stabilized earth blocks.',
    overview: 'This ecological retreat redefines mountain architecture by avoiding destructive slope cutting. The foundation anchors directly to granite bedrock outcrops with zero heavy machinery haulage.',
    challenge: 'Steep 28-degree slope gradient with high monsoonal soil moisture and strict Nilgiris ecological building mandates.',
    approach: 'Micro-terraced structural stone footings combined with interlocking stabilized earth blocks and an integrated sub-surface French drainage grid.',
    materials: ['Site-Excavated Compressed Earth (CSEB)', 'Quarried Nilgiris Granite', 'Pine Shingle Roofing', 'Rammed Clay Mortar'],
    timeline: [
      { phase: 'Soil Geotech Assay', duration: '6 Weeks', note: 'Clay-sand-silt stabilization grading' },
      { phase: 'Contour Foundations', duration: '16 Weeks', note: 'Dry-stone retaining wall terracing' },
      { phase: 'CSEB Superstructure', duration: '20 Weeks', note: 'Interlocking block masonry' },
      { phase: 'Internal Shell', duration: '12 Weeks', note: 'Timber ceiling and wood stove venting' },
    ],
  },
  {
    slug: 'project-04',
    title: 'The Monolithic Studio & Pavilion',
    location: 'Coimbatore, Tamil Nadu',
    type: 'Architectural Atelier & Commercial Studio',
    category: 'Commercial',
    area: '6,800 sq.ft',
    year: '2024',
    status: 'Completed',
    image: { src: '/images/asthivar-villa.jpg', alt: 'Board-formed exposed concrete atelier with reflecting pool and floor-to-ceiling glass' },
    gallery: [
      { src: '/images/asthivar-villa.jpg', alt: 'Board-formed concrete pavilion' },
      { src: '/images/materials.jpg', alt: 'Drafting studio and library' },
      { src: '/images/courtyard.jpg', alt: 'Cantilevered upper gallery projecting over the courtyard.' },
      { src: '/images/workshop.jpg', alt: 'Model-making fabrication space' },
    ],
    summary: 'A disciplined exploration of board-formed exposed concrete and regional granite, housing ASTHIWAR’s own design studio, fabrication workshop, and material archive.',
    overview: 'Built as a living demonstration of the studio’s design-build philosophy, the building features 12-meter column-free structural spans and integrated radiant floor cooling coils.',
    challenge: 'Pouring architectural-grade exposed concrete with razor-sharp tolerances under hot Coimbatore atmospheric curing conditions.',
    approach: 'Formwork crafted from local pine timber boards with customized hydration retarders and continuous 28-day water ponding cure protocol.',
    materials: ['Board-Formed Concrete (M35)', 'Honed Black Granite', 'Mild Steel Profiles', 'Low-E Acoustic Glazing'],
    timeline: [
      { phase: 'Design & Engineering', duration: '10 Weeks', note: 'Finite element structural optimization' },
      { phase: 'Formwork Crafting', duration: '12 Weeks', note: 'Tongue-and-groove pine board preparation' },
      { phase: 'Continuous Pour', duration: '16 Weeks', note: 'Single-pour monolithic core erection' },
      { phase: 'Fitout & Commissioning', duration: '10 Weeks', note: 'Radiant hydronic system calibration' },
    ],
  },
  {
    slug: 'project-05',
    title: 'The Chettinad Modern Estate',
    location: 'Madurai, Tamil Nadu',
    type: 'Heritage Contemporary Residence',
    category: 'Residential',
    area: '7,400 sq.ft',
    year: '2025',
    status: 'In Planning',
    image: { src: '/images/materials.jpg', alt: 'Traditional Chettinad spatial axes translated into modern steel and granite frames' },
    gallery: [
      { src: '/images/materials.jpg', alt: 'Handmade tile prototypes' },
      { src: '/images/courtyard.jpg', alt: 'Axial colonnade study' },
      { src: '/images/jaali.jpg', alt: 'Geometric lattice screening' },
      { src: '/images/lime-plaster.jpg', alt: 'Polished egg-white lime plaster' },
    ],
    summary: 'Reinterpreting the legendary spatial generosity and climate resilience of Chettinad courtyard mansions for contemporary 21st-century luxury living.',
    overview: 'The layout honors the classic Chettinad axial progression: Thinnai (outer verandah) -> Pattalai (central hall) -> Valavu (open inner courtyard) -> Bhoomi (family sanctum).',
    challenge: 'Replicating the mirror-sheen finish of historic egg-white lime plaster (*Chettinad Vellai*) using certified sustainable natural ingredients.',
    approach: 'Collaborated with master generational artisans from Karaikudi to formulate slaked shell lime blended with river pebbles and natural curd extract.',
    materials: ['Generational Chettinad Lime', 'Burma Teak Columns', 'Karaikudi Terracotta Tiles', 'Polished Sadarahalli Granite'],
    timeline: [
      { phase: 'Heritage Documentation', duration: '8 Weeks', note: 'Analysis of ancestral mansion thermal metrics' },
      { phase: 'Artisan Prototyping', duration: '6 Weeks', note: 'Sample panels for 5-coat lime plaster' },
      { phase: 'Groundworks', duration: '14 Weeks', note: 'Deep raft foundation and rainwater sump' },
      { phase: 'Superstructure', duration: '28 Weeks', note: 'Cast stone colonnade and timber roof truss' },
    ],
  },
  {
    slug: 'project-06',
    title: 'The Lime Stucco Penthouse',
    location: 'Tiruppur, Tamil Nadu',
    type: 'Penthouse Adaptive Renovation',
    category: 'Renovation',
    area: '3,900 sq.ft',
    year: '2024',
    status: 'Completed',
    image: { src: '/images/lime-plaster.jpg', alt: 'Minimalist penthouse interior with seamless bone-white lime stucco walls and warm oak joinery' },
    gallery: [
      { src: '/images/lime-plaster.jpg', alt: 'Hand-troweled lime stucco walls' },
      { src: '/images/asthivar-villa.jpg', alt: 'Planted terrace beneath the cantilevered upper floor.' },
      { src: '/images/courtyard.jpg', alt: 'Sky garden water mirror' },
      { src: '/images/materials.jpg', alt: 'Custom brass switchplates and details' },
    ],
    summary: 'A complete interior and structural transformation of a rooftop concrete shell into a serene, minimalist sanctuary finished in breathable lime stucco.',
    overview: 'Stripped away standard commercial drywall and false ceilings to reveal the raw concrete waffle slab, contrasted against tactile bone-white slaked lime plaster.',
    challenge: 'Managing heavy thermal heat gain through the exposed rooftop concrete roof slab without adding immense structural dead load.',
    approach: 'Installed an inverted insulated green roof terrace over a lightweight expanded clay aggregate buffer, reducing indoor radiant ceiling temperatures by 7°C.',
    materials: ['Slaked Hydrated Lime Plaster', 'Micro-Topped Terrazzo Flooring', 'Aged Raw Brass Hardware', 'Thermal Clay Roof Tiles'],
    timeline: [
      { phase: 'Structural Audit', duration: '3 Weeks', note: 'Non-destructive ultrasonic slab scanning' },
      { phase: 'Thermal Roof Assembly', duration: '6 Weeks', note: 'Double insulation layer and waterproof membrane' },
      { phase: 'Lime Plastering', duration: '10 Weeks', note: '3-stage wet-on-wet hand trowel application' },
      { phase: 'Handover & Commissioning', duration: '3 Weeks', note: 'Acoustic and indoor air quality certification' },
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
