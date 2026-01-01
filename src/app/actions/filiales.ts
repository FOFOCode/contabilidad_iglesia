"use server";

import { prisma, withRetry } from "@/lib/prisma";

// =====================
// UTILIDADES DE SERIALIZACIÓN
// =====================

// Función auxiliar para serializar monedas (Decimal -> number)
function serializarMoneda(m: {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activa: boolean;
  esPrincipal: boolean;
  tasaCambio: unknown;
  orden: number;
}) {
  return {
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    simbolo: m.simbolo,
    activa: m.activa,
    esPrincipal: m.esPrincipal,
    tasaCambio: Number(m.tasaCambio),
    orden: m.orden,
  };
}

// =====================
// PAÍSES
// =====================

export async function obtenerPaises() {
  return withRetry(() =>
    prisma.pais.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
  );
}

export async function obtenerTodosPaises() {
  return withRetry(() =>
    prisma.pais.findMany({
      orderBy: [{ activo: "desc" }, { orden: "asc" }],
    })
  );
}

export async function crearPais(data: { nombre: string; codigo?: string }) {
  const maxOrden = await prisma.pais.aggregate({ _max: { orden: true } });
  return prisma.pais.create({
    data: {
      nombre: data.nombre,
      codigo: data.codigo || null,
      orden: (maxOrden._max.orden || 0) + 1,
    },
  });
}

export async function actualizarPais(
  id: string,
  data: { nombre?: string; codigo?: string; activo?: boolean; orden?: number }
) {
  return prisma.pais.update({
    where: { id },
    data,
  });
}

export async function eliminarPais(id: string) {
  // Verificar si tiene filiales
  const filiales = await prisma.filial.count({ where: { paisId: id } });
  if (filiales > 0) {
    throw new Error(
      "No se puede eliminar un país con iglesias filiales asignadas"
    );
  }
  return prisma.pais.delete({ where: { id } });
}

// =====================
// FILIALES
// =====================

export async function obtenerFiliales() {
  return withRetry(() =>
    prisma.filial.findMany({
      where: { activa: true },
      include: { pais: true },
      orderBy: { orden: "asc" },
    })
  );
}

export async function obtenerTodasFiliales() {
  return withRetry(() =>
    prisma.filial.findMany({
      include: { pais: true },
      orderBy: [{ activa: "desc" }, { orden: "asc" }],
    })
  );
}

export async function crearFilial(data: {
  nombre: string;
  pastor: string;
  paisId: string;
}) {
  const maxOrden = await prisma.filial.aggregate({ _max: { orden: true } });
  return prisma.filial.create({
    data: {
      nombre: data.nombre,
      pastor: data.pastor,
      paisId: data.paisId,
      orden: (maxOrden._max.orden || 0) + 1,
    },
    include: { pais: true },
  });
}

export async function actualizarFilial(
  id: string,
  data: {
    nombre?: string;
    pastor?: string;
    paisId?: string;
    activa?: boolean;
    orden?: number;
  }
) {
  return prisma.filial.update({
    where: { id },
    data,
    include: { pais: true },
  });
}

export async function eliminarFilial(id: string) {
  // Verificar si tiene diezmos
  const diezmos = await prisma.diezmoFilial.count({ where: { filialId: id } });
  if (diezmos > 0) {
    throw new Error("No se puede eliminar una filial con diezmos registrados");
  }
  return prisma.filial.delete({ where: { id } });
}

// =====================
// DIEZMOS FILIALES (Mini Cajas)
// =====================

interface CrearDiezmoData {
  filialId: string;
  monto: number;
  monedaId: string;
  mes: number;
  anio: number;
  comentario?: string;
  usuarioId: string;
}

