import { Header } from "@/components/layout";
import { ListadoIngresosClient } from "./ListadoIngresosClient";
import { obtenerIngresos, obtenerDatosFormularioIngreso } from "@/app/actions/operaciones";

export default async function IngresosPage() {
  const [ingresos, datosForm] = await Promise.all([
    obtenerIngresos(),
    obtenerDatosFormularioIngreso(),
  ]);

  // Transformar datos para el cliente
  const ingresosData = ingresos.map((i) => ({
    id: i.id,
    fechaRecaudacion: i.fechaRecaudacion,
    comentario: i.comentario,
    sociedad: { nombre: i.sociedad.nombre },
    servicio: { nombre: i.servicio.nombre },
    tipoIngreso: { nombre: i.tipoIngreso.nombre },
    caja: { nombre: i.caja.nombre },
    montos: i.montos.map((m) => ({
      monto: Number(m.monto),
      moneda: {
        id: m.moneda.id,
        codigo: m.moneda.codigo,
        simbolo: m.moneda.simbolo,
      },
    })),
    usuario: i.usuario,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="💵 Ingresos"
        subtitle="Listado de todos los ingresos registrados"
      />
      <ListadoIngresosClient
        ingresos={ingresosData}
        sociedades={datosForm.sociedades}
        tiposIngreso={datosForm.tiposIngreso}
        monedas={datosForm.monedas}
      />
    </div>
  );
}
