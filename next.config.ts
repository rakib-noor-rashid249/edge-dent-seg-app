import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Enables static exports
  basePath: process.env.NODE_ENV === "production" ? '/edge-dent-seg-app' : undefined, // Add your repo name as base path if needed
  images: {
    unoptimized: true, // Optional: for image optimization compatibility in static export
  },
  experimental: {
    browserDebugInfoInTerminal: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

export default nextConfig;
