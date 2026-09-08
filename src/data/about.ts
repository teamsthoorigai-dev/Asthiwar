export type AboutStage = {
  readonly index: string;
  readonly title: string;
  readonly question: string;
  readonly description?: string;
};

export type AboutPrinciple = {
  readonly index: string;
  readonly title: string;
  readonly description: string;
};

export const aboutHero = {
  eyebrow: 'Studio',
  title: 'A building practice, not a relay race.',
  body:
    'ASTHIWAR brings architecture, structural thinking, interiors, and construction into one accountable conversation — from the first site walk to seasonal performance after handover.',
  image: '/images/hero.jpg',
  imageAlt:
    'A shaded stone-and-concrete residence arranged around a reflective courtyard pool',
  imageCaption: ['ASTHIWAR / FIELD RECORD', 'INTEGRATED DESIGN + BUILD'] as const,
  meta: [
    'Architecture + Engineering',
    'Coordinated Execution',
    'Coimbatore · Tamil Nadu',
  ] as const,
} as const;

export const aboutDuality = {
  eyebrow: 'Two ways of seeing / one building',
  architecture: {
    index: '01 / Architecture',
    statement: 'Architecture asks what life needs.',
    aspects: 'Light, sequence, privacy, proportion, material, and daily use.',
    perspective: 'The room as it is experienced.',
  },
  engineering: {
    index: '02 / Engineering',
    statement: 'Engineering asks what the idea demands.',
    aspects: 'Load, span, soil, water, movement, durability, and assembly.',
    perspective: 'The room as it is made possible.',
  },
  resolution:
    'The best answer is neither compromise nor excess. It is a building whose space and load path feel inevitable together.',
} as const;

export const aboutPrinciples = {
  eyebrow: 'What remains constant',
  title: 'Principles strong enough to survive different sites.',
  lead: 'The architecture changes. These obligations do not.',
  items: [
    {
      index: '01',
      title: 'Climate before form',
      description:
        'Use orientation, shade, mass, air, and water as primary design material.',
    },
    {
      index: '02',
      title: 'Buildability before image',
      description:
        'A detail must explain its sequence, tolerance, access, and maintenance.',
    },
    {
      index: '03',
      title: 'Material before finish',
      description:
        'Choose assemblies for ageing, repair, sourcing, touch, and environmental cost.',
    },
    {
      index: '04',
      title: 'Evidence before adjectives',
      description:
        'Use drawings, prototypes, records, and performance — not vague claims — to build trust.',
    },
  ] satisfies readonly AboutPrinciple[],
} as const;

export const aboutStages = {
  eyebrow: 'From first walk to first monsoon',
  title: 'Seven stages, with the right question asked at each one.',
  note:
    'The process is deliberately front-loaded: coordination is cheaper on paper than under a poured slab.',
  stages: [
    {
      index: '01',
      title: 'Site walk',
      question: 'What does this piece of land already tell us?',
      description:
        'Study access, climate, neighbours, soil, regulation, water, and what the site already does well.',
    },
    {
      index: '02',
      title: 'Brief and feasibility',
      question: 'What does life here actually need?',
      description:
        'Map the brief, routines, priorities, budget, and the decisions that are still open.',
    },
    {
      index: '03',
      title: 'Concept and section',
      question: 'Where do light, air and load want to go?',
      description:
        'Compare plans and sections against daylight, ventilation, structure, movement, and cost.',
    },
    {
      index: '04',
      title: 'Coordinated drawings',
      question: 'Does every system agree with every other?',
      description:
        'Bring architecture, structure, services, interiors, and specifications into one single information set.',
    },
    {
      index: '05',
      title: 'Costing and approvals',
      question: 'What does this really cost, and what will be permitted?',
      description:
        'Sequence procurement, labour, approvals, mock-ups, and quality checks before site pressure rises.',
    },
    {
      index: '06',
      title: 'Construction',
      question: 'Is what we drew what is being built?',
      description:
        'Record progress, inspect concealed work, resolve junctions, and keep the design team close to execution.',
    },
    {
      index: '07',
      title: 'Handover and first monsoon',
      question: 'Does it perform in the season that tests it?',
      description:
        'Commission the building, close defects, explain maintenance, and review performance after occupation.',
    },
  ] satisfies readonly AboutStage[],
} as const;

export const aboutStudio = {
  eyebrow: 'Studio & Workshop',
  title: 'Design intent is only useful when the site can carry it.',
  body: [
    'Too many buildings are drawn by one team, engineered by another, priced by a third, and interpreted on site by a fourth. Each handoff loses context. We built ASTHIWAR to keep the reasons behind a decision visible to the people responsible for delivering it.',
    'Integration does not mean one idea goes unchallenged. It means architecture, structure, cost, climate, and craft can challenge each other early — while change is still useful and affordable.',
  ],
  image: {
    src: '/images/workshop.jpg',
    alt: 'Sunlit interior of the studio workshop with natural timber and plaster finishes',
  },
  location: 'Coimbatore, Tamil Nadu',
  address: 'To be confirmed',
  team: 'To be confirmed',
} as const;

export const aboutCta = {
  title: 'Meet the practice.',
  body: 'Tell us about your project, your site and what you want to build.',
  buttonLabel: 'Start a project',
  buttonHref: '/contact',
} as const;
