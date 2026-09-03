export const homeComparisonContent = {
  hero: {
    label: 'Architecture + construction / Coimbatore',
    title: 'We design with the site. We build with the whole picture.',
    body:
      'ASTHIWAR brings architecture, engineering, interiors and construction into one accountable process — creating thoughtful spaces shaped by climate, material and everyday life.',
    primaryAction: { label: 'View projects', href: '/projects' },
    secondaryAction: { label: 'Estimate your project', href: '/cost-calculator' },
    scrollLabel: 'Scroll to enter',
  },
  process: {
    label: 'How we work',
    title: 'A building practice, not a relay race.',
    body:
      'Architecture, structural thinking, interiors and construction stay in one accountable conversation — from the first site walk to seasonal performance after handover.',
    steps: [
      {
        verb: 'Listen',
        body: 'Map the brief, routines, priorities and budget.',
      },
      {
        verb: 'Read',
        body: 'Study access, climate, neighbours, soil and water.',
      },
      {
        verb: 'Test',
        body: 'Compare plans against daylight, structure and cost.',
      },
      {
        verb: 'Coordinate',
        body: 'Bring every discipline into one information set.',
      },
      {
        verb: 'Plan',
        body: 'Sequence procurement, labour, approvals and checks.',
      },
      {
        verb: 'Build',
        body: 'Record progress and keep design close to execution.',
      },
      {
        verb: 'Tune',
        body: 'Commission, close defects, review after occupation.',
      },
    ],
  },
  sustainability: {
    label: 'Sustainable by design',
    title: 'Comfort designed in, before energy is spent.',
    body:
      'Natural cooling, lower-carbon material choices and healthier spaces are considered before mechanical energy is added.',
    action: {
      label: 'Explore sustainable construction',
      href: '/sustainable-construction',
    },
    imageLabel: 'Shade, mass and moving air',
    principles: [
      {
        title: 'Natural cooling',
        body:
          'Orientation, shade depth and cross-ventilation resolved before a machine is asked to fix the temperature.',
        icon: '/icons/natural-cooling.svg',
      },
      {
        title: 'Low-cement construction',
        body:
          'Lower-carbon masonry and mixes specified where the structure allows it, not as an afterthought.',
        icon: '/icons/low-cement.svg',
      },
      {
        title: 'Long-term well-being',
        body:
          'Daylight, air and material honesty measured against how the house feels to live in years later.',
        icon: '/icons/long-term-wellbeing.svg',
      },
      {
        title: 'Environmental responsibility',
        body: 'Water, waste and site impact treated as design constraints from the first sketch.',
        icon: '/icons/environmental-responsibility.svg',
      },
    ],
  },
  projects: {
    label: 'Selected work',
    title: 'Spaces shaped by context, material and intent.',
    action: { label: 'Browse the full archive', href: '/projects' },
  },
  services: {
    label: 'Our services',
    title: 'Five disciplines. One continuous process.',
    body:
      'Architecture, interior, construction, structural engineering and green building brought together through one coordinated process.',
  },
  cost: {
    label: 'Construction cost calculator',
    title: 'Understand your estimated project budget before you begin.',
    figure: 'X,XXX',
    unit: 'Estimated cost per sq.ft.',
    disclaimer:
      'Estimated cost only. Final project cost depends on design, specifications, site conditions, materials and project requirements.',
    action: { label: 'Calculate your cost', href: '/cost-calculator' },
  },
  faq: {
    label: 'Before you begin',
    title: 'Questions before you begin.',
  },
} as const;

