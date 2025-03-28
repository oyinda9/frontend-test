import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    workerThreads: true,
    optimizePackageImports: [
      '@react-pdf-viewer/core',
      'pdf-lib'
    ]
  }
};

export default nextConfig;
