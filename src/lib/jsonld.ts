import { faqs, type Project, type Service } from '@/data/site';

const SITE_URL = 'https://asthiwar.com';

export type JsonLdValue =
  | boolean
  | number
  | string
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdObject = { [key: string]: JsonLdValue };

/**
 * Organization data contains only verified, site-owned identity values. Contact
 * points and social profiles stay out until their source data is confirmed.
 */
export function getOrganizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ASTHIWAR Design & Build',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/asthiwar-logo-black.png`,
    description:
      'Architecture, engineering and construction in Coimbatore, coordinated through one process.',
  };
}

/**
 * Structured data for the approved ASTHIWAR FAQ content.
 *
 * The source questions and answers remain in `src/data/site.ts`, so the visible
 * accordion and search-engine representation cannot drift apart.
 */
export function getFaqJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Structured data for the five ASTHIWAR disciplines.
 */
export function getServicesJsonLd(serviceList: readonly Service[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: serviceList.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.short,
        provider: {
          '@type': 'Organization',
          name: 'ASTHIWAR',
        },
        serviceType: service.title,
      },
    })),
  };
}

/** Breadcrumbs for a confirmed route identity, independent of placeholder facts. */
export function getProjectBreadcrumbJsonLd(
  project: Pick<Project, 'slug' | 'title'>,
): JsonLdObject {
  const projectUrl = `${SITE_URL}/projects/${project.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Projects',
        item: `${SITE_URL}/projects`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.title,
        item: projectUrl,
      },
    ],
  };
}
