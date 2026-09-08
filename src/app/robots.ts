import type { MetadataRoute } from 'next';

const SITE_URL = 'https://asthiwar.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
    },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
