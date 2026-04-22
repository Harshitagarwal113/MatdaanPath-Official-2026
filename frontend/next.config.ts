import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Since we are deploying static, images might need unoptimized: true if using the next/image component.
  images: {
    unoptimized: true
  }
};

export default nextConfig;

