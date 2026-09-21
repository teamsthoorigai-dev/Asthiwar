import type { MetadataRoute } from 'next';
import { projects } from '@/data/site';

const SITE_URL = 'https://asthiwar.com';

const publicPaths = [
  '/',
  '/studio',
  '/about',
  '/contact',
  '/cost-calculator',
  '/insights',
  '/projects',
  '/services',
  '/sustainable-construction',
  '/terms',
  '/privacy',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = publicPaths.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  const projectEntries = projects.map((project) => ({
    url: new URL(`/projects/${project.slug}`, SITE_URL).toString(),
  }));

  return [...staticEntries, ...projectEntries];
}
