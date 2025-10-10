import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // optional, if you want to skip TS errors too:
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
}

export default nextConfig
