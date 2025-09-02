import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false
};

module.exports = {
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://ascii-it-54ba2.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};


export default nextConfig;
