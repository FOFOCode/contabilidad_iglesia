import { Header } from "@/components/layout";
import { ListadoEgresosClient } from "./ListadoEgresosClient";
import {
  obtenerEgresos,
  obtenerDatosFormularioEgreso,
} from "@/app/actions/operaciones";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

export default async function EgresosPage() {
  const [egresos, datosForm, { permisos }] = await Promise.all([
    obtenerEgresos(),
    obtenerDatosFormularioEgreso(),
    obtenerMisPermisos(),
  ]);

  // Validar permiso de ver egresos
  const permisosEgresos = permisos.egresos || {
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  };

  if (!permisosEgresos.puedeVer) {
    redirect("/dashboard");
  }

  // Transformar datos para el cliente
  const egresosData = egresos.map((e) => ({
    id: e.id,
    fechaSalida: e.fechaSalida,
    solicitante: e.solicitante,
    monto: Number(e.monto),
    descripcionGasto: e.descripcionGasto,
    comentario: e.comentario,
    numeroFactura: e.numeroFactura,
    tipoGasto: { nombre: e.tipoGasto.nombre },
    caja: { nombre: e.caja.nombre },
    moneda: {
      id: e.moneda.id,
      codigo: e.moneda.codigo,
      simbolo: e.moneda.simbolo,
    },
    usuario: e.usuario,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="💸 Egresos"
        subtitle="Listado de todas las salidas de dinero"
      />
      <ListadoEgresosClient
        egresos={egresosData}
        tiposGasto={datosForm.tiposGasto}
        monedas={datosForm.monedas}
        permisos={permisosEgresos}
      />
    </div>
  );
}
