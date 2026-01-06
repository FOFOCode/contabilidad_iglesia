import { Header } from "@/components/layout";
import { MultipleEgresoForm } from "./MultipleEgresoForm";
import { obtenerDatosFormularioEgreso } from "@/app/actions/operaciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

export default async function MultipleEgresoPage() {
  const [datos, usuario, { permisos }] = await Promise.all([
    obtenerDatosFormularioEgreso(),
    getUsuarioActual(),
    obtenerMisPermisos(),
  ]);

  if (!usuario) {
    redirect("/login");
  }

  // Validar permiso de crear egresos
  const permisosEgresos = permisos.egresos || {
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  };

  if (!permisosEgresos.puedeCrear) {
    redirect("/dashboard/egresos");
  }

  if (
    datos.tiposGasto.length === 0 ||
    datos.cajas.length === 0 ||
    datos.monedas.length === 0
  ) {
    redirect("/dashboard/configuracion/inicio");
  }

  return (
    <div className="min-h-screen">
      <Header
        title="📤 Múltiple Egreso"
        subtitle="Registrar varios egresos a la vez"
        backUrl="/dashboard/egresos"
      />
      <MultipleEgresoForm
        tiposGasto={datos.tiposGasto}
        cajas={datos.cajas}
        monedas={datos.monedas}
        usuarioId={usuario.id}
      />
    </div>
  );
}
