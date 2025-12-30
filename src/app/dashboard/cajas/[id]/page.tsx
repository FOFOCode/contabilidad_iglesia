import { notFound } from "next/navigation";
import { obtenerDetalleCaja } from "@/app/actions/operaciones";
import { CajaDetalleClient } from "./CajaDetalleClient";

interface CajaDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function CajaDetallePage({ params }: CajaDetallePageProps) {
  const { id } = await params;
  const datos = await obtenerDetalleCaja(id);

  if (!datos) {
    notFound();
  }

  const { caja, ingresos, egresos, saldos, monedas } = datos;

  // Combinar y formatear movimientos
  const movimientos = [
    ...ingresos.map((ing) => ({
      id: ing.id,
      fecha: ing.fechaRecaudacion,
      tipo: "ingreso" as const,
      concepto: `${ing.tipoIngreso.nombre} - ${ing.sociedad.nombre}`,
      montos: ing.montos.map((m) => ({
        monto: m.monto,
        monedaId: m.monedaId,
        monedaCodigo: m.moneda.codigo,
        monedaSimbolo: m.moneda.simbolo,
      })),
    })),
    ...egresos.map((eg) => ({
      id: eg.id,
      fecha: eg.fechaSalida,
      tipo: "egreso" as const,
      concepto: eg.descripcionGasto || eg.tipoGasto.nombre,
      montos: [
        {
          monto: eg.monto,
          monedaId: eg.monedaId,
          monedaCodigo: eg.moneda.codigo,
          monedaSimbolo: eg.moneda.simbolo,
        },
      ],
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const cajaFormateada = {
    id: caja.id,
    nombre: caja.nombre,
    descripcion: caja.descripcion,
    activa: caja.activa,
    esGeneral: caja.esGeneral,
    sociedad: caja.sociedad
      ? { id: caja.sociedad.id, nombre: caja.sociedad.nombre }
      : null,
    tipoIngreso: caja.tipoIngreso
      ? { id: caja.tipoIngreso.id, nombre: caja.tipoIngreso.nombre }
      : null,
  };

  return (
    <CajaDetalleClient
      caja={cajaFormateada}
      movimientos={movimientos}
      saldos={saldos}
      monedas={monedas}
    />
  );
}
