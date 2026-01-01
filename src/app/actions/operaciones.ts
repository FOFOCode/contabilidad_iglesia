"use server";

import { prisma, withRetry } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

// =====================
// INGRESOS
// =====================

interface MontoIngreso {
  monedaId: string;
  monto: number;
}

interface CrearIngresoData {
  fechaRecaudacion: Date;
  sociedadId: string;
  servicioId: string;
  tipoIngresoId: string;
  cajaId: string;
  usuarioId: string;
  comentario?: string;
  montos: MontoIngreso[];
}

export async function crearIngreso(data: CrearIngresoData) {
  return prisma.ingreso.create({
    data: {
      fechaRecaudacion: data.fechaRecaudacion,
      sociedadId: data.sociedadId,
      servicioId: data.servicioId,
      tipoIngresoId: data.tipoIngresoId,
      cajaId: data.cajaId,
      usuarioId: data.usuarioId,
      comentario: data.comentario,
      montos: {
        create: data.montos.map((m) => ({
          monedaId: m.monedaId,
          monto: m.monto,
        })),
      },
    },
    include: {
      montos: { include: { moneda: true } },
      sociedad: true,
      servicio: true,
      tipoIngreso: true,
      caja: true,
    },
  });
}

export async function crearIngresosMultiples(ingresos: CrearIngresoData[]) {
  const resultados = [];
  for (const ingreso of ingresos) {
    const resultado = await crearIngreso(ingreso);
    resultados.push(resultado);
  }
  return resultados;
}

interface FiltrosIngreso {
  desde?: Date;
  hasta?: Date;
  sociedadId?: string;
  tipoIngresoId?: string;
  cajaId?: string;
}

