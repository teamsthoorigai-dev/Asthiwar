import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_BASE_URL_INTERNAL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
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
