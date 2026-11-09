import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode demo menjadi bawaan agar frontend langsung jalan tanpa backend dan tanpa .env.local.
  // Untuk mode API, isi NEXT_PUBLIC_USE_MOCK=false secara eksplisit.
  env: {
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK ?? 'true',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL ?? 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
};

// Development and production must not overwrite each other's Webpack chunks.
export default phase => ({
  ...nextConfig,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
});