export async function obtenerIngresos(filtros?: FiltrosIngreso) {
  return withRetry(() =>
    prisma.ingreso.findMany({
      where: {
        fechaRecaudacion: {
          gte: filtros?.desde,
          lte: filtros?.hasta,
        },
        sociedadId: filtros?.sociedadId || undefined,
        tipoIngresoId: filtros?.tipoIngresoId || undefined,
        cajaId: filtros?.cajaId || undefined,
      },
      include: {
        sociedad: true,
        servicio: true,
        tipoIngreso: true,
        caja: true,
        montos: { include: { moneda: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaRecaudacion: "desc" },
    })
  );
}

export async function obtenerIngresoPorId(id: string) {
  return withRetry(() =>
    prisma.ingreso.findUnique({
      where: { id },
      include: {
        sociedad: true,
        servicio: true,
        tipoIngreso: true,
        caja: true,
        montos: { include: { moneda: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
    })
  );
}

export async function eliminarIngreso(id: string) {
  return prisma.ingreso.delete({
    where: { id },
  });
}

// =====================
// EGRESOS
// =====================

interface CrearEgresoData {
  fechaSalida: Date;
  solicitante: string;
  monto: number;
  descripcionGasto?: string;
  comentario?: string;
  tipoGastoId: string;
  monedaId: string;
  cajaId: string;
  usuarioId: string;
}

export async function crearEgreso(data: CrearEgresoData) {
  // Validar que hay saldo suficiente en la caja
  const saldos = await obtenerSaldoCaja(data.cajaId, data.monedaId);
  const saldoMoneda = saldos.find((s) => s.monedaId === data.monedaId);

  if (!saldoMoneda || saldoMoneda.saldo < data.monto) {
    const disponible = saldoMoneda?.saldo || 0;
    const simbolo = saldoMoneda?.monedaSimbolo || "";
    throw new Error(
      `Saldo insuficiente en la caja. Disponible: ${simbolo}${disponible.toLocaleString(
        "es-GT",
        { minimumFractionDigits: 2 }
      )}. Intenta egresar: ${simbolo}${data.monto.toLocaleString("es-GT", {
        minimumFractionDigits: 2,
      })}`
    );
  }

  return prisma.egreso.create({
    data: {
      fechaSalida: data.fechaSalida,
      solicitante: data.solicitante,
      monto: data.monto,
      descripcionGasto: data.descripcionGasto,
      comentario: data.comentario,
      tipoGastoId: data.tipoGastoId,
      monedaId: data.monedaId,
      cajaId: data.cajaId,
      usuarioId: data.usuarioId,
    },
    include: {
      tipoGasto: true,
      moneda: true,
      caja: true,
    },
  });
}

export async function crearEgresosMultiples(egresos: CrearEgresoData[]) {
  const resultados = [];
  for (const egreso of egresos) {
    const resultado = await crearEgreso(egreso);
    resultados.push(resultado);
  }
  return resultados;
}

interface FiltrosEgreso {
  desde?: Date;
  hasta?: Date;
  tipoGastoId?: string;
  cajaId?: string;
}

export async function obtenerEgresos(filtros?: FiltrosEgreso) {
  return withRetry(() =>
    prisma.egreso.findMany({
      where: {
        fechaSalida: {
          gte: filtros?.desde,
          lte: filtros?.hasta,
        },
        tipoGastoId: filtros?.tipoGastoId || undefined,
        cajaId: filtros?.cajaId || undefined,
      },
      include: {
        tipoGasto: true,
        moneda: true,
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaSalida: "desc" },
    })
  );
}

export async function obtenerEgresoPorId(id: string) {
  return withRetry(() =>
    prisma.egreso.findUnique({
      where: { id },
      include: {
        tipoGasto: true,
        moneda: true,
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    })
  );
}

export async function eliminarEgreso(id: string) {
  return prisma.egreso.delete({
    where: { id },
  });
}

// Obtener saldo de una caja por moneda
export async function obtenerSaldoCaja(cajaId: string, monedaId?: string) {
  return withRetry(async () => {
    const monedas = await prisma.moneda.findMany({
      where: monedaId ? { id: monedaId, activa: true } : { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    });

    // Ingresos agrupados por moneda
    const ingresosPorMoneda = await prisma.ingresoMonto.groupBy({
      by: ["monedaId"],
      where: {
        ingreso: { cajaId },
        ...(monedaId ? { monedaId } : {}),
      },
      _sum: { monto: true },
    });

    // Egresos agrupados por moneda
    const egresosPorMoneda = await prisma.egreso.groupBy({
      by: ["monedaId"],
      where: {
        cajaId,
        ...(monedaId ? { monedaId } : {}),
      },
      _sum: { monto: true },
    });

    const saldos = monedas.map((moneda) => {
      const ingresos =
        ingresosPorMoneda.find((i) => i.monedaId === moneda.id)?._sum.monto ||
        new Prisma.Decimal(0);
      const egresos =
        egresosPorMoneda.find((e) => e.monedaId === moneda.id)?._sum.monto ||
        new Prisma.Decimal(0);
      const saldo = Number(ingresos) - Number(egresos);

      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos: Number(ingresos),
        egresos: Number(egresos),
        saldo,
      };
    });

    return saldos;
  });
}

// =====================
// CAJAS - SALDOS
// =====================

export async function obtenerCajasConSaldos() {
  // Obtener datos base en paralelo
  const [cajas, monedas, todosIngresos, todosEgresos] = await Promise.all([
    prisma.caja.findMany({
      where: { activa: true },
      include: {
        sociedad: true,
        tipoIngreso: true,
      },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
    // Una sola consulta para TODOS los ingresos agrupados por caja y moneda
    prisma.ingresoMonto.groupBy({
      by: ["monedaId"],
      where: { ingreso: { caja: { activa: true } } },
      _sum: { monto: true },
    }),
    // Una sola consulta para TODOS los egresos agrupados por caja y moneda
    prisma.egreso.groupBy({
      by: ["monedaId", "cajaId"],
      where: { caja: { activa: true } },
      _sum: { monto: true },
    }),
  ]);

  // Obtener ingresos agrupados por caja y moneda en una sola consulta
  const ingresosAgrupados = await prisma.$queryRaw<
    { cajaId: string; monedaId: string; total: number }[]
  >`
    SELECT i."cajaId", im."monedaId", SUM(im.monto)::float as total
    FROM ingreso_montos im
    INNER JOIN ingresos i ON im."ingresoId" = i.id
    INNER JOIN cajas c ON i."cajaId" = c.id
    WHERE c.activa = true
    GROUP BY i."cajaId", im."monedaId"
  `;

  // Mapa para acceso rápido a ingresos
  const ingresosMap = new Map<string, number>();
  ingresosAgrupados.forEach((ing) => {
    ingresosMap.set(`${ing.cajaId}-${ing.monedaId}`, ing.total);
  });

  // Mapa para acceso rápido a egresos
  const egresosMap = new Map<string, number>();
  todosEgresos.forEach((egr) => {
    egresosMap.set(
      `${egr.cajaId}-${egr.monedaId}`,
      Number(egr._sum.monto || 0)
    );
  });

  // Construir cajas con saldos usando los mapas
  const cajasConSaldos = cajas.map((caja) => {
    const saldos = monedas.map((moneda) => {
      const key = `${caja.id}-${moneda.id}`;
      const ingresos = ingresosMap.get(key) || 0;
      const egresos = egresosMap.get(key) || 0;

      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos,
        egresos,
        saldo: ingresos - egresos,
      };
    });

    return {
      ...caja,
      saldos,
    };
  });

  // Serializar monedas para evitar Decimal
  const monedasSerializadas = monedas.map(serializarMoneda);

  return { cajas: cajasConSaldos, monedas: monedasSerializadas };
}

export async function obtenerDetalleCaja(cajaId: string) {
  const caja = await prisma.caja.findUnique({
    where: { id: cajaId },
    include: {
      sociedad: true,
      tipoIngreso: true,
    },
  });

  if (!caja) return null;

  const ingresos = await prisma.ingreso.findMany({
    where: { cajaId },
    include: {
      sociedad: true,
      tipoIngreso: true,
      servicio: true,
      montos: { include: { moneda: true } },
    },
    orderBy: { fechaRecaudacion: "desc" },
    take: 50,
  });

  const egresos = await prisma.egreso.findMany({
    where: { cajaId },
    include: {
      tipoGasto: true,
      moneda: true,
    },
    orderBy: { fechaSalida: "desc" },
    take: 50,
  });

  const monedas = await prisma.moneda.findMany({
    where: { activa: true },
    orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
  });

  // Calcular totales
  const ingresosPorMoneda = await prisma.ingresoMonto.groupBy({
    by: ["monedaId"],
    where: { ingreso: { cajaId } },
    _sum: { monto: true },
  });

  const egresosPorMoneda = await prisma.egreso.groupBy({
    by: ["monedaId"],
    where: { cajaId },
    _sum: { monto: true },
  });

  const saldos = monedas.map((moneda) => {
    const totalIngresos =
      ingresosPorMoneda.find((i) => i.monedaId === moneda.id)?._sum.monto ||
      new Prisma.Decimal(0);
    const totalEgresos =
      egresosPorMoneda.find((e) => e.monedaId === moneda.id)?._sum.monto ||
      new Prisma.Decimal(0);
    return {
      moneda: serializarMoneda(moneda),
      ingresos: Number(totalIngresos),
      egresos: Number(totalEgresos),
      saldo: Number(totalIngresos) - Number(totalEgresos),
    };
  });

  // Serializar ingresos para evitar Decimal en montos
  const ingresosSerializados = ingresos.map((ing) => ({
    ...ing,
    montos: ing.montos.map((m) => ({
      ...m,
      monto: Number(m.monto),
      moneda: serializarMoneda(m.moneda),
    })),
  }));

  // Serializar egresos para evitar Decimal
  const egresosSerializados = egresos.map((eg) => ({
    ...eg,
    monto: Number(eg.monto),
    moneda: serializarMoneda(eg.moneda),
  }));

  return {
    caja,
    ingresos: ingresosSerializados,
    egresos: egresosSerializados,
    saldos,
    monedas: monedas.map(serializarMoneda),
  };
}

// =====================
// DATOS PARA FORMULARIOS
// =====================

// Función auxiliar para serializar monedas (eliminar Decimal)
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

export async function obtenerDatosFormularioIngreso() {
  const [sociedades, servicios, tiposIngreso, cajas, monedasRaw] =
    await Promise.all([
      prisma.sociedad.findMany({
        where: { activa: true },
        orderBy: { orden: "asc" },
      }),
      prisma.tipoServicio.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
      }),
      prisma.tipoIngreso.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
      }),
      prisma.caja.findMany({
        where: { activa: true },
        include: { sociedad: true, tipoIngreso: true },
        orderBy: { orden: "asc" },
      }),
      prisma.moneda.findMany({
        where: { activa: true },
        orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
      }),
    ]);

  const monedas = monedasRaw.map(serializarMoneda);
  return { sociedades, servicios, tiposIngreso, cajas, monedas };
}

export async function obtenerDatosFormularioEgreso() {
  const [tiposGasto, cajas, monedasRaw] = await Promise.all([
    prisma.tipoGasto.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.caja.findMany({
      where: { activa: true },
      include: { sociedad: true, tipoIngreso: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  const monedas = monedasRaw.map(serializarMoneda);
  return { tiposGasto, cajas, monedas };
}

// =====================
// DATOS PARA REPORTES
// =====================

interface FiltrosReporte {
  fechaInicio?: Date;
  fechaFin?: Date;
  cajaId?: string;
  sociedadId?: string;
}

export async function obtenerDatosReporte(filtros: FiltrosReporte) {
  const whereIngresos: any = {};
  const whereEgresos: any = {};

  if (filtros.fechaInicio) {
    whereIngresos.fechaRecaudacion = {
      ...whereIngresos.fechaRecaudacion,
      gte: filtros.fechaInicio,
    };
    whereEgresos.fechaSalida = {
      ...whereEgresos.fechaSalida,
      gte: filtros.fechaInicio,
    };
  }
  if (filtros.fechaFin) {
    whereIngresos.fechaRecaudacion = {
      ...whereIngresos.fechaRecaudacion,
      lte: filtros.fechaFin,
    };
    whereEgresos.fechaSalida = {
      ...whereEgresos.fechaSalida,
      lte: filtros.fechaFin,
    };
  }
  if (filtros.cajaId) {
    whereIngresos.cajaId = filtros.cajaId;
    whereEgresos.cajaId = filtros.cajaId;
  }
  if (filtros.sociedadId) {
    whereIngresos.sociedadId = filtros.sociedadId;
  }

  const [ingresos, egresos, sociedades, cajas, monedasRaw] = await Promise.all([
    prisma.ingreso.findMany({
      where: whereIngresos,
      include: {
        sociedad: true,
        servicio: true,
        tipoIngreso: true,
        caja: true,
        montos: { include: { moneda: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaRecaudacion: "desc" },
    }),
    prisma.egreso.findMany({
      where: whereEgresos,
      include: {
        tipoGasto: true,
        caja: true,
        moneda: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaSalida: "desc" },
    }),
    prisma.sociedad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.caja.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  // Serializar para evitar Decimal
  const ingresosSerializados = ingresos.map((ing) => ({
    id: ing.id,
    fecha: ing.fechaRecaudacion,
    tipo: "Ingreso" as const,
    concepto: `${ing.tipoIngreso.nombre} - ${ing.sociedad.nombre}`,
    sociedad: ing.sociedad.nombre,
    caja: ing.caja.nombre,
    servicio: ing.servicio.nombre,
    tipoIngreso: ing.tipoIngreso.nombre,
    comentario: ing.comentario || undefined,
    usuario: ing.usuario
      ? `${ing.usuario.nombre} ${ing.usuario.apellido}`
      : undefined,
    montos: ing.montos.map((m) => ({
      monto: Number(m.monto),
      monedaId: m.monedaId,
      monedaCodigo: m.moneda.codigo,
      monedaSimbolo: m.moneda.simbolo,
    })),
  }));

  const egresosSerializados = egresos.map((eg) => ({
    id: eg.id,
    fecha: eg.fechaSalida,
    tipo: "Egreso" as const,
    concepto: eg.descripcionGasto || eg.tipoGasto.nombre,
    sociedad: null,
    caja: eg.caja.nombre,
    tipoGasto: eg.tipoGasto.nombre,
    solicitante: eg.solicitante,
    comentario: eg.comentario || undefined,
    usuario: eg.usuario
      ? `${eg.usuario.nombre} ${eg.usuario.apellido}`
      : undefined,
    montos: [
      {
        monto: Number(eg.monto),
        monedaId: eg.monedaId,
        monedaCodigo: eg.moneda.codigo,
        monedaSimbolo: eg.moneda.simbolo,
      },
    ],
  }));

  return {
    ingresos: ingresosSerializados,
    egresos: egresosSerializados,
    sociedades,
    cajas,
    monedas: monedasRaw.map(serializarMoneda),
  };
}
