/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ['*'] } },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  // Quick fix: do not fail builds because ESLint isn't installed yet
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
