import { Header } from "@/components/layout";
import { CajasClient } from "./CajasClient";
import { obtenerCajasConSaldos } from "@/app/actions/operaciones";

export default async function CajasPage() {
  const { cajas, monedas } = await obtenerCajasConSaldos();

  // Transformar datos para el cliente
  const cajasData = cajas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    activa: c.activa,
    sociedad: c.sociedad ? { nombre: c.sociedad.nombre } : null,
    tipoIngreso: c.tipoIngreso ? { nombre: c.tipoIngreso.nombre } : null,
    saldos: c.saldos,
  }));

  const monedasData = monedas.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    simbolo: m.simbolo,
    esPrincipal: m.esPrincipal,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="🗃️ Cajas"
        subtitle="Administra el dinero de cada caja"
      />
      <CajasClient cajas={cajasData} monedas={monedasData} />
    </div>
  );
}
