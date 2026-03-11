import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,

  // Enable gzip/brotli compression on server responses
  compress: true,

  // Evita bundlear paquetes server-only en el bundle de Next.js.
  // bcryptjs (hashing) y pg (driver nativo de PostgreSQL) son exclusivos del servidor
  // y no deben incluirse en el bundle — reduce tamaño y tiempo de cold start.
  serverExternalPackages: ["bcryptjs", "pg"],

  // Tree-shake large packages automatically
  experimental: {
    optimizePackageImports: [
      "@supabase/supabase-js",
      "@supabase/ssr",
      "@prisma/client",
    ],
  },
};

export default nextConfig;
