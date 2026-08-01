/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] }
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false }
};

module.exports = nextConfig;
