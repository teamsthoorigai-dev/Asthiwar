import type { Project, Service } from '@/data/site';
import { env } from '@/lib/env';

const baseUrl = env.NEXT_PUBLIC_SITE_URL;

export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export function getLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['GeneralContractor', 'ProfessionalService'],
    '@id': `${baseUrl}/#organization`,
    name: 'ASTHIWAR',
    alternateName: 'Asthiwar Architecture & Construction',
    description:
      'Integrated architecture, structural engineering, interiors, and construction practice based in Coimbatore, Tamil Nadu.',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    image: `${baseUrl}/images/hero.jpg`,
    priceRange: '₹₹₹',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Coimbatore',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '11.0168',
      longitude: '76.9558',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Coimbatore',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Tamil Nadu',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Kerala',
      },
    ],
    knowsAbout: [
      'Architectural Design',
      'Structural Engineering',
      'Sustainable Construction',
      'Interior Architecture',
      'Low-carbon Building Solutions',
      'Passive Cooling Design',
    ],
  };
}

export function getServicesJsonLd(serviceList: ReadonlyArray<Service>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: serviceList.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.description,
        provider: {
          '@id': `${baseUrl}/#organization`,
        },
        serviceType: service.title,
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };
}

export function getProjectJsonLd(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${baseUrl}/projects/${project.slug}#project`,
    name: project.title,
    headline: project.title,
    description: project.summary,
    image: `${baseUrl}${project.image}`,
    url: `${baseUrl}/projects/${project.slug}`,
    creator: {
      '@id': `${baseUrl}/#organization`,
    },
    locationCreated: {
      '@type': 'Place',
      name: project.location,
    },
    genre: project.type,
    keywords: [
      project.type,
      project.category,
      'ASTHIWAR Architecture',
      'Sustainable Architecture',
      'Coimbatore',
    ],
  };
}

export function getFaqJsonLd(faqList: ReadonlyArray<FaqItem>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
