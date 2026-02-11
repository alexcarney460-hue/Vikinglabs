/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  turbopack: {
    // Keep Next from walking up to the workspace root when multiple lockfiles exist
    root: __dirname
  }
}

module.exports = nextConfig;
