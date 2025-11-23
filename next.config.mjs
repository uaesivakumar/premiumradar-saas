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
};

export default nextConfig;
