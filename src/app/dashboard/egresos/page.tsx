import { Header } from "@/components/layout";
import { ListadoEgresosClient } from "./ListadoEgresosClient";
import { obtenerEgresos, obtenerDatosFormularioEgreso } from "@/app/actions/operaciones";

export default async function EgresosPage() {
  const [egresos, datosForm] = await Promise.all([
    obtenerEgresos(),
    obtenerDatosFormularioEgreso(),
  ]);

  // Transformar datos para el cliente
  const egresosData = egresos.map((e) => ({
    id: e.id,
    fechaSalida: e.fechaSalida,
    solicitante: e.solicitante,
    monto: Number(e.monto),
    descripcionGasto: e.descripcionGasto,
    comentario: e.comentario,
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
      />
    </div>
  );
}
