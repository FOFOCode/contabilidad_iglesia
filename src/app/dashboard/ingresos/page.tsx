import { Header } from "@/components/layout";
import { ListadoIngresosClient } from "./ListadoIngresosClient";
import {
  obtenerIngresos,
  obtenerDatosFormularioIngreso,
} from "@/app/actions/operaciones";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

export default async function IngresosPage() {
  const [ingresos, datosForm, { permisos }] = await Promise.all([
    obtenerIngresos(),
    obtenerDatosFormularioIngreso(),
    obtenerMisPermisos(),
  ]);

  // Validar permiso de ver ingresos
  const permisosIngresos = permisos.ingresos || {
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  };

  if (!permisosIngresos.puedeVer) {
    redirect("/dashboard");
  }

  // Transformar datos para el cliente - manejo explícito de fechas
  const ingresosData = ingresos.map((i) => ({
    id: i.id,
    // Convertir fecha a string ISO con la zona local incluida para evitar conversión UTC
    fechaRecaudacion: i.fechaRecaudacion.toISOString(),
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
        tiposServicio={datosForm.servicios}
        monedas={datosForm.monedas}
        permisos={permisosIngresos}
      />
    </div>
  );
}
