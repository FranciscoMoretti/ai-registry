import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["shiki"],
  reactCompiler: true,
  // Next 16.2.3 omits ImageResponse's lazy renderer import from the trace.
  // Keep its JS, WASM and font assets in OG functions deployed to Vercel.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": [
      "./node_modules/next/dist/compiled/@vercel/og/**/*",
    ],
    "/api/og/*": ["./node_modules/next/dist/compiled/@vercel/og/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "models.dev",
        pathname: "/logos/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
