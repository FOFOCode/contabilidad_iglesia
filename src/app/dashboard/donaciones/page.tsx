import { Header } from "@/components/layout";
import { DonacionesClient } from "./DonacionesClient";
import {
  obtenerDonaciones,
  obtenerDatosFormularioDonacion,
} from "@/app/actions/donaciones";

export default async function DonacionesPage() {
  const [donaciones, datosForm] = await Promise.all([
    obtenerDonaciones(),
    obtenerDatosFormularioDonacion(),
  ]);

  // Transformar datos para el cliente (convertir Decimal a number y eliminar campos innecesarios)
  const donacionesData = donaciones.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    telefono: d.telefono,
    fecha: d.fecha,
    monto: Number(d.monto),
    comentario: d.comentario,
    tipoOfrenda: { id: d.tipoOfrenda.id, nombre: d.tipoOfrenda.nombre },
    moneda: {
      id: d.moneda.id,
      codigo: d.moneda.codigo,
      simbolo: d.moneda.simbolo,
    },
    caja: { nombre: d.caja.nombre },
    usuario: d.usuario,
  }));

  // Transformar tipos de ofrenda para el cliente
  const tiposOfrendaData = datosForm.tiposOfrenda.map((t) => ({
    id: t.id,
    nombre: t.nombre,
  }));

  // Transformar monedas para el cliente
  const monedasData = datosForm.monedas.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    simbolo: m.simbolo,
    esPrincipal: m.esPrincipal,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="🎁 Donaciones"
        subtitle="Registro de donaciones recibidas"
      />
      <DonacionesClient
        donaciones={donacionesData}
        tiposOfrenda={tiposOfrendaData}
        monedas={monedasData}
        tieneCajaGeneral={!!datosForm.cajaGeneral}
      />
    </div>
  );
}
