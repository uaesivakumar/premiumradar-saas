/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Environment variables exposed to browser
  env: {
    UPR_OS_BASE_URL: process.env.UPR_OS_BASE_URL,
  },

  // Redirect /health to /api/health for Cloud Run
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // Reduce cache time for staging environment
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
