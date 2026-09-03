export type Project = {
  slug: string;
  title: string;
  location: string;
  type: 'Residence' | 'Interior' | 'Workplace' | 'To be confirmed';
  category:
    | 'Residential'
    | 'Commercial'
    | 'Hospitality'
    | 'Institutional'
    | 'Renovation'
    | 'To be confirmed';
  area: string;
  year: string;
  status: 'Completed' | 'In progress' | 'To be confirmed';
  image: string;
  imageAlt: string;
  /** Hover gallery on the archive grid. Placeholder frames until real shoots land. */
  gallery?: string[];
  summary: string;
  overview: string;
  challenge: string;
  approach: string;
  materials: string[];
  timeline: Array<{ phase: string; duration: string; note: string }>;
  hasPage?: boolean;
};

export const projects: Project[] = [
  {
    slug: 'courtyard-residence',
    title: 'Project 01',
    hasPage: false,
    location: 'Location to be confirmed',
    type: 'To be confirmed',
    category: 'To be confirmed',
    area: 'Area to be confirmed',
    year: 'Year to be confirmed',
    status: 'To be confirmed',
    image: '/images/courtyard.jpg',
    gallery: [
      '/images/courtyard.jpg',
      '/images/asthivar-residence.jpg',
      '/images/lime-plaster.jpg',
      '/images/jaali.jpg',
    ],
    imageAlt: 'Contemporary residence arranged around a planted courtyard',
    summary:
      'Project name, location, type, area and status will be published after ASTHIWAR confirms the approved information.',
    overview:
      'The verified project overview will be added after the brief and project information are approved for publication.',
    challenge: 'Project challenge and client brief to be confirmed.',
    approach: 'Design, engineering and construction approach to be confirmed.',
    materials: ['Material information to be confirmed'],
    timeline: [
      {
        phase: 'Programme',
        duration: 'To be confirmed',
        note: 'Verified project stages and timeline will be added when available.',
      },
    ],
  },
  {
    slug: 'jaali-house',
    title: 'Project 02',
    hasPage: true,
    location: 'Location to be confirmed',
    type: 'To be confirmed',
    category: 'To be confirmed',
    area: 'Area to be confirmed',
    year: 'Year to be confirmed',
    status: 'To be confirmed',
    image: '/images/jaali.jpg',
    gallery: [
      '/images/jaali.jpg',
      '/images/asthivar-villa.jpg',
      '/images/materials.jpg',
      '/images/courtyard.jpg',
    ],
    imageAlt: 'Contemporary building with a warm brick screen',
    summary:
      'Project name, location, type, area and status will be published after ASTHIWAR confirms the approved information.',
    overview:
      'The verified project overview will be added after the brief and project information are approved for publication.',
    challenge: 'Project challenge and client brief to be confirmed.',
    approach: 'Design, engineering and construction approach to be confirmed.',
    materials: ['Material information to be confirmed'],
    timeline: [
      {
        phase: 'Programme',
        duration: 'To be confirmed',
        note: 'Verified project stages and timeline will be added when available.',
      },
    ],
  },
  {
    slug: 'lime-plaster-apartment',
    title: 'Project 03',
    hasPage: false,
    location: 'Location to be confirmed',
    type: 'To be confirmed',
    category: 'To be confirmed',
    area: 'Area to be confirmed',
    year: 'Year to be confirmed',
    status: 'To be confirmed',
    image: '/images/lime-plaster.jpg',
    gallery: [
      '/images/lime-plaster.jpg',
      '/images/workshop.jpg',
      '/images/sustainable.jpg',
      '/images/asthivar-residence.jpg',
    ],
    imageAlt: 'Interior with soft mineral plaster and timber joinery',
    summary:
      'Project name, location, type, area and status will be published after ASTHIWAR confirms the approved information.',
    overview:
      'The verified project overview will be added after the brief and project information are approved for publication.',
    challenge: 'Project challenge and client brief to be confirmed.',
    approach: 'Design, engineering and construction approach to be confirmed.',
    materials: ['Material information to be confirmed'],
    timeline: [
      {
        phase: 'Programme',
        duration: 'To be confirmed',
        note: 'Verified project stages and timeline will be added when available.',
      },
    ],
  },
  {
    slug: 'workshop-office',
    title: 'Project 04',
    hasPage: false,
    location: 'Location to be confirmed',
    type: 'To be confirmed',
    category: 'To be confirmed',
    area: 'Area to be confirmed',
    year: 'Year to be confirmed',
    status: 'To be confirmed',
    image: '/images/workshop.jpg',
    gallery: [
      '/images/workshop.jpg',
      '/images/materials.jpg',
      '/images/asthivar-villa.jpg',
      '/images/hero.jpg',
    ],
    imageAlt: 'Contemporary building with a deep shaded facade',
    summary:
      'Project name, location, type, area and status will be published after ASTHIWAR confirms the approved information.',
    overview:
      'The verified project overview will be added after the brief and project information are approved for publication.',
    challenge: 'Project challenge and client brief to be confirmed.',
    approach: 'Design, engineering and construction approach to be confirmed.',
    materials: ['Material information to be confirmed'],
    timeline: [
      {
        phase: 'Programme',
        duration: 'To be confirmed',
        note: 'Verified project stages and timeline will be added when available.',
      },
    ],
  },
];