export async function crearDiezmoFilial(data: CrearDiezmoData) {
  const diezmo = await prisma.diezmoFilial.create({
    data: {
      filialId: data.filialId,
      monto: data.monto,
      monedaId: data.monedaId,
      mes: data.mes,
      anio: data.anio,
      comentario: data.comentario,
      usuarioId: data.usuarioId,
    },
    include: {
      filial: { include: { pais: true } },
      moneda: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
  });

  // Serializar Decimal a number
  return {
    ...diezmo,
    monto: Number(diezmo.monto),
    moneda: serializarMoneda(diezmo.moneda),
  };
}

export async function crearDiezmosMultiples(diezmos: CrearDiezmoData[]) {
  const resultados = [];
  for (const diezmo of diezmos) {
    const resultado = await crearDiezmoFilial(diezmo);
    resultados.push(resultado);
  }
  return resultados;
}

interface FiltrosDiezmo {
  filialId?: string;
  paisId?: string;
  monedaId?: string;
  mes?: number;
  anio?: number;
}

export async function obtenerDiezmosFiliales(filtros?: FiltrosDiezmo) {
  const diezmos = await prisma.diezmoFilial.findMany({
    where: {
      filialId: filtros?.filialId || undefined,
      filial: filtros?.paisId ? { paisId: filtros.paisId } : undefined,
      monedaId: filtros?.monedaId || undefined,
      mes: filtros?.mes || undefined,
      anio: filtros?.anio || undefined,
    },
    include: {
      filial: { include: { pais: true } },
      moneda: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }, { creadoEn: "desc" }],
  });

  // Serializar Decimales
  return diezmos.map((d) => ({
    ...d,
    monto: Number(d.monto),
    moneda: serializarMoneda(d.moneda),
  }));
}

export async function eliminarDiezmoFilial(id: string) {
  return prisma.diezmoFilial.delete({ where: { id } });
}

// =====================
// EGRESOS FILIALES (Caja General)
// =====================

interface CrearEgresoFilialData {
  fechaSalida: Date;
  solicitante: string;
  monto: number;
  monedaId: string;
  tipoGastoId: string;
  descripcionGasto?: string;
  comentario?: string;
  usuarioId: string;
}

