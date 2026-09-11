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
      'At ASTHIWAR, every project begins with a conversation — not just with our clients, but with the site, the culture, the climate, and the unspoken stories a space yearns to tell. We are an integrated Architecture, Structural Engineering, and Construction Studio grounded in the belief that design must not only function and perform, but also evoke emotion and permanence.',
      'Based in Coimbatore and Virudhunagar, Tamil Nadu — our practice spans across residential, commercial, and sustainable typologies, with landmark milestones including Aether (2025) and Trivara (2026). Each project is approached as an opportunity to craft spaces that breathe — spaces that speak softly yet powerfully to those who inhabit them.',
      'Our work is defined by a quiet clarity, where structural honesty, crafted detailing, and sensitive environmental planning take center stage. Whether it is a sunlit residence unfolding around courtyards, or a climate-responsive structure layered with raw textures, we design with deep respect for proportion, light, and generational longevity.',
    ],
    heroImage: {
      src: '/images/studio/asthiwar-studio.jpg',
      alt: 'ASTHIWAR architecture and structural engineering studio workshop interior in Coimbatore with physical models and drafting tables',
      caption: ['ASTHIWAR / DESIGN & EXECUTION STUDIO', 'COIMBATORE & VIRUDHUNAGAR · TAMIL NADU'] as const,
    },
    secondaryHeading: 'We don’t chase trends — we respond to time, place, and people.',
    secondaryParagraphs: [
      'In our studio, architecture is not just about building — it is about slowing down to listen, to sketch with intent, to align aesthetics with structural purpose. We collaborate with regional craftspeople, understanding materials at their rawest, and drawing lasting connections between traditional craftsmanship and contemporary engineering.',
      'Our process is immersive, inclusive, and iterative. Every line we draw is tested against physical site constraints and structural load paths. Founded by Structural Engineer Akileshwaran V R R and Urban Designer Arthiya C N, our leadership unites engineering discipline with humane, climate-conscious spatial planning.',
      'Working alongside on-site engineering leadership spearheaded by Site Execution Engineer Gowtham Chakravarthy, we ensure zero discrepancy between design intent and on-site reality. We are ASTHIWAR. Built for longevity, rooted in Tamil Nadu.',
    ],
    stats: [
      { number: '2025', label: 'Aether Milestone' },
      { number: '2026', label: 'Trivara Milestone' },
      { number: '03', label: 'Studio & Regional Hubs' },
      { number: '100%', label: 'Integrated Design-Build' },
    ] as const,
  },

  team: {
    eyebrow: 'OUR TEAM',
    heading: 'The Skill & Soul Behind Our Projects',
    lead: 'A multidisciplinary practice uniting structural rigor, urban sensitivity, and precision on-site execution.',
    principalsHeading: 'Owners & Principals',
    teamHeading: 'Site Execution & Coordination',
    
    // Top Row: Owners (like unknownarchitects.in/team)
    principals: [
      {
        id: 'akileshwaran',
        name: 'Akileshwaran V R R',
        role: 'Structural Engineer and Owner',
        designation: 'Structural Engineer and Owner',
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
        role: 'Urban Designer and Co owner',
        designation: 'Urban Designer and Co owner',
        isFounder: true,
        image: {
          src: '/images/studio/arthiya.jpg',
          alt: 'Arthiya C N — Urban Designer and Co owner',
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
        name: 'Coimbatore Studio 1 — Nehru Nagar West',
        region: 'Airport Corridor / Avinashi Axis',
        address: 'Zubenel Group, East, Nehru Nagar West',
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
        address: 'Lakshmi & Co, 30, Amman Kovil Street, GCT Post, Venkatapuram',
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
        address: 'Virudhunagar (Coordinates: 9.5894522, 77.9532706)',
        city: 'Virudhunagar',
        state: 'Tamil Nadu 626001',
        coordinates: '09°35\'22" N, 77°57\'12" E',
        cadRef: 'VNR-ST-01 // NH44-SOUTHERN',
        roadAxis: 'Madurai – Tirunelveli Axis (NH44)',
        landmark: 'Virudhunagar Regional Center',
        mapUrl: 'https://maps.app.goo.gl/7fpatmnGNRfFLZYn7?g_st=ic',
        embedSrc:
          'https://maps.google.com/maps?q=9.5894522,77.9532706&t=&z=15&ie=UTF8&iwloc=&output=embed',
      },
    ] satisfies readonly StudioOffice[],
  },
} as const;
