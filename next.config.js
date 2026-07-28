/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/accelerators': ['./accelerators/**'],
      '/api/ideas/[id]/promote': ['./accelerators/**'],
      '/accelerators': ['./accelerators/**'],
    },
  },
};

module.exports = nextConfig;
