import { Header } from "@/components/layout";
import { NuevoEgresoForm } from "./NuevoEgresoForm";
import { obtenerDatosFormularioEgreso } from "@/app/actions/operaciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

export default async function NuevoEgresoPage() {
  const [datos, usuario, { permisos }] = await Promise.all([
    obtenerDatosFormularioEgreso(),
    getUsuarioActual(),
    obtenerMisPermisos(),
  ]);

  // Si no hay sesión, redirigir al login
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

  // Si no hay datos configurados, redirigir al asistente
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
        title="💸 Nuevo Egreso"
        subtitle="Registrar una nueva salida de dinero"
      />
      <NuevoEgresoForm
        tiposGasto={datos.tiposGasto}
        cajas={datos.cajas}
        monedas={datos.monedas}
        usuarioId={usuario.id}
      />
    </div>
  );
}
