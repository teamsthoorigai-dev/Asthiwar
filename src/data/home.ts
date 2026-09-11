import type { FaqContent } from '@/components/home/Faq';
import type { EnquiryFormContent } from '@/components/home/EnquiryForm';
import type { WorkGalleryContent } from '@/components/home/WorkGallery';

export const homeHero = {
  heading: 'A building practice, not a relay race.',
  body:
    'Architecture, engineering and construction in Coimbatore — coordinated through one process, from the first site walk to the first monsoon.',
  primaryCta: {
    label: 'Start a project',
    href: '/contact',
  },
  secondaryCta: {
    label: 'Estimate your build',
    href: '/cost-calculator',
  },
  image: {
    src: '/images/hero.jpg',
    alt: 'Bespoke tropical architectural residence featuring dry-stone masonry, reflecting pool, board-formed concrete, and natural timber screening.',
  },
} as const;

/* ---- Section 01 · LogoReveal ---- */

export const logoReveal = {
  /**
   * Sits under the wordmark once the reveal lands. An identity descriptor, not
   * a slogan: the same three disciplines and the same city the page metadata
   * and the footer already claim, so nothing here is a new assertion.
   */
  descriptor: ['Architecture', 'Engineering', 'Construction', 'Coimbatore'],
  /**
   * The two things a visitor can actually do, on the hairline that closes the
   * opening viewport. Same destinations the old hero CTAs carried; the homepage
   * otherwise offers nothing actionable until the footer.
   */
  links: [
    { label: 'Start a project', href: '/contact' },
    { label: 'Estimate your build', href: '/cost-calculator' },
  ],
} as const;

export type HomePrincipleIcon =
  | 'cooling'
  | 'lowCement'
  | 'wellbeing'
  | 'environment';

/**
 * The four sustainability principles, as approved in v1. `lines` is the break
 * the band renders — the labels are set two-up under the mark, so the break is
 * authored here rather than left to the wrap.
 */
export const homePrinciples = [
  { label: 'Natural Cooling', lines: ['Natural Cooling'], icon: 'cooling' },
  { label: 'Low Cement / Cement Free', lines: ['Low Cement /', 'Cement Free'], icon: 'lowCement' },
  { label: 'Long-term Well-being', lines: ['Long-term', 'Well-being'], icon: 'wellbeing' },
  {
    label: 'Environmental Responsibility',
    lines: ['Environmental', 'Responsibility'],
    icon: 'environment',
  },
] as const satisfies ReadonlyArray<{
  label: string;
  lines: readonly string[];
  icon: HomePrincipleIcon;
}>;

export const homePrinciplesLabel =
  'Sustainable design principles. The marks move continuously; hover or focus to pause.';

/* ---- Section 03 · PhilosophyCounters ---- */

export const philosophy = {
  title: 'One process, end to end.',
  body: 'Architecture, interior, construction, structural engineering and green building are brought together through one coordinated process. The process is deliberately front-loaded — coordination is cheaper on paper than under a poured slab.',
  cta: { label: 'How we work', href: '/about' },
  counters: [
    { value: 5, label: 'Disciplines' },
    { value: 1, label: 'Continuous process' },
    { value: 7, label: 'Stages', sublabel: 'First walk to handover' },
    { value: 0, label: 'Handoffs', sublabel: 'Between teams' },
  ],
} as const satisfies {
  title: string;
  body: string;
  cta: { label: string; href: string };
  counters: ReadonlyArray<{ value: number; label: string; sublabel?: string }>;
};

/* ---- Section 04 · EstimateBand ---- */

/**
 * A preview of what the full calculator asks for. The rows are not inputs —
 * every one of them opens /cost-calculator, where the real wizard collects the
 * answer. The figure stays an em dash until it does.
 */
