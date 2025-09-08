import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // optional, if you want to skip TS errors too:
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
  async rewrites() {
  return [
      {
        source: "/__/auth/:path*",
        destination: "https://ascii-it-54ba2.firebaseapp.com/__/auth/:path*",
      },
    ]
  },
}

export default nextConfig