import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Modern formats first; WebP fallback for older browsers.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
