import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": [
      "./prisma/**/*",
      "./scripts/**/*",
      "./node_modules/prisma/**/*",
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
