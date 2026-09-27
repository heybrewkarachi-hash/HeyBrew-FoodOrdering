import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  async headers() {
    return [
      {
        source: "/orders/:id/receipt",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/orders/:id/kitchen",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
