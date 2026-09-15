export const sustainablePage = {
  hero: {
    eyebrow: 'Sustainability',
    title: 'Sustainable by design',
    body: 'Comfort designed in, before energy is spent.',
    image: {
      src: '/images/sustainable.jpg',
      alt: 'Sunlight passing across a clay brick screen.',
    },
  },
  pillars: [
    {
      slug: 'natural-cooling',
      title: 'Natural cooling',
      statement: 'Comfort begins in plan and section.',
      body:
        'Designing for the natural flow of air to keep interiors cooler and reduce reliance on artificial ventilation.',
      image: {
        src: '/images/jaali.jpg',
        alt: 'A perforated brick screen casting shade across a modern facade.',
      },
    },
    {
      slug: 'low-cement-construction',
      title: 'Low-cement / cement-free construction',
      statement: 'Ask less material to do more useful work.',
      body:
        'Exploring lower-carbon construction methods and material choices while maintaining structural integrity.',
      image: {
        src: '/images/materials.jpg',
        alt: 'Construction material samples and drawings laid out on a work surface.',
      },
    },
    {
      slug: 'green-building',
      title: 'Green building',
      statement: null,
      body:
        'Envelope, daylight, water strategy and material impact reviewed together rather than certified after the fact.',
      image: {
        src: '/images/greenbuilding.png',
        alt: 'A planted courtyard opening to the sky.',
      },
    },
  ],
  note:
    'ASTHIWAR is expanding its offering around natural cooling, low-cement and cement-free construction.',
} as const;
