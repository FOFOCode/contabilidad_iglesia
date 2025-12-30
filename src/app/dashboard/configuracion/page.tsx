import { Header } from "@/components/layout";
import { ConfiguracionClient } from "./ConfiguracionClient";
import { UsuariosConfig } from "./UsuariosConfig";
import {
  getMonedas,
  getSociedades,
  getTiposServicio,
  getTiposIngreso,
  getTiposGasto,
  getCajas,
} from "@/app/actions/configuraciones";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

// Función helper para serializar Decimal a number
function serializarMonedas(monedas: any[]) {
  return monedas.map(m => ({
    ...m,
    tasaCambio: typeof m.tasaCambio === 'object' ? Number(m.tasaCambio) : m.tasaCambio
  }));
}

export default async function ConfiguracionPage() {
  const usuario = await getUsuarioActual();
  
  if (!usuario) {
    redirect("/login");
  }

  const [monedasRaw, sociedades, tiposServicio, tiposIngreso, tiposGasto, cajas] = 
    await Promise.all([
      getMonedas(),
      getSociedades(),
      getTiposServicio(),
      getTiposIngreso(),
      getTiposGasto(),
      getCajas(),
    ]);

  // Serializar monedas para evitar errores con Decimal
  const monedas = serializarMonedas(monedasRaw);

  return (
    <div className="min-h-screen">
      <Header
        title="⚙️ Configuración"
        subtitle="Administra los datos base del sistema"
      />
      <ConfiguracionClient
        monedasData={monedas}
        sociedadesData={sociedades}
        tiposServicioData={tiposServicio}
        tiposIngresoData={tiposIngreso}
        tiposGastoData={tiposGasto}
        cajasData={cajas}
      />
    </div>
  );
}
