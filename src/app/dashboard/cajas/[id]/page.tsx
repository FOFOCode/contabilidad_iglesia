import { notFound } from "next/navigation";
import { obtenerDetalleCaja } from "@/app/actions/operaciones";
import { CajaDetalleClient } from "./CajaDetalleClient";

interface CajaDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function CajaDetallePage({
  params,
}: CajaDetallePageProps) {
  const { id } = await params;
  const datos = await obtenerDetalleCaja(id);

  if (!datos) {
    notFound();
  }

  const {
    caja,
    ingresos,
    ingresosSecundarios,
    egresos,
    donaciones,
    diezmosFiliales,
    egresosFiliales,
    saldos,
    monedas,
  } = datos;

  // Arrays base para los movimientos
  let movimientosBase: Array<{
    id: string;
    fecha: Date;
    tipo: "ingreso" | "egreso";
    concepto: string;
    esSecundario: boolean;
    cajaPrincipal: { id: string; nombre: string } | null;
    origen: "ingreso" | "egreso" | "donacion" | "diezmoFilial" | "egresoFilial";
    montos: {
      monto: number;
      monedaId: string;
      monedaCodigo: string;
      monedaSimbolo: string;
    }[];
  }> = [
    ...ingresos.map((ing) => ({
      id: ing.id,
      fecha: ing.fechaRecaudacion,
      tipo: "ingreso" as const,
      concepto: `${ing.tipoIngreso.nombre} - ${ing.sociedad.nombre}`,
      esSecundario: false,
      cajaPrincipal: null as { id: string; nombre: string } | null,
      origen: "ingreso" as const,
      montos: ing.montos.map((m) => ({
        monto: m.monto,
        monedaId: m.monedaId,
        monedaCodigo: m.moneda.codigo,
        monedaSimbolo: m.moneda.simbolo,
      })),
    })),
    ...ingresosSecundarios.map((ing) => ({
      id: ing.id,
      fecha: ing.fechaRecaudacion,
      tipo: "ingreso" as const,
      concepto: `${ing.tipoIngreso.nombre} - ${ing.sociedad.nombre}`,
      esSecundario: true,
      cajaPrincipal: ing.cajaPrincipal,
      origen: "ingreso" as const,
      montos: ing.montos.map((m) => ({
        monto: m.monto,
        monedaId: m.monedaId,
        monedaCodigo: m.moneda.codigo,
        monedaSimbolo: m.moneda.simbolo,
      })),
    })),
    ...donaciones.map((don) => ({
      id: don.id,
      fecha: don.fecha,
      tipo: "ingreso" as const,
      concepto: `Donación: ${don.nombre} - ${don.tipoOfrenda.nombre}`,
      esSecundario: false,
      cajaPrincipal: null as { id: string; nombre: string } | null,
      origen: "donacion" as const,
      montos: [
        {
          monto: don.monto,
          monedaId: don.monedaId,
          monedaCodigo: don.moneda.codigo,
          monedaSimbolo: don.moneda.simbolo,
        },
      ],
    })),
    ...egresos.map((eg) => ({
      id: eg.id,
      fecha: eg.fechaSalida,
      tipo: "egreso" as const,
      concepto: eg.descripcionGasto || eg.tipoGasto.nombre,
      esSecundario: false,
      cajaPrincipal: null as { id: string; nombre: string } | null,
      origen: "egreso" as const,
      montos: [
        {
          monto: eg.monto,
          monedaId: eg.monedaId,
          monedaCodigo: eg.moneda.codigo,
          monedaSimbolo: eg.moneda.simbolo,
        },
      ],
    })),
  ];

  // Si es la caja "Filiales" real, agregar los movimientos de filiales al array principal
  if (caja.nombre === "Filiales" && !caja.esGeneral) {
    const movimientosFiliales = [
      ...diezmosFiliales.map((dz) => ({
        id: `dz-${dz.id}`,
        fecha: new Date(dz.anio, dz.mes - 1, 1),
        tipo: "ingreso" as const,
        concepto: `Diezmo: ${dz.filial.nombre} (${dz.mes}/${dz.anio})`,
        esSecundario: false,
        cajaPrincipal: null as { id: string; nombre: string } | null,
        origen: "diezmoFilial" as const,
        montos: [
          {
            monto: dz.monto,
            monedaId: dz.monedaId,
            monedaCodigo: dz.moneda.codigo,
            monedaSimbolo: dz.moneda.simbolo,
          },
        ],
      })),
      ...egresosFiliales.map((eg) => ({
        id: `ef-${eg.id}`,
        fecha: eg.fechaSalida,
        tipo: "egreso" as const,
        concepto: `Egreso Filial: ${eg.tipoGasto.nombre}${
          eg.descripcionGasto ? ` - ${eg.descripcionGasto}` : ""
        }`,
        esSecundario: false,
        cajaPrincipal: null as { id: string; nombre: string } | null,
        origen: "egresoFilial" as const,
        montos: [
          {
            monto: eg.monto,
            monedaId: eg.monedaId,
            monedaCodigo: eg.moneda.codigo,
            monedaSimbolo: eg.moneda.simbolo,
          },
        ],
      })),
    ];
    
    movimientosBase.push(...movimientosFiliales);
  }

  const movimientos = movimientosBase.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Movimientos de filiales (separados para mostrar en otra sección)
  // Solo mostrar como referencia si NO estamos en la caja virtual de filiales 
  // NI en la caja real de "Filiales" (porque allí ya se muestran en el array principal)
  const movimientosFiliales =
    caja.id !== "virtual-filiales" && !(caja.nombre === "Filiales" && !caja.esGeneral)
      ? [
          ...diezmosFiliales.map((dz) => ({
            id: dz.id,
            fecha: new Date(dz.anio, dz.mes - 1, 1), // Crear fecha virtual del primer día del mes
            tipo: "ingreso" as const,
            concepto: `Diezmo: ${dz.filial.nombre} (${dz.mes}/${dz.anio})`,
            filial: dz.filial.nombre,
            origen: "diezmoFilial" as const,
            montos: [
              {
                monto: dz.monto,
                monedaId: dz.monedaId,
                monedaCodigo: dz.moneda.codigo,
                monedaSimbolo: dz.moneda.simbolo,
              },
            ],
          })),
          ...egresosFiliales.map((eg) => ({
            id: eg.id,
            fecha: eg.fechaSalida,
            tipo: "egreso" as const,
            concepto: `Egreso General: ${eg.tipoGasto.nombre}${
              eg.descripcionGasto ? ` - ${eg.descripcionGasto}` : ""
            }`,
            filial: "Caja Filiales",
            origen: "egresoFilial" as const,
            montos: [
              {
                monto: eg.monto,
                monedaId: eg.monedaId,
                monedaCodigo: eg.moneda.codigo,
                monedaSimbolo: eg.moneda.simbolo,
              },
            ],
          })),
        ].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      : [];

  // Si estamos en caja virtual de filiales, agregar los movimientos al array principal
  if (caja.id === "virtual-filiales") {
    movimientos.push(
      ...diezmosFiliales.map((dz) => ({
        id: dz.id,
        fecha: new Date(dz.anio, dz.mes - 1, 1),
        tipo: "ingreso" as const,
        concepto: `Diezmo: ${dz.filial.nombre} (${dz.mes}/${dz.anio})`,
        esSecundario: false,
        cajaPrincipal: null as { id: string; nombre: string } | null,
        origen: "diezmoFilial" as const,
        montos: [
          {
            monto: dz.monto,
            monedaId: dz.monedaId,
            monedaCodigo: dz.moneda.codigo,
            monedaSimbolo: dz.moneda.simbolo,
          },
        ],
      })),
      ...egresosFiliales.map((eg) => ({
        id: eg.id,
        fecha: eg.fechaSalida,
        tipo: "egreso" as const,
        concepto: `Egreso General: ${eg.tipoGasto.nombre}${
          eg.descripcionGasto ? ` - ${eg.descripcionGasto}` : ""
        }`,
        esSecundario: false,
        cajaPrincipal: null as { id: string; nombre: string } | null,
        origen: "egresoFilial" as const,
        montos: [
          {
            monto: eg.monto,
            monedaId: eg.monedaId,
            monedaCodigo: eg.moneda.codigo,
            monedaSimbolo: eg.moneda.simbolo,
          },
        ],
      }))
    );
    movimientos.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

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
      movimientosFiliales={movimientosFiliales}
      saldos={saldos}
      monedas={monedas}
    />
  );
}
