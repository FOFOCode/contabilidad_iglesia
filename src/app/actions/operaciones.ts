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
  cajaSecundariaId?: string | null; // Caja de tracking por sociedad
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
      cajaSecundariaId: data.cajaSecundariaId || null,
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
      cajaSecundaria: true,
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
  incluirSecundaria?: boolean; // Incluir ingresos donde esta caja es secundaria
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
        // Si incluirSecundaria es true, buscar en caja principal O secundaria
        ...(filtros?.cajaId && filtros?.incluirSecundaria
          ? {
              OR: [
                { cajaId: filtros.cajaId },
                { cajaSecundariaId: filtros.cajaId },
              ],
            }
          : filtros?.cajaId
          ? { cajaId: filtros.cajaId }
          : {}),
      },
      include: {
        sociedad: true,
        servicio: true,
        tipoIngreso: true,
        caja: true,
        cajaSecundaria: true,
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
        cajaSecundaria: true,
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

  // Obtener ingresos secundarios agrupados (para tracking)
  const ingresosSecundariosAgrupados = await prisma.$queryRaw<
    { cajaId: string; monedaId: string; total: number }[]
  >`
    SELECT i."cajaSecundariaId" as "cajaId", im."monedaId", SUM(im.monto)::float as total
    FROM ingreso_montos im
    INNER JOIN ingresos i ON im."ingresoId" = i.id
    INNER JOIN cajas c ON i."cajaSecundariaId" = c.id
    WHERE c.activa = true AND i."cajaSecundariaId" IS NOT NULL
    GROUP BY i."cajaSecundariaId", im."monedaId"
  `;

  // Mapa para acceso rápido a ingresos principales
  const ingresosPrincipalesMap = new Map<string, number>();
  ingresosAgrupados.forEach((ing) => {
    ingresosPrincipalesMap.set(`${ing.cajaId}-${ing.monedaId}`, ing.total);
  });

  // Mapa separado para ingresos secundarios
  const ingresosSecundariosMap = new Map<string, number>();
  ingresosSecundariosAgrupados.forEach((ing) => {
    ingresosSecundariosMap.set(`${ing.cajaId}-${ing.monedaId}`, ing.total);
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

      // Para cajas de sociedades (no generales): solo mostrar ingresos secundarios (tracking)
      // Para cajas generales u otras: mostrar ingresos principales (dinero real)
      const esSubcaja =
        !caja.esGeneral && (caja.sociedadId || caja.tipoIngresoId);
      const ingresos = esSubcaja
        ? ingresosSecundariosMap.get(key) || 0
        : ingresosPrincipalesMap.get(key) || 0;

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

  // Ingresos donde esta caja es la principal
  const ingresos = await prisma.ingreso.findMany({
    where: { cajaId },
    include: {
      sociedad: true,
      tipoIngreso: true,
      servicio: true,
      montos: { include: { moneda: true } },
      cajaSecundaria: true,
    },
    orderBy: { fechaRecaudacion: "desc" },
    take: 50,
  });

  // Ingresos donde esta caja es la secundaria (para tracking)
  const ingresosSecundarios = await prisma.ingreso.findMany({
    where: { cajaSecundariaId: cajaId },
    include: {
      sociedad: true,
      tipoIngreso: true,
      servicio: true,
      montos: { include: { moneda: true } },
      caja: true,
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
    esSecundario: false,
    cajaPrincipal: null,
    montos: ing.montos.map((m) => ({
      ...m,
      monto: Number(m.monto),
      moneda: serializarMoneda(m.moneda),
    })),
  }));

  // Serializar ingresos secundarios (donde esta caja es para tracking)
  const ingresosSecundariosSerializados = ingresosSecundarios.map((ing) => ({
    ...ing,
    esSecundario: true,
    cajaPrincipal: ing.caja
      ? { id: ing.caja.id, nombre: ing.caja.nombre }
      : null,
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
    ingresosSecundarios: ingresosSecundariosSerializados,
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
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  cajaId?: string;
  sociedadId?: string;
}

export async function obtenerDatosReporte(filtros: FiltrosReporte) {
  const whereIngresos: any = {};
  const whereEgresos: any = {};

  // Convertir strings a Date si es necesario
  const fechaInicio = filtros.fechaInicio
    ? typeof filtros.fechaInicio === "string"
      ? new Date(filtros.fechaInicio)
      : filtros.fechaInicio
    : undefined;
  const fechaFin = filtros.fechaFin
    ? typeof filtros.fechaFin === "string"
      ? new Date(filtros.fechaFin)
      : filtros.fechaFin
    : undefined;

  if (fechaInicio) {
    whereIngresos.fechaRecaudacion = {
      ...whereIngresos.fechaRecaudacion,
      gte: fechaInicio,
    };
    whereEgresos.fechaSalida = {
      ...whereEgresos.fechaSalida,
      gte: fechaInicio,
    };
  }
  if (fechaFin) {
    whereIngresos.fechaRecaudacion = {
      ...whereIngresos.fechaRecaudacion,
      lte: fechaFin,
    };
    whereEgresos.fechaSalida = {
      ...whereEgresos.fechaSalida,
      lte: fechaFin,
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

// =====================
// DATOS PARA REPORTES ANALÍTICOS
// =====================

interface FiltrosReporteAnalitico {
  anio: number;
  monedaId?: string;
  fechaInicio?: string; // Formato ISO, opcional para rango personalizado
  fechaFin?: string; // Formato ISO, opcional para rango personalizado
  usarRangoFechas?: boolean; // Si es true, usa fechaInicio/fechaFin en lugar del año
}

export async function obtenerDatosReporteAnalitico(
  filtros: FiltrosReporteAnalitico
) {
  // Determinar rango de fechas: personalizado o por año completo
  let inicioRango: Date;
  let finRango: Date;
  let labelPeriodo: string;

  if (filtros.usarRangoFechas && filtros.fechaInicio && filtros.fechaFin) {
    // Usar rango personalizado
    const [yi, mi, di] = filtros.fechaInicio.split("-").map(Number);
    const [yf, mf, df] = filtros.fechaFin.split("-").map(Number);
    inicioRango = new Date(yi, mi - 1, di, 0, 0, 0);
    finRango = new Date(yf, mf - 1, df, 23, 59, 59);
    labelPeriodo = `${filtros.fechaInicio} al ${filtros.fechaFin}`;
  } else {
    // Usar año completo
    inicioRango = new Date(filtros.anio, 0, 1, 0, 0, 0);
    finRango = new Date(filtros.anio, 11, 31, 23, 59, 59);
    labelPeriodo = filtros.anio.toString();
  }

  const [
    ingresos,
    egresos,
    tiposIngreso,
    tiposGasto,
    sociedades,
    cajas,
    monedasRaw,
  ] = await Promise.all([
    prisma.ingreso.findMany({
      where: {
        fechaRecaudacion: { gte: inicioRango, lte: finRango },
      },
      include: {
        sociedad: true,
        tipoIngreso: true,
        caja: true,
        montos: { include: { moneda: true } },
      },
    }),
    prisma.egreso.findMany({
      where: {
        fechaSalida: { gte: inicioRango, lte: finRango },
        ...(filtros.monedaId ? { monedaId: filtros.monedaId } : {}),
      },
      include: {
        tipoGasto: true,
        caja: true,
        moneda: true,
      },
    }),
    prisma.tipoIngreso.findMany({ where: { activo: true } }),
    prisma.tipoGasto.findMany({ where: { activo: true } }),
    prisma.sociedad.findMany({ where: { activa: true } }),
    prisma.caja.findMany({ where: { activa: true } }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
  ]);

  // Filtrar ingresos por moneda si se especifica
  const ingresosFiltrados = filtros.monedaId
    ? ingresos.filter((ing) =>
        ing.montos.some((m) => m.monedaId === filtros.monedaId)
      )
    : ingresos;

  // 1. Datos mensuales para gráfica de tendencia
  const datosMensuales = Array.from({ length: 12 }, (_, mes) => {
    const ingresosDelMes = ingresosFiltrados.filter(
      (ing) => new Date(ing.fechaRecaudacion).getMonth() === mes
    );
    const egresosDelMes = egresos.filter(
      (eg) => new Date(eg.fechaSalida).getMonth() === mes
    );

    let totalIngresos = 0;
    let totalEgresos = 0;

    ingresosDelMes.forEach((ing) => {
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          totalIngresos += Number(m.monto);
        }
      });
    });

    egresosDelMes.forEach((eg) => {
      totalEgresos += Number(eg.monto);
    });

    return {
      mes: mes + 1,
      nombreMes: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ][mes],
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
    };
  });

  // 2. Desglose por Sociedad
  const porSociedad = sociedades.map((soc) => {
    const ingresosDeS = ingresosFiltrados.filter(
      (ing) => ing.sociedadId === soc.id
    );
    let total = 0;
    ingresosDeS.forEach((ing) => {
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          total += Number(m.monto);
        }
      });
    });
    return {
      id: soc.id,
      nombre: soc.nombre,
      total,
      cantidad: ingresosDeS.length,
    };
  });

  // 3. Desglose por Tipo de Ingreso (con desglose por sociedad)
  const porTipoIngreso = tiposIngreso.map((tipo) => {
    const ingresosDeT = ingresosFiltrados.filter(
      (ing) => ing.tipoIngresoId === tipo.id
    );
    let total = 0;
    ingresosDeT.forEach((ing) => {
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          total += Number(m.monto);
        }
      });
    });

    // Desglose por sociedad dentro de este tipo de ingreso
    const porSociedadMap: Record<
      string,
      { nombre: string; total: number; cantidad: number }
    > = {};
    ingresosDeT.forEach((ing) => {
      const socId = ing.sociedad.id;
      const socNombre = ing.sociedad.nombre;
      if (!porSociedadMap[socId]) {
        porSociedadMap[socId] = { nombre: socNombre, total: 0, cantidad: 0 };
      }
      porSociedadMap[socId].cantidad += 1;
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          porSociedadMap[socId].total += Number(m.monto);
        }
      });
    });

    const porSociedad = Object.entries(porSociedadMap)
      .map(([id, data]) => ({
        id,
        nombre: data.nombre,
        total: data.total,
        cantidad: data.cantidad,
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      id: tipo.id,
      nombre: tipo.nombre,
      total,
      cantidad: ingresosDeT.length,
      porSociedad, // NUEVO: desglose por sociedad
    };
  });

  // 4. Desglose por Tipo de Gasto
  const porTipoGasto = tiposGasto.map((tipo) => {
    const egresosDeT = egresos.filter((eg) => eg.tipoGastoId === tipo.id);
    const total = egresosDeT.reduce((sum, eg) => sum + Number(eg.monto), 0);
    return {
      id: tipo.id,
      nombre: tipo.nombre,
      total,
      cantidad: egresosDeT.length,
    };
  });

  // 5. Desglose por Caja
  const porCaja = cajas.map((caja) => {
    const ingresosDeCaja = ingresosFiltrados.filter(
      (ing) => ing.cajaId === caja.id
    );
    const egresosDeCaja = egresos.filter((eg) => eg.cajaId === caja.id);

    let totalIngresos = 0;
    ingresosDeCaja.forEach((ing) => {
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          totalIngresos += Number(m.monto);
        }
      });
    });
    const totalEgresos = egresosDeCaja.reduce(
      (sum, eg) => sum + Number(eg.monto),
      0
    );

    return {
      id: caja.id,
      nombre: caja.nombre,
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
    };
  });

  // 6. Totales generales
  let totalIngresosAnio = 0;
  let totalEgresosAnio = 0;
  ingresosFiltrados.forEach((ing) => {
    ing.montos.forEach((m) => {
      if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
        totalIngresosAnio += Number(m.monto);
      }
    });
  });
  totalEgresosAnio = egresos.reduce((sum, eg) => sum + Number(eg.monto), 0);

  // Serializar moneda seleccionada
  const monedaSeleccionadaRaw = filtros.monedaId
    ? monedasRaw.find((m) => m.id === filtros.monedaId)
    : monedasRaw.find((m) => m.esPrincipal);

  const monedaSeleccionada = monedaSeleccionadaRaw
    ? serializarMoneda(monedaSeleccionadaRaw)
    : null;

  return {
    anio: filtros.anio,
    periodo: labelPeriodo, // Nuevo campo para mostrar el período seleccionado
    monedaSeleccionada,
    datosMensuales,
    porSociedad: porSociedad.filter((s) => s.total > 0 || s.cantidad > 0),
    porTipoIngreso: porTipoIngreso.filter((t) => t.total > 0 || t.cantidad > 0),
    porTipoGasto: porTipoGasto.filter((t) => t.total > 0 || t.cantidad > 0),
    porCaja,
    totales: {
      ingresos: totalIngresosAnio,
      egresos: totalEgresosAnio,
      balance: totalIngresosAnio - totalEgresosAnio,
      cantidadIngresos: ingresosFiltrados.length,
      cantidadEgresos: egresos.length,
    },
    monedas: monedasRaw.map(serializarMoneda),
  };
}
