import type { NextConfig } from 'next';

// Origin the /api proxy forwards to. Reuses API_BASE_URL_INTERNAL so local dev
// proxies to the local Express server and Vercel proxies to Render.
const API_ORIGIN = process.env.API_BASE_URL_INTERNAL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Serves the API from the site's own origin so the SameSite=Lax session
  // cookie stays first-party; without this, admin login fails cross-site.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
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
