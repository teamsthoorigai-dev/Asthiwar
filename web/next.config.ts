import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
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
