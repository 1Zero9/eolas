const { version } = require('./package.json');
const commitSha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'dev').slice(0, 7);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/accelerators': ['./accelerators/**'],
      '/api/ideas/[id]/promote': ['./accelerators/**'],
      '/accelerators': ['./accelerators/**'],
    },
  },
};

module.exports = nextConfig;
