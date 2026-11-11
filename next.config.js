/** @type {import('next').NextConfig} */
// Set NEXT_PUBLIC_BASE_PATH=/coderama to build for GitHub Pages (scripts/deploy-pages.sh).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