export const estimateBand = {
  eyebrow: 'Cost calculator',
  title: 'Understand your budget before you design.',
  fields: [
    { label: 'Location', action: 'Select' },
    { label: 'Built-up area', action: 'Enter area' },
    { label: 'Construction quality', action: 'Select' },
  ],
  figureLabel: 'Estimated project cost',
  note: 'Estimated cost only. Final project cost depends on design, specifications, site conditions, materials and project requirements.',
  cta: { label: 'Calculate your cost', href: '/cost-calculator' },
} as const satisfies {
  eyebrow: string;
  title: string;
  fields: ReadonlyArray<{ label: string; action: string }>;
  figureLabel: string;
  note: string;
  cta: { label: string; href: string };
};

/* ---- Section 05 · LastingCards ---- */

export type LastingCardIcon =
  | 'site'
  | 'load'
  | 'detail'
  | 'material'
  | 'less'
  | 'record';

export const lastingCards = {
  eyebrow: 'Principles',
  title: 'What makes a building last?',
  cards: [
    {
      icon: 'site',
      tag: 'Microclimate & Sun Path',
      title: 'Read the site first',
      body: 'Orientation, wind, shade and drainage are settled before a single wall is drawn. Comfort begins in plan and section.',
      image: '/images/courtyard.jpg',
      imageAlt: 'Planted courtyard open to the sky, shaded on three sides by the building.',
      blueprint: {
        standard: 'ECBC / NBC 2016 Cl. 8',
        tolerance: 'Solar azimuth verified ±1.5°',
        spec: 'Pre-design solar radiation and prevailing monsoon wind modeling. Fenestration recessed min 450mm on south and west elevations.',
        cadRef: 'PL-01 // SOLAR-WIND-08',
      },
    },
    {
      icon: 'load',
      tag: 'Structural Geometry',
      title: 'One load path',
      body: 'Architecture asks what life needs; engineering asks what the idea demands. The grid is simplified until both answers agree.',
      image: '/images/asthivar-villa.jpg',
      imageAlt: 'Stone villa at dusk, its upper floor carried on a deep cantilever over the terrace.',
      blueprint: {
        standard: 'IS 456:2000 & IS 13920',
        tolerance: 'Axis deviation < 2mm / 3m height',
        spec: 'Continuous vertical transfer lines without eccentric offsets. Moment-resisting ductile frame with tension-balanced cantilever rebar.',
        cadRef: 'ST-02 // LOAD-GEO-14',
      },
    },
    {
      icon: 'detail',
      tag: 'Zero-Tolerance Detailing',
      title: 'Detail before pour',
      body: 'Critical junctions are drawn and prototyped on paper. Coordination is cheaper on paper than under a poured slab.',
      image: '/images/materials.jpg',
      imageAlt: 'Masonry and timber samples laid out beside working drawings.',
      blueprint: {
        standard: 'DIN 18202 Class 4',
        tolerance: 'Cast rebate ±0.5mm threshold',
        spec: '1:1 shop drawings for all MEP conduit crossings and structural joints before formwork closure. No wet core drilling post-cure.',
        cadRef: 'DT-03 // JUNC-POUR-09',
      },
    },
    {
      icon: 'material',
      tag: 'Earth & Breathable Lime',
      title: 'Material honesty',
      body: 'Lime plaster, exposed masonry, engineered timber. Finishes are the material, not a coating over it.',
      image: '/images/lime-plaster.jpg',
      imageAlt: 'Hand-applied lime plaster, its trowel texture left visible.',
      blueprint: {
        standard: 'IS 712 Class C Hydraulic Lime',
        tolerance: 'Vapour perm > 0.8 mg/(m·h·Pa)',
        spec: 'Naturally hydraulic 1:3 slaked fat lime and river sand matrix. Zero synthetic binders or acrylic polymer emulsion seals.',
        cadRef: 'MT-04 // LIME-PLAST-22',
      },
    },
    {
      icon: 'less',
      tag: 'Low-Carbon CSEB Blocks',
      title: 'Ask less of the material',
      body: 'Low-cement and cement-free methods where the structure allows, without trading away structural integrity.',
      image: '/images/sustainable.jpg',
      imageAlt: 'Compressed stabilised earth blocks stacked and curing on site.',
      blueprint: {
        standard: 'IS 1725:2013 Class 7.5',
        tolerance: 'Compressive strength ≥ 7.5 MPa',
        spec: 'Auram press compacted blocks with 5% ordinary Portland cement stabilizer. 28-day water cured under shade canvas.',
        cadRef: 'BL-05 // CSEB-SPEC-03',
      },
    },
    {
      icon: 'record',
      tag: 'Full Lifetime Traceability',
      title: 'Recorded, not remembered',
      body: 'Progress, quality checks and site decisions are written down and handed over with the building.',
      image: '/images/workshop.jpg',
      imageAlt: 'Drafting tables carrying marked-up drawings and site record sheets.',
      blueprint: {
        standard: 'ISO 9001 QA & As-Built Protocol',
        tolerance: '100% pour slump & cube test records',
        spec: 'Immutable photographic site log, concrete test cube batch certificates, and laminated electrical conduit run schemas.',
        cadRef: 'QA-06 // AS-BUILT-99',
      },
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  cards: ReadonlyArray<{
    icon: LastingCardIcon;
    tag: string;
    title: string;
    body: string;
    image: string;
    imageAlt: string;
    blueprint: {
      standard: string;
      tolerance: string;
      spec: string;
      cadRef: string;
    };
  }>;
};

/* ---- Section 06 · PracticeInterlude ---- */

export const practiceInterlude = {
  eyebrow: 'The practice',
  title: 'ASTHIWAR is a design-and-build practice working across Coimbatore and Tamil Nadu.',
  paragraphs: [
    'Architecture, engineering and execution are not handed between firms — they are held by one team, through one process, from the first site walk to the first monsoon.',
    'The result is a building whose space and load path feel inevitable together — and a client who never has to translate between three sets of drawings.',
  ],
  cta: { label: 'Meet the studio', href: '/about' },
  image: {
    src: '/frames/frame-150.webp',
    alt: 'Reinforced concrete frame under construction, seen from below.',
  },
} as const satisfies {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

/* ---- Section 07 · ProcessReveal ---- */

export const processReveal = {
  eyebrow: 'Why it matters',
  title: 'A relay race, or one process.',
  prompt: 'Click to discover',
  columns: {
    conventional: 'Conventional route',
    asthiwar: 'ASTHIWAR',
  },
  rows: [
    {
      conventional: 'Architect, engineer and contractor engaged separately',
      asthiwar: 'One team, one contract',
    },
    {
      conventional: 'Drawings translated three times',
      asthiwar: 'One drawing set, coordinated once',
    },
    {
      conventional: 'Cost discovered at tender',
      asthiwar: 'Cost modelled from the first sketch',
    },
    {
      conventional: 'Site problems become disputes',
      asthiwar: 'Site problems become decisions',
    },
    {
      conventional: 'Nobody owns the outcome',
      asthiwar: 'One party is accountable at handover',
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  prompt: string;
  columns: { conventional: string; asthiwar: string };
  rows: ReadonlyArray<{ conventional: string; asthiwar: string }>;
};

/* ---- Section 08 · DisciplinesSticky ---- */

export const disciplines = {
  eyebrow: 'Services',
  title: 'Five disciplines. One continuous process.',
  body: 'Architecture, interior, construction, structural engineering and green building brought together through one coordinated process.',
} as const satisfies {
  eyebrow: string;
  title: string;
  body: string;
};

/* ---- Section 09 · CoverageCounters ---- */

export const coverage = {
  eyebrow: 'Where we build',
  title: 'Built across Tamil Nadu.',
  body: 'ASTHIWAR works from Coimbatore, with projects and site supervision across the western and central districts.',
  counters: [
    { value: 7, label: 'Cities served' },
    { value: 5, label: 'Disciplines in-house' },
    { value: 1, label: 'Point of accountability' },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  body: string;
  counters: ReadonlyArray<{ value: number; label: string }>;
};

/* ---- Section 10 · ScopeColumns ---- */

export const scopeColumns = {
  eyebrow: 'Scope',
  title: 'What one process covers.',
  cta: {
    label: 'See all services',
    href: '/services',
  },
  backgroundImage: {
    src: '/frames/frame-060.webp',
    alt: 'ASTHIWAR site construction under supervision.',
  },
  columns: [
    {
      title: 'Design',
      capabilities: [
        'Site and climate analysis',
        'Concept and spatial planning',
        'Space planning and material strategy',
        'Custom joinery and lighting',
      ],
    },
    {
      title: 'Engineering',
      capabilities: [
        'Structural concept design',
        'Analysis and detailing',
        'Existing-building assessment',
        'Site review and consulting',
      ],
    },
    {
      title: 'Execution',
      capabilities: [
        'Pre-construction planning',
        'Site execution',
        'Quality and progress records',
        'Commissioning and handover',
      ],
    },
    {
      title: 'Sustainability',
      capabilities: [
        'Passive design studies',
        'Envelope and daylight review',
        'Water strategy',
        'Material impact review',
      ],
    },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  cta: { label: string; href: string };
  backgroundImage: { src: string; alt: string };
  columns: ReadonlyArray<{
    title: string;
    capabilities: readonly string[];
  }>;
};

/* ---- Section 11 · SustainabilityInterlude ---- */

export const sustainabilityInterlude = {
  title: 'Comfort designed in, before energy is spent.',
  body:
    'Natural cooling, low-cement and cement-free construction, and green-building methods are treated as structural decisions, not add-ons. The aim is to ask less material to do more useful work — and to reduce what the building needs from a machine.',
  items: [
    {
      title: 'Natural cooling',
      description:
        'Designing for airflow so interiors stay cooler with less mechanical ventilation.',
    },
    {
      title: 'Low-cement / cement-free',
      description:
        'Lower-carbon methods and materials, without trading structural integrity.',
    },
    {
      title: 'Green building',
      description:
        'Envelope, daylight, water and material impact reviewed together.',
    },
  ],
  cta: {
    label: 'Sustainable construction',
    href: '/sustainable-construction',
  },
} as const satisfies {
  title: string;
  body: string;
  items: ReadonlyArray<{
    title: string;
    description: string;
  }>;
  cta: {
    label: string;
    href: string;
  };
};

/* ---- Section 12 · ProcessStages ---- */

export const processStages = {
  eyebrow: 'Process',
  title: 'From first walk to first monsoon',
  body: 'Seven stages, with the right question asked at each one.',
  note: 'The process is deliberately front-loaded: coordination is cheaper on paper than under a poured slab.',
  cta: { label: 'The full process', href: '/about' },
  stages: [
    { title: 'Site walk', question: 'What does this piece of land already tell us?' },
    { title: 'Brief and feasibility', question: 'What does life here actually need?' },
    { title: 'Concept and section', question: 'Where do light, air and load want to go?' },
    { title: 'Coordinated drawings', question: 'Does every system agree with every other?' },
    { title: 'Costing and approvals', question: 'What does this really cost, and what will be permitted?' },
    { title: 'Construction', question: 'Is what we drew what is being built?' },
    { title: 'Handover and first monsoon', question: 'Does it perform in the season that tests it?' },
  ],
  layers: [
    { src: '/assembly-layers/01-ground-foundations.webp', alt: 'Ground and foundations.' },
    { src: '/assembly-layers/02-structure.webp', alt: 'Structural frame.' },
    { src: '/assembly-layers/03-envelope.webp', alt: 'Building envelope.' },
    { src: '/assembly-layers/04-interior-services.webp', alt: 'Interior and services.' },
    { src: '/assembly-layers/05-roof-landscape.webp', alt: 'Roof and landscape.' },
  ],
} as const satisfies {
  eyebrow: string;
  title: string;
  body: string;
  note: string;
  cta: { label: string; href: string };
  stages: ReadonlyArray<{ title: string; question: string }>;
  layers: ReadonlyArray<{ src: string; alt: string }>;
};

/* ---- Section 13 · BuildSequence ---- */

export const buildSequence = {
  title: 'One building, one sequence.',
  frameCount: 300,
  framePath: (n: number) => `/frames/frame-${String(n).padStart(3, '0')}.webp`,
  posterAlt: 'A building rising from foundations to finished envelope.',
  captions: [
    { at: 0.15, text: 'Ground is read before it is cut.' },
    { at: 0.45, text: 'The frame follows one load path.' },
    { at: 0.75, text: 'The envelope is detailed before it is poured.' },
  ],
} as const;

/* ---- Section 14 · Faq ---- */

export const faqContent = {
  title: 'Frequently asked questions',
  intro: 'To be confirmed',
} as const satisfies FaqContent;

/* ---- Section 15 · WorkGallery ---- */

export const workGallery = {
  eyebrow: 'Work',
  title: 'Selected work',
  labels: {
    location: 'Location',
    year: 'Year',
  },
  cta: {
    label: 'All projects',
    href: '/projects',
  },
  tiles: [
    {
      id: '01',
      href: '/projects/project-01',
      title: 'Project 01',
      location: 'To be confirmed',
      year: 'To be confirmed',
      image: {
        src: '/frames/frame-034.webp',
        alt: 'Excavated foundations and footing pads set out on a cleared site.',
      },
    },
    {
      id: '02',
      href: '/projects/project-02',
      title: 'Project 02',
      location: 'To be confirmed',
      year: 'To be confirmed',
      image: {
        src: '/frames/frame-090.webp',
        alt: 'Reinforced concrete columns and first-floor slab formwork in place.',
      },
    },
    {
      id: '03',
      href: '/projects/project-03',
      title: 'Project 03',
      location: 'To be confirmed',
      year: 'To be confirmed',
      image: {
        src: '/frames/frame-150.webp',
        alt: 'Completed frame with masonry infill beginning on the lower floor.',
      },
    },
    {
      id: '04',
      href: '/projects/project-04',
      title: 'Project 04',
      location: 'To be confirmed',
      year: 'To be confirmed',
      image: {
        src: '/frames/frame-210.webp',
        alt: 'Envelope closed, with openings framed and roof structure complete.',
      },
    },
  ],
} as const satisfies WorkGalleryContent;

/* ---- Section 17 · EnquiryForm ---- */

export const enquiryForm = {
  title: 'Tell us about your project.',
  body: 'Your site, what you want to build, and where you are in the process.',
  labels: {
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
    projectType: 'Project type',
    message: 'Message',
  },
  placeholders: {
    name: 'Your name',
    phone: '10-digit mobile number',
    email: 'name@example.com',
    location: 'Choose a location',
    projectType: 'Choose a project type',
    message: 'Share any details that will help us understand the project',
  },
  helpers: {
    name: 'Required. Use at least 2 characters.',
    phone: 'Required. Use a 10-digit mobile number.',
    email: 'Required. Use an email address.',
    location: 'Required. Choose a city or Other.',
    projectType: 'Required. Choose the closest option.',
    message: 'Optional.',
  },
  projectTypes: ['New build', 'Interior', 'Renovation', 'Not sure yet'],
  otherLocationLabel: 'Other',
  submitLabel: 'Send enquiry',
  submittingLabel: 'Sending enquiry',
  errors: {
    nameRequired: 'Enter your name.',
    nameTooShort: 'Enter at least 2 characters.',
    phoneRequired: 'Enter your phone number.',
    phoneInvalid: 'Enter a valid 10-digit mobile number.',
    emailRequired: 'Enter your email address.',
    emailInvalid: 'Enter a valid email address.',
    locationRequired: 'Choose a location.',
    projectTypeRequired: 'Choose a project type.',
    submission: 'We could not send the enquiry. Please try again.',
  },
  success: {
    title: 'Thank you for sharing your project.',
    body: 'Your enquiry has been submitted.',
  },
} as const satisfies EnquiryFormContent;
