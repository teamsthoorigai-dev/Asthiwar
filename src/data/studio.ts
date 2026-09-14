export type TeamMember = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly designation: string;
  readonly isFounder?: boolean;
  readonly image: {
    readonly src: string;
    readonly alt: string;
  };
  readonly bio?: string;
  readonly expertise?: readonly string[];
};

export type StudioOffice = {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly coordinates: string;
  readonly cadRef: string;
  readonly mapUrl: string;
  readonly embedSrc: string;
  readonly roadAxis: string;
  readonly landmark: string;
};

export const studioPage = {
  profile: {
    eyebrow: 'ASTHIWAR – STUDIO PROFILE',
    heading: 'Designing with Purpose. Rooted in Context. Evolving with Time.',
    paragraphs: [
      `At Asthiwar, We believe a home should be built around the way you live — not the other way around.
We understand your lifestyle, listen to what you truly need, through meaningful conversations and create spaces where living gets interesting. Our approaches are practical, personal, and sustainable.`,
      `From thoughtful planning to responsible materials and energy-efficient design, we build homes that feel right today — and remain right for years to come.
We craft every detail of your home so it tells a story worth whispering about.`,
    ],
    heroImage: {
      src: '/images/studio/asthiwar-studio.jpg',
      alt: 'ASTHIWAR architecture and structural engineering studio workshop interior in Coimbatore with physical models and drafting tables',
      caption: ['ASTHIWAR / DESIGN & EXECUTION STUDIO', 'COIMBATORE & VIRUDHUNAGAR · TAMIL NADU'] as const,
    },
    stats: [
      { value: 2025, label: 'Aether Milestone' },
      { value: 2026, label: 'Trivara Milestone' },
      { value: 3, pad: 2, label: 'Studio & Regional Hubs' },
      { value: 750, suffix: '+', label: 'Quality Checklist Points' },
    ] as const,
  },

  team: {
    eyebrow: 'CO-FOUNDERS',
    executionEyebrow: 'TEAM',
    heading: 'The Skill & Soul Behind Our Projects',
    lead: 'A multidisciplinary practice uniting structural rigor, urban sensitivity, and precision on-site execution.',
    principalsHeading: 'Owners & Principals',
    teamHeading: 'Site Execution & Coordination',

    // Top Row: Owners (like unknownarchitects.in/team)
    principals: [
      {
        id: 'akileshwaran',
        name: 'Akileshwaran V R R',
        role: 'Structural Engineer',
        designation: 'Structural Engineer',
        isFounder: true,
        image: {
          src: '/images/studio/akileshwaran.jpg',
          alt: 'Akileshwaran V R R — Structural Engineer and Owner',
        },
        bio: 'Leading structural engineering discipline, load-path integrity, and practice direction across all ASTHIWAR projects.',
      },
      {
        id: 'arthiya',
        name: 'Arthiya C N',
        role: 'Urban Designer',
        designation: 'Urban Designer',
        isFounder: true,
        image: {
          src: '/images/studio/arthiya.jpg',
          alt: 'Arthiya C N — Urban Designer and Co-Owner',
        },
        bio: 'Directing spatial philosophy, urban contextual integration, and climate-responsive architecture.',
      },
    ] satisfies readonly TeamMember[],

    // Lower Row: Team / Execution (like unknownarchitects.in/team lower grid)
    executionTeam: [
      {
        id: 'gowtham',
        name: 'Gowtham Chakravarthy',
        role: 'Site Execution Engineer',
        designation: 'Site Execution Engineer',
        isFounder: false,
        image: {
          src: '/images/studio/gowtham.jpg',
          alt: 'Gowtham Chakravarthy — Site Execution Engineer',
        },
        bio: 'Overseeing on-site construction execution, material quality control, and structural craftsmanship.',
      },
    ] satisfies readonly TeamMember[],
  },

  offices: {
    eyebrow: 'STUDIO & REGIONAL HUBS',
    heading: 'Where We Practice & Build',
    description:
      'Explore our studio workspaces in Coimbatore and our regional execution hub in Virudhunagar. Click the architectural line-art map to reveal the live interactive Google Map.',
    locations: [
      {
        id: 'cbe-1',
        name: 'Coimbatore Studio 1 — Nehru Nagar East',
        region: 'Airport Corridor / Avinashi Axis',
        address: 'Asthiwar, Nehru Nagar East',
        city: 'Coimbatore',
        state: 'Tamil Nadu 641014',
        coordinates: '11°02\'38" N, 77°01\'52" E',
        cadRef: 'CBE-ST-01 // AVINASHI-AXIS',
        roadAxis: 'Avinashi Road (NH544) Corridor',
        landmark: 'Near Coimbatore International Airport',
        mapUrl: 'https://maps.app.goo.gl/7mhRkkSsgcc2r5Er6?g_st=ic',
        embedSrc:
          'https://maps.google.com/maps?q=Zubenel+Group,+Zubenel+group,+East,+Nehru+Nagar+West,+Coimbatore,+Tamil+Nadu+641014&t=&z=15&ie=UTF8&iwloc=&output=embed',
      },
      {
        id: 'cbe-2',
        name: 'Coimbatore Studio 2 — Venkatapuram',
        region: 'GCT Sector / Thadagam Axis',
        address: 'Asthiwar, 30, Amman Kovil Street, GCT Post, Venkatapuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu 641013',
        coordinates: '11°01\'18" N, 76°56\'24" E',
        cadRef: 'CBE-ST-02 // GCT-THADAGAM',
        roadAxis: 'Thadagam Road & GCT Campus Belt',
        landmark: 'GCT Post, Venkatapuram',
        mapUrl: 'https://maps.app.goo.gl/njLRRn3PAk5nmbTc6?g_st=ic',
        embedSrc:
          'https://maps.google.com/maps?q=Lakshmi+%26+Co,+30,+Amman+Kovil+Street,+GCT+Post,+Venkatapuram,+Venkitta+Puram,+Coimbatore,+Tamil+Nadu+641013&t=&z=15&ie=UTF8&iwloc=&output=embed',
      },
      {
        id: 'virudhunagar',
        name: 'Virudhunagar Regional Studio',
        region: 'Southern Tamil Nadu Hub',
        address: 'Asthiwar,41, Puluganoorani Road (Opp to Old Bus Stand)',
        city: 'Virudhunagar',
        state: 'Tamil Nadu 626001',
        coordinates: '09°35\'22" N, 77°57\'12" E',
        cadRef: 'VNR-ST-01 // NH44-SOUTHERN',
        roadAxis: 'Madurai – Tirunelveli Axis (NH44)',
        landmark: 'Opposite to Old Bus Stand',
        mapUrl: 'https://maps.app.goo.gl/7fpatmnGNRfFLZYn7?g_st=ic',
        embedSrc:
          'https://maps.google.com/maps?q=9.5894522,77.9532706&t=&z=15&ie=UTF8&iwloc=&output=embed',
      },
    ] satisfies readonly StudioOffice[],
  },
} as const;
