/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Render deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Externalize CommonJS modules that don't bundle well
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig
