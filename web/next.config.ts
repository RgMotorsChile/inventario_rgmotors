import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad del panel. La CSP se limita a directivas que no
 * dependen de nonces (Next inyecta scripts inline): bloquea iframes ajenos
 * (clickjacking), <base> y plugins, y que los formularios posteen fuera.
 */
export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
  async redirects() {
    return [
      { source: "/stock", destination: "/inventario", permanent: false },
      { source: "/catalogo", destination: "/inventario", permanent: false },
      { source: "/categorias", destination: "/inventario", permanent: false },
      { source: "/rastro", destination: "/historial", permanent: false },
      { source: "/movimientos", destination: "/historial", permanent: false },
      { source: "/trabajadores", destination: "/personas", permanent: false },
      { source: "/equipo", destination: "/personas", permanent: false },
    ];
  },
};

export default nextConfig;
