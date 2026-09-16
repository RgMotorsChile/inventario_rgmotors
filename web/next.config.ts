import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
