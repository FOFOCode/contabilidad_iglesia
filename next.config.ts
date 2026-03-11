import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,

  // Enable gzip/brotli compression on server responses
  compress: true,

  // Tree-shake large packages automatically
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr"],
  },
};

export default nextConfig;