export type Service = {
  slug: string;
  index: string;
  title: string;
  short: string;
  description: string;
  capabilities: string[];
  process: string[];
};

export const services: Service[] = [
  {
    slug: 'architecture',
    index: '01',
    title: 'Architecture',
    short: 'Designing spaces with clarity, context and purpose.',
    description: 'Designing spaces with clarity, context and purpose.',
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
  },
  {
    slug: 'interiors',
    index: '02',
    title: 'Interior',
    short: 'Crafting interiors that elevate everyday experiences.',
    description: 'Crafting interiors that elevate everyday experiences.',
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
  },
  {
    slug: 'construction',
    index: '03',
    title: 'Construction',
    short: 'Precise execution with quality and transparency.',
    description: 'Precise execution with quality and transparency.',
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
  },
  {
    slug: 'structural',
    index: '04',
    title: 'Structural',
    short: 'Engineering-led structural solutions built for lasting strength and quality.',
    description: 'Engineering-led structural solutions built for lasting strength and quality.',
    capabilities: [
      'Structural concept design',
      'Analysis and detailing',
      'Existing-building assessment',
      'Site review / consulting',
    ],
    process: ['Map the loads', 'Simplify the grid', 'Detail buildable junctions', 'Verify on site'],
  },
  {
    slug: 'green-building',
    index: '05',
    title: 'Green Building',
    short: 'Sustainable methods for healthier spaces and a better future.',
    description: 'Sustainable methods for healthier spaces and a better future.',
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
  },
];

export const insights = [
  {
    slug: 'architecture-placeholder',
    category: 'Architecture',
    title: 'Architecture article to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Approved architecture insight content will be published here when available.',
  },
  {
    slug: 'sustainable-building-placeholder',
    category: 'Sustainable Building',
    title: 'Sustainable building article to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Approved sustainable building insight content will be published here when available.',
  },
  {
    slug: 'materials-placeholder',
    category: 'Materials',
    title: 'Materials article to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Approved materials insight content will be published here when available.',
  },
  {
    slug: 'construction-placeholder',
    category: 'Construction',
    title: 'Construction article to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Approved construction insight content will be published here when available.',
  },
  {
    slug: 'design-placeholder',
    category: 'Design',
    title: 'Design article to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Approved design insight content will be published here when available.',
  },
  {
    slug: 'project-insights-placeholder',
    category: 'Project Insights',
    title: 'Project insight to be confirmed',
    date: 'Publication date to be confirmed',
    readTime: 'Read time to be confirmed',
    excerpt: 'Verified project insight content will be published here when available.',
  },
] as const;

export const faqs = [
  {
    question: 'How does the design-build process work?',
    answer:
      'Architecture, engineering and execution are coordinated through one process, from early design to project delivery.',
  },
  {
    question: 'What factors affect construction cost?',
    answer:
      'Location, built-up area, materials, construction quality, structural requirements, design complexity, timeline and sustainable construction choices all affect cost.',
  },
  {
    question: 'Can ASTHIWAR handle architecture and construction together?',
    answer:
      'Yes. ASTHIWAR brings architecture, engineering and execution together through one coordinated process.',
  },
  {
    question: 'What sustainable construction options are available?',
    answer:
      'ASTHIWAR is expanding its offering around natural cooling, low-cement or cement-free construction and green building solutions.',
  },
  {
    question: 'How accurate is the cost calculator?',
    answer:
      'It provides an estimated cost only. Final cost depends on design, specifications, site conditions, materials and project requirements.',
  },
  {
    question: 'How do I start a project with ASTHIWAR?',
    answer: 'Tell us about your project, your site and what you want to build.',
  },
] as const;
