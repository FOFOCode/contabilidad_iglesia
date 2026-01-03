import { Header } from "@/components/layout";
import { NuevaDonacionForm } from "./NuevaDonacionForm";
import { obtenerDatosFormularioDonacion } from "@/app/actions/donaciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function NuevaDonacionPage() {
  const [datos, usuario] = await Promise.all([
    obtenerDatosFormularioDonacion(),
    getUsuarioActual(),
  ]);

  // Si no hay sesión, redirigir al login
  if (!usuario) {
    redirect("/login");
  }

  // Si no hay caja general configurada
  if (!datos.cajaGeneral) {
    redirect("/dashboard/configuracion");
  }

  // Si no hay datos configurados
  if (datos.tiposOfrenda.length === 0 || datos.monedas.length === 0) {
    redirect("/dashboard/configuracion/inicio");
  }

  // Transformar tipos de ofrenda para el cliente
  const tiposOfrendaData = datos.tiposOfrenda.map((t) => ({
    id: t.id,
    nombre: t.nombre,
  }));

  // Transformar monedas para el cliente (evitar Decimal)
  const monedasData = datos.monedas.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    simbolo: m.simbolo,
    esPrincipal: m.esPrincipal,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="🎁 Nueva Donación"
        subtitle="Registrar una nueva donación"
      />
      <NuevaDonacionForm
        tiposOfrenda={tiposOfrendaData}
        monedas={monedasData}
        usuarioId={usuario.id}
      />
    </div>
  );
}
