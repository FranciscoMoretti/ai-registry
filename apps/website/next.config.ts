import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["shiki"],
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
       "@lobehub/icons",
       "lucide-react"
     ],
    turbopackFileSystemCacheForDev: true,
  }
};

export default nextConfig;
