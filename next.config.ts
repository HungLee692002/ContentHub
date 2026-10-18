import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cho phép mở dev server qua tunnel Cloudflare (HMR/_next bị chặn nếu thiếu)
  allowedDevOrigins: ["dev.hunee-kifu.com"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
