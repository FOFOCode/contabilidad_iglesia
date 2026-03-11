import { Header } from "@/components/layout";
import dynamic from "next/dynamic";

const ReportesClient = dynamic(() =>
  import("./ReportesClient").then((m) => ({ default: m.ReportesClient })),
);
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

// Función auxiliar para serializar monedas
function serializarMoneda(m: {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activa: boolean;
  esPrincipal: boolean;
  tasaCambio: unknown;
  orden: number;
}) {
  return {
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    simbolo: m.simbolo,
    esPrincipal: m.esPrincipal,
  };
}

export default async function ReportesPage() {
  const usuario = await getUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  const [sociedades, cajas, monedasRaw] = await Promise.all([
    prisma.sociedad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.caja.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  const monedas = monedasRaw.map(serializarMoneda);

  return (
    <div className="min-h-screen">
      <Header
        title="📊 Reportes"
        subtitle="Genera y analiza reportes detallados del sistema"
      />

      <ReportesClient
        sociedades={sociedades}
        cajas={cajas}
        monedas={monedas}
        usuarioActual={usuario}
      />
    </div>
  );
}
