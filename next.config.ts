import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_BASE_URL_INTERNAL ?? 'http://localhost:4000';

/**
 * None of the files in public/ are content-hashed, so a long cache means: to
 * change a photo, frame, font or video, ship it under a new file name rather
 * than overwriting the old one, or visitors keep seeing what they cached.
 */
const THIRTY_DAYS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Resized photos from /_next/image, kept by the browser (and the image
    // cache) for 30 days instead of the default 4 hours.
    minimumCacheTTL: THIRTY_DAYS,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
  async headers() {
    // Next serves public/ with max-age=0, so a returning visitor revalidates
    // every file one request at a time — all 300 /projects frames included.
    const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    const monthLong = [{ key: 'Cache-Control', value: `public, max-age=${THIRTY_DAYS}` }];
    return [
      // No other site may frame these pages. The admin console could be loaded
      // invisibly inside an attacker's page and its buttons clicked through it.
      // The site embeds maps itself; nothing embeds the site.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
      { source: '/frames/:file*', headers: immutable },
      { source: '/fonts/:file*', headers: immutable },
      // Raw photos and project video, as fetched directly (video posters, the
      // header videos). Resized copies are covered by minimumCacheTTL above.
      { source: '/:folder(Ather|Trevea|images|brand|assembly-layers)/:file*', headers: monthLong },
    ];
  },
  async redirects() {
    return [
      {
        source: '/pricing',
        destination: '/cost-calculator',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
