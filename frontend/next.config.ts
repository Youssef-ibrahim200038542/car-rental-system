import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Car photos come from the Laravel backend (/storage uploads, /images seeds).
    // Those are local IPs, which the optimizer refuses by default, so <Image>
    // tags pointing at the backend are marked `unoptimized`.
    remotePatterns: [
      new URL("http://127.0.0.1:8000/**"),
      new URL("http://localhost:8000/**"),
    ],
  },
};

export default nextConfig;
