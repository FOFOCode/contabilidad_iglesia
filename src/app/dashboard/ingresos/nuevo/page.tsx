import { Header } from "@/components/layout";
import { NuevoIngresoForm } from "./NuevoIngresoForm";
import { obtenerDatosFormularioIngreso } from "@/app/actions/operaciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function NuevoIngresoPage() {
  const [datos, usuario] = await Promise.all([
    obtenerDatosFormularioIngreso(),
    getUsuarioActual(),
  ]);

  // Si no hay sesión, redirigir al login
  if (!usuario) {
    redirect("/login");
  }

  // Si no hay datos configurados, redirigir al asistente
  if (
    datos.sociedades.length === 0 ||
    datos.servicios.length === 0 ||
    datos.tiposIngreso.length === 0 ||
    datos.cajas.length === 0 ||
    datos.monedas.length === 0
  ) {
    redirect("/dashboard/configuracion/inicio");
  }

  return (
    <div className="min-h-screen">
      <Header
        title="💵 Nuevo Ingreso"
        subtitle="Registrar un nuevo ingreso al sistema"
      />
      <NuevoIngresoForm
        sociedades={datos.sociedades}
        servicios={datos.servicios}
        tiposIngreso={datos.tiposIngreso}
        cajas={datos.cajas}
        monedas={datos.monedas}
        usuarioId={usuario.id}
      />
    </div>
  );
}