export async function crearEgresoFilial(data: CrearEgresoFilialData) {
  // Validar que hay saldo suficiente
  const saldos = await obtenerSaldoFiliales();
  const saldoMoneda = saldos.find((s) => s.monedaId === data.monedaId);

  if (!saldoMoneda || saldoMoneda.saldo < data.monto) {
    const disponible = saldoMoneda?.saldo || 0;
    const simbolo = saldoMoneda?.monedaSimbolo || "";
    throw new Error(
      `Saldo insuficiente. Disponible: ${simbolo}${disponible.toLocaleString(
        "es-GT",
        { minimumFractionDigits: 2 }
      )}. Intenta egresar: ${simbolo}${data.monto.toLocaleString("es-GT", {
        minimumFractionDigits: 2,
      })}`
    );
  }

  const egreso = await prisma.egresoFilial.create({
    data: {
      fechaSalida: data.fechaSalida,
      solicitante: data.solicitante,
      monto: data.monto,
      monedaId: data.monedaId,
      tipoGastoId: data.tipoGastoId,
      descripcionGasto: data.descripcionGasto,
      comentario: data.comentario,
      usuarioId: data.usuarioId,
    },
    include: {
      moneda: true,
      tipoGasto: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
  });

  // Serializar Decimal a number
  return {
    ...egreso,
    monto: Number(egreso.monto),
    moneda: serializarMoneda(egreso.moneda),
  };
}

interface FiltrosEgresoFilial {
  desde?: Date;
  hasta?: Date;
  monedaId?: string;
  tipoGastoId?: string;
}

export async function obtenerEgresosFiliales(filtros?: FiltrosEgresoFilial) {
  const egresos = await prisma.egresoFilial.findMany({
    where: {
      fechaSalida: {
        gte: filtros?.desde,
        lte: filtros?.hasta,
      },
      monedaId: filtros?.monedaId || undefined,
      tipoGastoId: filtros?.tipoGastoId || undefined,
    },
    include: {
      moneda: true,
      tipoGasto: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
    orderBy: { fechaSalida: "desc" },
  });

  // Serializar Decimales
  return egresos.map((e) => ({
    ...e,
    monto: Number(e.monto),
    moneda: serializarMoneda(e.moneda),
  }));
}

export async function eliminarEgresoFilial(id: string) {
  return prisma.egresoFilial.delete({ where: { id } });
}

// =====================
// SALDOS Y RESUMEN
// =====================

export async function obtenerResumenFiliales() {
  return withRetry(async () => {
    const [filiales, monedas, tiposGasto] = await Promise.all([
      prisma.filial.findMany({
        where: { activa: true },
        include: { pais: true },
        orderBy: { orden: "asc" },
      }),
      prisma.moneda.findMany({
        where: { activa: true },
        orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
      }),
      prisma.tipoGasto.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
      }),
    ]);

    // Obtener todos los diezmos agrupados por filial y moneda
    const diezmosAgrupados = await prisma.diezmoFilial.groupBy({
      by: ["filialId", "monedaId"],
      _sum: { monto: true },
    });

    // Obtener todos los egresos agrupados por moneda
    const egresosAgrupados = await prisma.egresoFilial.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    });

    // Mapas para acceso rápido
    const diezmosMap = new Map<string, number>();
    diezmosAgrupados.forEach((d) => {
      diezmosMap.set(`${d.filialId}-${d.monedaId}`, Number(d._sum.monto || 0));
    });

    const egresosMap = new Map<string, number>();
    egresosAgrupados.forEach((e) => {
      egresosMap.set(e.monedaId, Number(e._sum.monto || 0));
    });

    // Construir resumen por filial (mini cajas)
    const filialesConSaldos = filiales.map((filial) => {
      const saldos = monedas.map((moneda) => {
        const key = `${filial.id}-${moneda.id}`;
        const total = diezmosMap.get(key) || 0;
        return {
          monedaId: moneda.id,
          monedaCodigo: moneda.codigo,
          monedaSimbolo: moneda.simbolo,
          total,
        };
      });
      return {
        ...filial,
        saldos,
      };
    });

    // Calcular totales generales (caja general)
    const totalesGenerales = monedas.map((moneda) => {
      let totalIngresos = 0;
      diezmosAgrupados
        .filter((d) => d.monedaId === moneda.id)
        .forEach((d) => {
          totalIngresos += Number(d._sum.monto || 0);
        });
      const totalEgresos = egresosMap.get(moneda.id) || 0;
      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        totalIngresos,
        totalEgresos,
        saldo: totalIngresos - totalEgresos,
      };
    });

    return {
      filiales: filialesConSaldos,
      totalesGenerales,
      monedas: monedas.map(serializarMoneda),
      tiposGasto,
    };
  });
}

// Obtener datos para formularios
export async function obtenerDatosFormularioDiezmo() {
  const [filiales, monedas] = await Promise.all([
    prisma.filial.findMany({
      where: { activa: true },
      include: { pais: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  return {
    filiales,
    monedas: monedas.map(serializarMoneda),
  };
}

export async function obtenerDatosFormularioEgresoFilial() {
  const [tiposGasto, monedas] = await Promise.all([
    prisma.tipoGasto.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  return {
    tiposGasto,
    monedas: monedas.map(serializarMoneda),
  };
}

// =====================
// SALDO DE CAJA GENERAL FILIALES
// =====================

export async function obtenerSaldoFiliales() {
  return withRetry(async () => {
    const monedas = await prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    });

    // Diezmos agrupados por moneda
    const diezmosPorMoneda = await prisma.diezmoFilial.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    });

    // Egresos agrupados por moneda
    const egresosPorMoneda = await prisma.egresoFilial.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    });

    const saldos = monedas.map((moneda) => {
      const ingresos = Number(
        diezmosPorMoneda.find((d) => d.monedaId === moneda.id)?._sum.monto || 0
      );
      const egresos = Number(
        egresosPorMoneda.find((e) => e.monedaId === moneda.id)?._sum.monto || 0
      );
      const saldo = ingresos - egresos;

      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos,
        egresos,
        saldo,
      };
    });

    return saldos;
  });
}
