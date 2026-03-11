import { Header } from "@/components/layout";
import dynamic from "next/dynamic";

const ConfiguracionClient = dynamic(() =>
  import("./ConfiguracionClient").then((m) => ({
    default: m.ConfiguracionClient,
  })),
);

const UsuariosConfig = dynamic(() =>
  import("./UsuariosConfig").then((m) => ({ default: m.UsuariosConfig })),
);
import {
  getMonedas,
  getSociedades,
  getTiposServicio,
  getTiposIngreso,
  getTiposGasto,
  getCajas,
} from "@/app/actions/configuraciones";
import {
  obtenerTodosPaises,
  obtenerTodasFiliales,
} from "@/app/actions/filiales";
import { getUsuarioActual } from "@/app/actions/auth";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

// Función helper para serializar Decimal a number
function serializarMonedas(monedas: any[]) {
  return monedas.map((m) => ({
    ...m,
    tasaCambio:
      typeof m.tasaCambio === "object" ? Number(m.tasaCambio) : m.tasaCambio,
  }));
}

export default async function ConfiguracionPage() {
  const usuario = await getUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  const [
    monedasRaw,
    sociedades,
    tiposServicio,
    tiposIngreso,
    tiposGasto,
    cajas,
    paises,
    filiales,
    misPermisos,
  ] = await Promise.all([
    getMonedas(),
    getSociedades(),
    getTiposServicio(),
    getTiposIngreso(),
    getTiposGasto(),
    getCajas(),
    obtenerTodosPaises(),
    obtenerTodasFiliales(),
    obtenerMisPermisos(),
  ]);

  // Obtener permisos de configuración
  const permisosConfig = misPermisos.permisos.configuracion || {
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  };

  // Si no tiene permiso para ver configuración, redirigir
  if (!permisosConfig.puedeVer && !misPermisos.esAdmin) {
    redirect("/dashboard");
  }

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
        paisesData={paises}
        filialesData={filiales}
        permisos={permisosConfig}
      />
    </div>
  );
}
