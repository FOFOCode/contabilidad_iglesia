import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

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
      "@tanstack/react-query",
    ],
  },
};

// Bundle Analyzer: ejecutar con ANALYZE=true npm run build
// Genera reportes HTML en .next/analyze/ para identificar dependencias pesadas
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
})(nextConfig);
