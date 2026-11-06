import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseUrl ? [{ protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https", hostname: supabaseUrl.hostname, pathname: "/storage/v1/object/**" }] : []),
    ],
  },
};

export default nextConfig;
