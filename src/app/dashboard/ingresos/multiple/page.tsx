import { Header } from "@/components/layout";
import { MultipleIngresoForm } from "./MultipleIngresoForm";
import { obtenerDatosFormularioIngreso } from "@/app/actions/operaciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function MultipleIngresoPage() {
  const [datos, usuario] = await Promise.all([
    obtenerDatosFormularioIngreso(),
    getUsuarioActual(),
  ]);

  if (!usuario) {
    redirect("/login");
  }

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
        title="💵 Múltiple Ingreso"
        subtitle="Registrar varios ingresos a la vez"
        backUrl="/dashboard/ingresos"
      />
      <MultipleIngresoForm
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
