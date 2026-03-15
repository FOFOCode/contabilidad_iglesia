"use server";

import { prisma, withRetry } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getUsuarioActual } from "./auth";
import { validarPermiso } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";
import { dbSaldoCaja, dbCajasConSaldos } from "@/lib/db-functions";
import {
  crearIngresoSchema,
  crearEgresoSchema,
  validarSchema,
} from "@/lib/schemas";

// Helper para validar permisos del usuario actual
async function validarPermisoActual(
  modulo: string,
  accion: "crear" | "editar" | "eliminar",
) {
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");
  await validarPermiso(usuario.id, modulo, accion);
}

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
  // Validar schema antes de cualquier query a BD (evita hits innecesarios)
  validarSchema(crearIngresoSchema, data);
  await validarPermisoActual("ingresos", "crear");
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  return withRetry(() =>
    prisma.ingreso.create({
      data: {
        fechaRecaudacion: data.fechaRecaudacion,
        sociedadId: data.sociedadId,
        servicioId: data.servicioId,
        tipoIngresoId: data.tipoIngresoId,
        cajaId: data.cajaId,
        cajaSecundariaId: data.cajaSecundariaId || null,
        usuarioId: data.usuarioId,
        creadoPorId: usuario.id,
        comentario: data.comentario,
        montos: {
          create: data.montos.map((m) => ({
            monedaId: m.monedaId,
            monto: Math.round(m.monto * 100) / 100,
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
    }),
  );
}

export async function crearIngresosMultiples(ingresos: CrearIngresoData[]) {
  const MAX_BATCH = 200;
  if (ingresos.length > MAX_BATCH)
    throw new Error(
      `No se pueden guardar más de ${MAX_BATCH} ingresos a la vez.`,
    );

  // Validar permisos y obtener usuario UNA sola vez (no por cada fila)
  await validarPermisoActual("ingresos", "crear");
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  // Pre-generar IDs para vincular ingresos con montos sin nested creates
  const ingresosConId = ingresos.map((data) => ({
    ...data,
    id: crypto.randomUUID(),
  }));

  // Procesar en lotes de 100 para no saturar la transacción
  const LOTE = 100;
  for (let i = 0; i < ingresosConId.length; i += LOTE) {
    const lote = ingresosConId.slice(i, i + LOTE);
    await withRetry(() =>
      prisma.$transaction([
        prisma.ingreso.createMany({
          data: lote.map((data) => ({
            id: data.id,
            fechaRecaudacion: data.fechaRecaudacion,
            sociedadId: data.sociedadId,
            servicioId: data.servicioId,
            tipoIngresoId: data.tipoIngresoId,
            cajaId: data.cajaId,
            cajaSecundariaId: data.cajaSecundariaId || null,
            usuarioId: data.usuarioId,
            creadoPorId: usuario.id,
            comentario: data.comentario,
          })),
        }),
        prisma.ingresoMonto.createMany({
          data: lote.flatMap((data) =>
            data.montos.map((m) => ({
              ingresoId: data.id,
              monedaId: m.monedaId,
              monto: Math.round(m.monto * 100) / 100,
            })),
          ),
        }),
      ]),
    );
  }
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
    }),
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
    }),
  );
}

export async function eliminarIngreso(id: string) {
  await validarPermisoActual("ingresos", "eliminar");
  return prisma.ingreso.delete({
    where: { id },
  });
}

interface ActualizarIngresoData {
  fechaRecaudacion?: Date;
  sociedadId?: string;
  servicioId?: string;
  tipoIngresoId?: string;
  cajaId?: string;
  cajaSecundariaId?: string | null;
  comentario?: string | null;
  montos?: MontoIngreso[];
}

export async function actualizarIngreso(
  id: string,
  data: ActualizarIngresoData,
) {
  await validarPermisoActual("ingresos", "editar");

  // Si se actualizan los montos, primero eliminar los existentes
  if (data.montos) {
    await prisma.ingresoMonto.deleteMany({
      where: { ingresoId: id },
    });
  }

  return withRetry(() =>
    prisma.ingreso.update({
      where: { id },
      data: {
        fechaRecaudacion: data.fechaRecaudacion,
        sociedadId: data.sociedadId,
        servicioId: data.servicioId,
        tipoIngresoId: data.tipoIngresoId,
        cajaId: data.cajaId,
        cajaSecundariaId: data.cajaSecundariaId,
        comentario: data.comentario,
        ...(data.montos && {
          montos: {
            create: data.montos.map((m) => ({
              monedaId: m.monedaId,
              monto: Math.round(m.monto * 100) / 100,
            })),
          },
        }),
      },
      include: {
        montos: { include: { moneda: true } },
        sociedad: true,
        servicio: true,
        tipoIngreso: true,
        caja: true,
        cajaSecundaria: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    }),
  );
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
  numeroFactura?: string; // Número de factura (opcional)
  tipoGastoId: string;
  monedaId: string;
  cajaId: string;
  usuarioId: string;
}

export async function crearEgreso(data: CrearEgresoData) {
  // Validar schema antes de cualquier query a BD
  validarSchema(crearEgresoSchema, data);
  await validarPermisoActual("egresos", "crear");
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  // Validar que hay saldo suficiente en la caja
  const saldos = await obtenerSaldoCaja(data.cajaId, data.monedaId);
  const saldoMoneda = saldos.find((s) => s.monedaId === data.monedaId);

  if (!saldoMoneda || saldoMoneda.saldo < data.monto) {
    const disponible = saldoMoneda?.saldo || 0;
    const simbolo = saldoMoneda?.monedaSimbolo || "";
    throw new Error(
      `Saldo insuficiente en la caja. Disponible: ${simbolo}${disponible.toLocaleString(
        "es-GT",
        { minimumFractionDigits: 2 },
      )}. Intenta egresar: ${simbolo}${data.monto.toLocaleString("es-GT", {
        minimumFractionDigits: 2,
      })}`,
    );
  }

  return prisma.egreso.create({
    data: {
      fechaSalida: data.fechaSalida,
      solicitante: data.solicitante,
      monto: Math.round(data.monto * 100) / 100,
      descripcionGasto: data.descripcionGasto,
      comentario: data.comentario,
      numeroFactura: data.numeroFactura || null,
      tipoGastoId: data.tipoGastoId,
      monedaId: data.monedaId,
      cajaId: data.cajaId,
      usuarioId: data.usuarioId,
      creadoPorId: usuario.id, // Quién creó el registro
    },
    include: {
      tipoGasto: true,
      moneda: true,
      caja: true,
    },
  });
}

export async function crearEgresosMultiples(egresos: CrearEgresoData[]) {
  const MAX_BATCH = 200;
  if (egresos.length > MAX_BATCH)
    throw new Error(
      `No se pueden guardar más de ${MAX_BATCH} egresos a la vez.`,
    );

  // Validar permisos y obtener usuario UNA sola vez
  await validarPermisoActual("egresos", "crear");
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  // Agrupar montos por (cajaId, monedaId) para validar saldo UNA vez por combinación
  const totalesPorCajaMoneda = new Map<string, number>();
  for (const egreso of egresos) {
    const key = `${egreso.cajaId}:${egreso.monedaId}`;
    totalesPorCajaMoneda.set(
      key,
      (totalesPorCajaMoneda.get(key) ?? 0) + egreso.monto,
    );
  }

  // Validar saldo para cada combinación (en paralelo)
  await Promise.all(
    Array.from(totalesPorCajaMoneda.entries()).map(
      async ([key, totalMonto]) => {
        const [cajaId, monedaId] = key.split(":");
        const saldos = await obtenerSaldoCaja(cajaId, monedaId);
        const saldoMoneda = saldos.find((s) => s.monedaId === monedaId);
        if (!saldoMoneda || saldoMoneda.saldo < totalMonto) {
          const disponible = saldoMoneda?.saldo ?? 0;
          const simbolo = saldoMoneda?.monedaSimbolo ?? "";
          throw new Error(
            `Saldo insuficiente en la caja. Disponible: ${simbolo}${disponible.toLocaleString(
              "es-GT",
              { minimumFractionDigits: 2 },
            )}. Total a egresar: ${simbolo}${totalMonto.toLocaleString(
              "es-GT",
              {
                minimumFractionDigits: 2,
              },
            )}`,
          );
        }
      },
    ),
  );

  // Procesar en lotes de 100 para no saturar la transacción
  const LOTE = 100;
  for (let i = 0; i < egresos.length; i += LOTE) {
    const lote = egresos.slice(i, i + LOTE);
    await withRetry(() =>
      prisma.egreso.createMany({
        data: lote.map((data) => ({
          fechaSalida: data.fechaSalida,
          solicitante: data.solicitante,
          monto: Math.round(data.monto * 100) / 100,
          descripcionGasto: data.descripcionGasto,
          comentario: data.comentario,
          numeroFactura: data.numeroFactura || null,
          tipoGastoId: data.tipoGastoId,
          monedaId: data.monedaId,
          cajaId: data.cajaId,
          usuarioId: data.usuarioId,
          creadoPorId: usuario.id,
        })),
      }),
    );
  }
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
    }),
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
    }),
  );
}

export async function eliminarEgreso(id: string) {
  await validarPermisoActual("egresos", "eliminar");
  return prisma.egreso.delete({
    where: { id },
  });
}

interface ActualizarEgresoData {
  fechaSalida?: Date;
  solicitante?: string;
  monto?: number;
  descripcionGasto?: string | null;
  comentario?: string | null;
  tipoGastoId?: string;
  monedaId?: string;
  cajaId?: string;
}

export async function actualizarEgreso(id: string, data: ActualizarEgresoData) {
  await validarPermisoActual("egresos", "editar");

  // Si se cambia el monto o la moneda, validar saldo disponible
  if (data.monto !== undefined || data.monedaId || data.cajaId) {
    const egresoActual = await prisma.egreso.findUnique({
      where: { id },
      select: { monto: true, monedaId: true, cajaId: true },
    });

    if (!egresoActual) {
      throw new Error("Egreso no encontrado");
    }

    const cajaId = data.cajaId || egresoActual.cajaId;
    const monedaId = data.monedaId || egresoActual.monedaId;
    const nuevoMonto = data.monto ?? Number(egresoActual.monto);

    // Calcular el saldo considerando que el egreso actual se va a eliminar
    const saldos = await obtenerSaldoCaja(cajaId, monedaId);
    const saldoMoneda = saldos.find((s) => s.monedaId === monedaId);

    // El saldo disponible es el actual más el monto del egreso que vamos a actualizar
    const saldoDisponible =
      (saldoMoneda?.saldo || 0) + Number(egresoActual.monto);

    if (saldoDisponible < nuevoMonto) {
      const simbolo = saldoMoneda?.monedaSimbolo || "";
      throw new Error(
        `Saldo insuficiente en la caja. Disponible: ${simbolo}${saldoDisponible.toLocaleString(
          "es-GT",
          { minimumFractionDigits: 2 },
        )}. Intenta egresar: ${simbolo}${nuevoMonto.toLocaleString("es-GT", {
          minimumFractionDigits: 2,
        })}`,
      );
    }
  }

  return withRetry(() =>
    prisma.egreso.update({
      where: { id },
      data: {
        fechaSalida: data.fechaSalida,
        solicitante: data.solicitante,
        monto:
          data.monto !== undefined
            ? Math.round(data.monto * 100) / 100
            : undefined,
        descripcionGasto: data.descripcionGasto,
        comentario: data.comentario,
        tipoGastoId: data.tipoGastoId,
        monedaId: data.monedaId,
        cajaId: data.cajaId,
      },
      include: {
        tipoGasto: true,
        moneda: true,
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    }),
  );
}

// Obtener saldo de una caja por moneda
// Delega a fn_saldo_caja() — 1 round-trip en lugar de 4 queries secuenciales.
export async function obtenerSaldoCaja(cajaId: string, monedaId?: string) {
  return withRetry(async () => {
    const saldos = await dbSaldoCaja(cajaId, monedaId);
    if (saldos.length === 0) {
      // Caja no encontrada o sin monedas activas → verificar que exista
      const caja = await prisma.caja.findUnique({ where: { id: cajaId } });
      if (!caja) throw new Error(`Caja no encontrada: ${cajaId}`);
    }
    return saldos;
  });
}

// =====================
// CAJAS - SALDOS
// =====================

// Delega a fn_cajas_con_saldos() — 1 round-trip en lugar de 8+ queries.
export async function obtenerCajasConSaldos(_filtros?: {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
}) {
  return withRetry(() => dbCajasConSaldos());
}

// LEGACY KEPT BELOW — referenciado solo internamente para la vista detalle
async function _obtenerCajasConSaldosLegacy(filtros?: {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
}) {
  // Por ahora, ignorar filtros de fecha - el reporte muestra saldos totales
  // Los filtros de fecha se pueden implementar en el frontend si es necesario

  // Obtener datos base en paralelo (minimal - solo lo necesario)
  const [
    cajas,
    monedas,
    ingresosData,
    egresosData,
    donacionesData,
    donacionesTrackingData,
  ] = await Promise.all([
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
    // Ingresos principales: obtener datos y agrupar en JS
    prisma.ingresoMonto.findMany({
      where: { ingreso: { caja: { activa: true } } },
      include: {
        ingreso: { select: { cajaId: true } },
        moneda: { select: { id: true } },
      },
    }),
    // Egresos: agrupar por caja Y moneda
    prisma.egreso.groupBy({
      by: ["cajaId", "monedaId"],
      where: {
        caja: { activa: true },
      },
      _sum: { monto: true },
    }),
    // Donaciones: agrupar por caja Y moneda (dinero real en caja General)
    prisma.donacion.groupBy({
      by: ["cajaId", "monedaId"],
      where: {
        caja: { activa: true },
      },
      _sum: { monto: true },
    }),
    // Donaciones Tracking: para la caja virtual de Donaciones
    prisma.donacionTracking.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    }),
  ]);

  // Obtener ingresos secundarios por caja (para tracking de sociedades)
  const ingresosSecundarios = await prisma.ingresoMonto.findMany({
    where: {
      ingreso: {
        cajaSecundaria: { activa: true },
        cajaSecundariaId: { not: null },
      },
    },
    include: {
      ingreso: { select: { cajaSecundariaId: true } },
      moneda: { select: { id: true } },
    },
  });

  // Mapas para acceso rápido
  const ingresosPrincipalesMap = new Map<string, number>();
  ingresosData.forEach((item) => {
    const key = `${item.ingreso.cajaId}-${item.monedaId}`;
    ingresosPrincipalesMap.set(
      key,
      (ingresosPrincipalesMap.get(key) || 0) + item.monto.toNumber(),
    );
  });
  const ingresosSecundariosMap = new Map<string, number>();
  ingresosSecundarios.forEach((item) => {
    const key = `${item.ingreso.cajaSecundariaId}-${item.monedaId}`;
    ingresosSecundariosMap.set(
      key,
      (ingresosSecundariosMap.get(key) || 0) + item.monto.toNumber(),
    );
  });

  const donacionesMap = new Map<string, number>();
  donacionesData.forEach((don) => {
    donacionesMap.set(
      `${don.cajaId}-${don.monedaId}`,
      Number(don._sum.monto || 0),
    );
  });

  const egresosMap = new Map<string, number>();
  egresosData.forEach((egr) => {
    egresosMap.set(
      `${egr.cajaId}-${egr.monedaId}`,
      Number(egr._sum.monto || 0),
    );
  });

  // Obtener diezmos y egresos filiales AHORA (necesario para caja Filiales)
  const [diezmosFilialesPorMoneda, egresosFilialesPorMoneda] =
    await Promise.all([
      prisma.diezmoFilial.groupBy({
        by: ["monedaId"],
        _sum: { monto: true },
      }),
      prisma.egresoFilial.groupBy({
        by: ["monedaId"],
        _sum: { monto: true },
      }),
    ]);

  const diezmosFilialesMap = new Map<string, number>();
  diezmosFilialesPorMoneda.forEach((item) => {
    diezmosFilialesMap.set(item.monedaId, Number(item._sum.monto || 0));
  });

  const egresosFilialesMap = new Map<string, number>();
  egresosFilialesPorMoneda.forEach((item) => {
    egresosFilialesMap.set(item.monedaId, Number(item._sum.monto || 0));
  });

  // Construir cajas con saldos
  const cajasConSaldos = cajas.map((caja) => {
    const saldos = monedas.map((moneda) => {
      const key = `${caja.id}-${moneda.id}`;
      // Una caja es de seguimiento (tracking) si tiene sociedad o tipo de ingreso asignado,
      // independientemente de si esGeneral está marcado.
      // - Si esGeneral=true en una sub-caja → el dinero va a la Caja General física;
      //   el tracking queda en secundariosMap con esta caja como secundaria.
      // - Si esGeneral=false en una sub-caja → el dinero va directo a esta caja;
      //   queda en principalesMap.
      // Ambos mapas se suman para cubrir datos históricos y datos nuevos.
      const esSubcaja = !!(caja.sociedadId || caja.tipoIngresoId);

      let ingresosBase = esSubcaja
        ? (ingresosSecundariosMap.get(key) || 0) +
          (ingresosPrincipalesMap.get(key) || 0)
        : ingresosPrincipalesMap.get(key) || 0;

      // Si es caja Filiales, agregar diezmos filiales
      if (caja.nombre === "Filiales" && !caja.esGeneral) {
        ingresosBase += diezmosFilialesMap.get(moneda.id) || 0;
      }

      const donaciones = caja.esGeneral ? donacionesMap.get(key) || 0 : 0;
      let ingresos = ingresosBase + donaciones;

      let egresos = egresosMap.get(key) || 0;

      // Si es caja Filiales, agregar egresos filiales
      if (caja.nombre === "Filiales" && !caja.esGeneral) {
        egresos += egresosFilialesMap.get(moneda.id) || 0;
      }

      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos: Math.round(ingresos * 100) / 100,
        egresos: Math.round(egresos * 100) / 100,
        saldo: Math.round((ingresos - egresos) * 100) / 100,
      };
    });

    return {
      ...caja,
      saldos,
    };
  });

  // Cajas virtuales (sin consultas adicionales si es posible)
  const cajasVirtuales: any[] = [];

  // Crear caja virtual de Donaciones usando los datos de tracking
  if (donacionesTrackingData.length > 0) {
    const saldosDonaciones = monedas.map((moneda) => {
      const total =
        donacionesTrackingData.find((d) => d.monedaId === moneda.id)?._sum
          .monto || new Prisma.Decimal(0);
      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos: Number(total),
        egresos: 0,
        saldo: Number(total),
      };
    });

    cajasVirtuales.push({
      id: "virtual-donaciones",
      nombre: "Donaciones",
      descripcion: "Resumen de todas las donaciones recibidas",
      activa: true,
      esGeneral: false,
      sociedadId: null,
      tipoIngresoId: null,
      sociedad: null,
      tipoIngreso: null,
      orden: 9998,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      saldos: saldosDonaciones,
      esVirtual: true,
    });
  }

  // IMPORTANTE: Si existe una caja "Filiales" real, no crear virtual
  // La caja real contiene los saldos reales de los diezmos y egresos
  const cajaFilialesReal = cajas.find(
    (c) => c.nombre === "Filiales" && !c.esGeneral,
  );

  if (
    !cajaFilialesReal &&
    (diezmosFilialesPorMoneda.length > 0 || egresosFilialesPorMoneda.length > 0)
  ) {
    const saldosFiliales = monedas.map((moneda) => {
      const diezmo = diezmosFilialesPorMoneda.find(
        (d) => d.monedaId === moneda.id,
      );
      const egreso = egresosFilialesPorMoneda.find(
        (e) => e.monedaId === moneda.id,
      );
      const ingresos = Number(diezmo?._sum.monto || 0);
      const egresos = Number(egreso?._sum.monto || 0);
      return {
        monedaId: moneda.id,
        monedaCodigo: moneda.codigo,
        monedaSimbolo: moneda.simbolo,
        ingresos,
        egresos,
        saldo: ingresos - egresos,
      };
    });

    cajasVirtuales.push({
      id: "virtual-filiales",
      nombre: "Filiales",
      descripcion: "Diezmos y egresos de todas las filiales",
      activa: true,
      esGeneral: false,
      sociedadId: null,
      tipoIngresoId: null,
      sociedad: null,
      tipoIngreso: null,
      orden: 9999,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      saldos: saldosFiliales,
      esVirtual: true,
    });
  }

  const todasLasCajas = [...cajasConSaldos, ...cajasVirtuales];
  const monedasSerializadas = monedas.map(serializarMoneda);

  return { cajas: todasLasCajas, monedas: monedasSerializadas };
}

// =====================
// CAJAS VIRTUALES - DETALLE (usa legacy directamente)
// =====================

async function obtenerDetalleCajaDonaciones() {
  const monedas = await prisma.moneda.findMany({
    where: { activa: true },
    orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
  });

  // Usar donacionesTracking para la caja virtual de Donaciones
  const donaciones = await prisma.donacionTracking.findMany({
    include: {
      tipoOfrenda: true,
      moneda: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: { fecha: "desc" },
    take: 100,
  });

  // Calcular saldos usando donacionesTracking
  const donacionesPorMoneda = await prisma.donacionTracking.groupBy({
    by: ["monedaId"],
    _sum: { monto: true },
  });

  const saldos = monedas.map((moneda) => {
    const total =
      donacionesPorMoneda.find((d) => d.monedaId === moneda.id)?._sum.monto ||
      new Prisma.Decimal(0);
    return {
      moneda: serializarMoneda(moneda),
      ingresos: Number(total),
      donaciones: Number(total),
      egresos: 0,
      saldo: Number(total),
    };
  });

  const donacionesSerializadas = donaciones.map((don) => ({
    ...don,
    monto: Number(don.monto),
    moneda: serializarMoneda(don.moneda),
  }));

  return {
    caja: {
      id: "virtual-donaciones",
      nombre: "Donaciones",
      descripcion: "Resumen de todas las donaciones recibidas",
      activa: true,
      esGeneral: false,
      sociedadId: null,
      tipoIngresoId: null,
      sociedad: null,
      tipoIngreso: null,
    },
    ingresos: [],
    ingresosSecundarios: [],
    egresos: [],
    donaciones: donacionesSerializadas,
    diezmosFiliales: [],
    egresosFiliales: [],
    saldos,
    monedas: monedas.map(serializarMoneda),
  };
}

async function obtenerDetalleCajaFiliales() {
  const monedas = await prisma.moneda.findMany({
    where: { activa: true },
    orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
  });

  const [diezmos, egresos] = await Promise.all([
    prisma.diezmoFilial.findMany({
      include: {
        filial: true,
        moneda: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
      take: 100,
    }),
    prisma.egresoFilial.findMany({
      include: {
        tipoGasto: true,
        moneda: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaSalida: "desc" },
      take: 100,
    }),
  ]);

  // Calcular saldos
  const [diezmosPorMoneda, egresosPorMoneda] = await Promise.all([
    prisma.diezmoFilial.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    }),
    prisma.egresoFilial.groupBy({
      by: ["monedaId"],
      _sum: { monto: true },
    }),
  ]);

  const saldos = monedas.map((moneda) => {
    const totalIngresos =
      diezmosPorMoneda.find((d) => d.monedaId === moneda.id)?._sum.monto ||
      new Prisma.Decimal(0);
    const totalEgresos =
      egresosPorMoneda.find((e) => e.monedaId === moneda.id)?._sum.monto ||
      new Prisma.Decimal(0);
    return {
      moneda: serializarMoneda(moneda),
      ingresos: Number(totalIngresos),
      donaciones: 0,
      egresos: Number(totalEgresos),
      saldo: Number(totalIngresos) - Number(totalEgresos),
    };
  });

  const diezmosSerializados = diezmos.map((dz) => ({
    ...dz,
    monto: Number(dz.monto),
    moneda: serializarMoneda(dz.moneda),
  }));

  // EgresoFilial no tiene campo numeroFactura
  const egresosSerializados = egresos.map((eg: any) => ({
    ...eg,
    monto: Number(eg.monto),
    moneda: serializarMoneda(eg.moneda),
  }));

  return {
    caja: {
      id: "virtual-filiales",
      nombre: "Filiales",
      descripcion: "Diezmos y egresos de todas las filiales",
      activa: true,
      esGeneral: false,
      sociedadId: null,
      tipoIngresoId: null,
      sociedad: null,
      tipoIngreso: null,
    },
    ingresos: [],
    ingresosSecundarios: [],
    egresos: [],
    donaciones: [],
    diezmosFiliales: diezmosSerializados,
    egresosFiliales: egresosSerializados,
    saldos,
    monedas: monedas.map(serializarMoneda),
  };
}

export async function obtenerDetalleCaja(cajaId: string) {
  // Verificar si es caja virtual
  if (cajaId === "virtual-donaciones") {
    return await obtenerDetalleCajaDonaciones();
  }
  if (cajaId === "virtual-filiales") {
    return await obtenerDetalleCajaFiliales();
  }

  const caja = await prisma.caja.findUnique({
    where: { id: cajaId },
    include: {
      sociedad: true,
      tipoIngreso: true,
    },
  });

  if (!caja) return null;

  const esSubcaja = !caja.esGeneral && (caja.sociedadId || caja.tipoIngresoId);
  const esCajaFiliales = caja.nombre === "Filiales" && !caja.esGeneral;

  const limiteIngresosPrincipales = esSubcaja ? 200 : 500;
  const limiteIngresosSecundarios = esSubcaja ? 500 : 200;
  const limiteEgresos = esSubcaja ? 200 : 500;
  const limiteDonaciones = esSubcaja ? 200 : 500;

  // Todas las queries en paralelo — 1 roundtrip en lugar de 8+ secuenciales
  const [
    ingresos,
    ingresosSecundarios,
    egresos,
    donaciones,
    diezmosFiliales,
    egresosFiliales,
    monedas,
    ingresosSumPorMoneda,
    egresosSumPorMoneda,
    donacionesSumPorMoneda,
    diezmosFilialesSumPorMoneda,
    egresosFilialesSumPorMoneda,
  ] = await Promise.all([
    prisma.ingreso.findMany({
      where: { cajaId },
      include: {
        sociedad: true,
        tipoIngreso: true,
        servicio: true,
        montos: { include: { moneda: true } },
        cajaSecundaria: true,
      },
      orderBy: { fechaRecaudacion: "desc" },
      take: limiteIngresosPrincipales,
    }),
    prisma.ingreso.findMany({
      where: { cajaSecundariaId: cajaId },
      include: {
        sociedad: true,
        tipoIngreso: true,
        servicio: true,
        montos: { include: { moneda: true } },
        caja: true,
      },
      orderBy: { fechaRecaudacion: "desc" },
      take: limiteIngresosSecundarios,
    }),
    prisma.egreso.findMany({
      where: { cajaId },
      include: { tipoGasto: true, moneda: true },
      orderBy: { fechaSalida: "desc" },
      take: limiteEgresos,
    }),
    caja.esGeneral
      ? prisma.donacion.findMany({
          where: { cajaId },
          include: {
            tipoOfrenda: true,
            moneda: true,
            usuario: { select: { id: true, nombre: true } },
          },
          orderBy: { fecha: "desc" },
          take: limiteDonaciones,
        })
      : Promise.resolve(
          [] as Awaited<ReturnType<typeof prisma.donacion.findMany>>,
        ),
    prisma.diezmoFilial.findMany({
      include: {
        filial: true,
        moneda: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
      take: 30,
    }),
    prisma.egresoFilial.findMany({
      include: {
        tipoGasto: true,
        moneda: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaSalida: "desc" },
      take: 30,
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
    // groupBy: el motor SQL hace el SUM, no JS iterando cada fila
    esSubcaja
      ? prisma.ingresoMonto.groupBy({
          by: ["monedaId"],
          where: { ingreso: { cajaSecundariaId: cajaId } },
          _sum: { monto: true },
        })
      : prisma.ingresoMonto.groupBy({
          by: ["monedaId"],
          where: { ingreso: { cajaId } },
          _sum: { monto: true },
        }),
    prisma.egreso.groupBy({
      by: ["monedaId"],
      where: { cajaId },
      _sum: { monto: true },
    }),
    caja.esGeneral
      ? prisma.donacion.groupBy({
          by: ["monedaId"],
          where: { cajaId },
          _sum: { monto: true },
        })
      : Promise.resolve(
          [] as { monedaId: string; _sum: { monto: Prisma.Decimal | null } }[],
        ),
    esCajaFiliales
      ? prisma.diezmoFilial.groupBy({ by: ["monedaId"], _sum: { monto: true } })
      : Promise.resolve(
          [] as { monedaId: string; _sum: { monto: Prisma.Decimal | null } }[],
        ),
    esCajaFiliales
      ? prisma.egresoFilial.groupBy({ by: ["monedaId"], _sum: { monto: true } })
      : Promise.resolve(
          [] as { monedaId: string; _sum: { monto: Prisma.Decimal | null } }[],
        ),
  ]);

  // Construir mapas de saldos a partir de los groupBy (O(1) lookup vs O(n) Array.find)
  const ingresosMap = new Map<string, number>();
  ingresosSumPorMoneda.forEach((item) => {
    ingresosMap.set(item.monedaId, Number(item._sum.monto ?? 0));
  });
  if (esCajaFiliales) {
    diezmosFilialesSumPorMoneda.forEach((item) => {
      ingresosMap.set(
        item.monedaId,
        (ingresosMap.get(item.monedaId) ?? 0) + Number(item._sum.monto ?? 0),
      );
    });
  }

  const egresosMap = new Map<string, number>();
  egresosSumPorMoneda.forEach((item) => {
    egresosMap.set(item.monedaId, Number(item._sum.monto ?? 0));
  });
  if (esCajaFiliales) {
    egresosFilialesSumPorMoneda.forEach((item) => {
      egresosMap.set(
        item.monedaId,
        (egresosMap.get(item.monedaId) ?? 0) + Number(item._sum.monto ?? 0),
      );
    });
  }

  const donacionesMap = new Map<string, number>();
  donacionesSumPorMoneda.forEach((item) => {
    donacionesMap.set(item.monedaId, Number(item._sum.monto ?? 0));
  });

  const saldos = monedas.map((moneda) => {
    const totalIngresos = ingresosMap.get(moneda.id) ?? 0;
    const totalEgresos = egresosMap.get(moneda.id) ?? 0;
    const totalDonaciones = donacionesMap.get(moneda.id) ?? 0;
    const totalIngresosConDonaciones = totalIngresos + totalDonaciones;

    return {
      moneda: serializarMoneda(moneda),
      ingresos: Math.round(totalIngresos * 100) / 100,
      donaciones: Math.round(totalDonaciones * 100) / 100,
      egresos: Math.round(totalEgresos * 100) / 100,
      saldo:
        Math.round((totalIngresosConDonaciones - totalEgresos) * 100) / 100,
    };
  });

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

  const egresosSerializados = egresos.map((eg) => ({
    ...eg,
    monto: Number(eg.monto),
    numeroFactura: eg.numeroFactura,
    moneda: serializarMoneda(eg.moneda),
  }));

  const donacionesSerializadas = (donaciones as any[]).map((don) => ({
    ...don,
    monto: Number(don.monto),
    moneda: serializarMoneda(don.moneda),
  }));

  const diezmosFilialesSerializados = diezmosFiliales.map((dz) => ({
    ...dz,
    monto: Number(dz.monto),
    moneda: serializarMoneda(dz.moneda),
  }));

  const egresosFilialesSerializados = egresosFiliales.map((eg) => ({
    ...eg,
    monto: Number(eg.monto),
    moneda: serializarMoneda(eg.moneda),
  }));

  return {
    caja,
    ingresos: ingresosSerializados,
    ingresosSecundarios: ingresosSecundariosSerializados,
    egresos: egresosSerializados,
    donaciones: donacionesSerializadas,
    diezmosFiliales: diezmosFilialesSerializados,
    egresosFiliales: egresosFilialesSerializados,
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

const CIERRE_DIEZMO_COMENTARIO = "[CIERRE_DIEZMO_10]";

type EstadoCierreDiezmo = "NO_REALIZADO" | "REALIZADO";

interface ResumenDiezmoUSD {
  anio: number;
  mes: number;
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  cajaOrigenId: string;
  cajaOrigenNombre: string;
  totalOfrendas: number;
  totalEgresos: number;
  baseLiquida: number;
  porcentaje: number;
  montoDiezmo: number;
  estado: EstadoCierreDiezmo;
  transferido: number;
  cajaDestinoId: string | null;
  cajaDestinoNombre: string | null;
  realizadoEn: Date | null;
  puedeAplicar: boolean;
  nota: string | null;
}

function redondear2(valor: number): number {
  return valor >= 0
    ? Math.floor(valor * 100) / 100
    : Math.ceil(valor * 100) / 100;
}

function obtenerPartesFechaElSalvador(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const anio = Number(partes.find((p) => p.type === "year")?.value || 0);
  const mes = Number(partes.find((p) => p.type === "month")?.value || 0);
  const dia = Number(partes.find((p) => p.type === "day")?.value || 0);

  return { anio, mes, dia };
}

async function calcularBaseDiezmoUSDConCliente(
  db: typeof prisma | Prisma.TransactionClient,
  params: {
    monedaUsdId: string;
    cajaGeneralId: string;
    fechaInicio: Date;
    fechaFin: Date;
  },
) {
  const [ingresosOfrendaUsd, donacionesOfrendaUsd, egresosUsd] =
    await Promise.all([
      db.ingresoMonto.aggregate({
        _sum: { monto: true },
        where: {
          monedaId: params.monedaUsdId,
          ingreso: {
            cajaId: params.cajaGeneralId,
            fechaRecaudacion: {
              gte: params.fechaInicio,
              lte: params.fechaFin,
            },
            tipoIngreso: {
              nombre: {
                contains: "ofrenda",
                mode: "insensitive",
              },
            },
            OR: [
              { comentario: null },
              {
                comentario: {
                  not: {
                    contains: CIERRE_DIEZMO_COMENTARIO,
                  },
                },
              },
            ],
          },
        },
      }),
      db.donacion.aggregate({
        _sum: { monto: true },
        where: {
          cajaId: params.cajaGeneralId,
          monedaId: params.monedaUsdId,
          fecha: {
            gte: params.fechaInicio,
            lte: params.fechaFin,
          },
          tipoOfrenda: {
            nombre: {
              contains: "ofrenda",
              mode: "insensitive",
            },
          },
          OR: [
            { comentario: null },
            {
              comentario: {
                not: {
                  contains: CIERRE_DIEZMO_COMENTARIO,
                },
              },
            },
          ],
        },
      }),
      db.egreso.aggregate({
        _sum: { monto: true },
        where: {
          cajaId: params.cajaGeneralId,
          monedaId: params.monedaUsdId,
          fechaSalida: {
            gte: params.fechaInicio,
            lte: params.fechaFin,
          },
          OR: [
            { comentario: null },
            {
              comentario: {
                not: {
                  contains: CIERRE_DIEZMO_COMENTARIO,
                },
              },
            },
          ],
        },
      }),
    ]);

  const totalOfrendas = redondear2(
    Number(ingresosOfrendaUsd._sum.monto || 0) +
      Number(donacionesOfrendaUsd._sum.monto || 0),
  );
  const totalEgresos = redondear2(Number(egresosUsd._sum.monto || 0));
  const baseLiquida = redondear2(totalOfrendas - totalEgresos);
  const montoCalculado = baseLiquida > 0 ? redondear2(baseLiquida * 0.1) : 0;

  return {
    totalOfrendas,
    totalEgresos,
    baseLiquida,
    montoCalculado,
  };
}

function obtenerPeriodoMensual(fechaInicio: Date, fechaFin: Date) {
  const inicioSV = obtenerPartesFechaElSalvador(fechaInicio);
  const finSV = obtenerPartesFechaElSalvador(fechaFin);

  if (inicioSV.anio !== finSV.anio || inicioSV.mes !== finSV.mes) {
    return null;
  }

  const anio = inicioSV.anio;
  const mes = inicioSV.mes;

  const inicioMes = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
  const finMes = new Date(anio, mes, 0, 23, 59, 59, 999);
  const ultimoDiaMes = new Date(anio, mes, 0).getDate();

  const esMesCompleto = inicioSV.dia === 1 && finSV.dia === ultimoDiaMes;

  return {
    anio,
    mes,
    inicioMes,
    finMes,
    esMesCompleto,
  };
}

async function calcularResumenDiezmoUSD(
  fechaInicio: Date,
  fechaFin: Date,
): Promise<ResumenDiezmoUSD | null> {
  const periodo = obtenerPeriodoMensual(fechaInicio, fechaFin);
  if (!periodo) return null;

  const [monedaUsd, cajaGeneral] = await Promise.all([
    prisma.moneda.findFirst({
      where: { codigo: "USD", activa: true },
      select: { id: true, codigo: true, simbolo: true },
    }),
    prisma.caja.findFirst({
      where: { esGeneral: true, activa: true },
      select: { id: true, nombre: true },
    }),
  ]);

  if (!monedaUsd || !cajaGeneral) {
    return null;
  }

  const base = await calcularBaseDiezmoUSDConCliente(prisma, {
    monedaUsdId: monedaUsd.id,
    cajaGeneralId: cajaGeneral.id,
    fechaInicio: periodo.inicioMes,
    fechaFin: periodo.finMes,
  });

  let cierreActual: {
    estado: string;
    montoDiezmo: Prisma.Decimal;
    cajaDestinoId: string | null;
    realizadoEn: Date | null;
    nota: string | null;
    cajaDestino: { nombre: string } | null;
  } | null = null;

  try {
    cierreActual = await prisma.cierreDiezmoMensual.findUnique({
      where: {
        anio_mes_monedaId: {
          anio: periodo.anio,
          mes: periodo.mes,
          monedaId: monedaUsd.id,
        },
      },
      select: {
        estado: true,
        montoDiezmo: true,
        cajaDestinoId: true,
        realizadoEn: true,
        nota: true,
        cajaDestino: { select: { nombre: true } },
      },
    });
  } catch (error) {
    const prismaError = error as { code?: string; message?: string };
    const mensaje = prismaError?.message || "";
    // Si la migracion no se aplico aun, evitamos romper reportes.
    const tablaCierreNoDisponible =
      prismaError?.code === "P2021" ||
      mensaje.includes("cierres_diezmo_mensual") ||
      mensaje.includes("cierreDiezmoMensual");

    if (!tablaCierreNoDisponible) {
      throw error;
    }
  }

  const estado =
    (cierreActual?.estado as EstadoCierreDiezmo | undefined) || "NO_REALIZADO";
  const transferido =
    estado === "REALIZADO" ? Number(cierreActual?.montoDiezmo || 0) : 0;

  return {
    anio: periodo.anio,
    mes: periodo.mes,
    monedaId: monedaUsd.id,
    monedaCodigo: monedaUsd.codigo,
    monedaSimbolo: monedaUsd.simbolo,
    cajaOrigenId: cajaGeneral.id,
    cajaOrigenNombre: cajaGeneral.nombre,
    totalOfrendas: base.totalOfrendas,
    totalEgresos: base.totalEgresos,
    baseLiquida: base.baseLiquida,
    porcentaje: 10,
    montoDiezmo: base.montoCalculado,
    estado,
    transferido,
    cajaDestinoId: cierreActual?.cajaDestinoId || null,
    cajaDestinoNombre: cierreActual?.cajaDestino?.nombre || null,
    realizadoEn: cierreActual?.realizadoEn || null,
    puedeAplicar:
      periodo.esMesCompleto &&
      base.montoCalculado > 0 &&
      estado !== "REALIZADO",
    nota: cierreActual?.nota || null,
  };
}

export async function obtenerDatosReporte(filtros: FiltrosReporte) {
  const whereIngresos: any = {};
  const whereEgresos: any = {};
  const whereDonaciones: any = {};
  const whereDiezmosFiliales: any = {};
  const whereEgresosFiliales: any = {};

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
    whereDonaciones.fecha = {
      ...whereDonaciones.fecha,
      gte: fechaInicio,
    };
    whereDiezmosFiliales.creadoEn = {
      ...whereDiezmosFiliales.creadoEn,
      gte: fechaInicio,
    };
    whereEgresosFiliales.fechaSalida = {
      ...whereEgresosFiliales.fechaSalida,
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
    whereDonaciones.fecha = {
      ...whereDonaciones.fecha,
      lte: fechaFin,
    };
    whereDiezmosFiliales.creadoEn = {
      ...whereDiezmosFiliales.creadoEn,
      lte: fechaFin,
    };
    whereEgresosFiliales.fechaSalida = {
      ...whereEgresosFiliales.fechaSalida,
      lte: fechaFin,
    };
  }
  if (filtros.cajaId) {
    // Para ingresos, buscar tanto en caja principal como en caja secundaria
    // (el tracking secundario solo se usa para ofrendas)
    whereIngresos.OR = [
      { cajaId: filtros.cajaId },
      { cajaSecundariaId: filtros.cajaId },
    ];
    whereEgresos.cajaId = filtros.cajaId;
    whereDonaciones.cajaId = filtros.cajaId;
    // Los movimientos de filiales NO deben aparecer cuando se filtra por caja específica
    // ya que tienen su propia "Caja Filiales" virtual
  }
  if (filtros.sociedadId) {
    whereIngresos.sociedadId = filtros.sociedadId;
    // Las donaciones, diezmos y egresos de filiales NO tienen sociedad asociada
    // Por lo tanto, cuando se filtra por sociedad, NO debemos mostrarlos
    // Solo mostramos ingresos de esa sociedad específica
  }

  const [
    ingresos,
    egresos,
    donaciones,
    diezmosFiliales,
    egresosFiliales,
    sociedades,
    cajas,
    monedasRaw,
  ] = await Promise.all([
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
    // Si hay filtro de sociedad, NO traer donaciones ni diezmos filiales
    // porque estos no pertenecen a ninguna sociedad específica
    prisma.donacion.findMany({
      where: filtros.sociedadId ? { id: "none-match" } : whereDonaciones,
      include: {
        tipoOfrenda: true,
        caja: true,
        moneda: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.diezmoFilial.findMany({
      where:
        filtros.sociedadId || filtros.cajaId
          ? { id: "none-match" }
          : whereDiezmosFiliales,
      include: {
        filial: { include: { pais: true } },
        moneda: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.egresoFilial.findMany({
      where:
        filtros.sociedadId || filtros.cajaId
          ? { id: "none-match" }
          : whereEgresosFiliales,
      include: {
        tipoGasto: true,
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

  const donacionesSerializadas = donaciones.map((don) => {
    const conceptoBase = `Donación - ${don.nombre}`;
    const referencia = don.numeroDocumento
      ? ` (DUI: ${don.numeroDocumento})`
      : "";
    return {
      id: don.id,
      fecha: don.fecha,
      tipo: "Ingreso" as const,
      concepto: conceptoBase + referencia,
      sociedad: "Donación" as string,
      caja: don.caja.nombre,
      tipoIngreso: don.tipoOfrenda.nombre,
      numeroDocumento: don.numeroDocumento || undefined,
      comentario: don.comentario || undefined,
      usuario: don.usuario
        ? `${don.usuario.nombre} ${don.usuario.apellido}`
        : undefined,
      montos: [
        {
          monto: Number(don.monto),
          monedaId: don.monedaId,
          monedaCodigo: don.moneda.codigo,
          monedaSimbolo: don.moneda.simbolo,
        },
      ],
    };
  });

  const diezmosSerializados = diezmosFiliales.map((dz) => ({
    id: dz.id,
    fecha: dz.creadoEn,
    tipo: "Ingreso" as const,
    concepto: `Diezmo Filial - ${dz.filial.nombre} (${dz.filial.pais.nombre})`,
    sociedad: "Filial" as string,
    caja: "Caja Filiales",
    tipoIngreso: "Diezmo Filial",
    comentario: dz.comentario || undefined,
    usuario: dz.usuario
      ? `${dz.usuario.nombre} ${dz.usuario.apellido}`
      : undefined,
    montos: [
      {
        monto: Number(dz.monto),
        monedaId: dz.monedaId,
        monedaCodigo: dz.moneda.codigo,
        monedaSimbolo: dz.moneda.simbolo,
      },
    ],
  }));

  const egresosSerializados = egresos.map((eg) => {
    const conceptoBase = eg.descripcionGasto || eg.tipoGasto.nombre;
    const referencia = eg.numeroFactura
      ? ` (Factura: ${eg.numeroFactura})`
      : "";
    return {
      id: eg.id,
      fecha: eg.fechaSalida,
      tipo: "Egreso" as const,
      concepto: conceptoBase + referencia,
      sociedad: null,
      caja: eg.caja.nombre,
      tipoGasto: eg.tipoGasto.nombre,
      solicitante: eg.solicitante,
      numeroFactura: eg.numeroFactura || undefined,
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
    };
  });

  const egresosFilalesSerializados = egresosFiliales.map((eg) => ({
    id: eg.id,
    fecha: eg.fechaSalida,
    tipo: "Egreso" as const,
    concepto: eg.descripcionGasto || eg.tipoGasto.nombre,
    sociedad: null,
    caja: "Caja Filiales",
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

  const cierreDiezmo =
    fechaInicio && fechaFin
      ? await calcularResumenDiezmoUSD(fechaInicio, fechaFin)
      : null;

  return {
    ingresos: [
      ...ingresosSerializados,
      ...donacionesSerializadas,
      ...diezmosSerializados,
    ],
    egresos: [...egresosSerializados, ...egresosFilalesSerializados],
    sociedades,
    cajas,
    monedas: monedasRaw.map(serializarMoneda),
    cierreDiezmo,
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
  filtros: FiltrosReporteAnalitico,
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
    donaciones,
    diezmosFiliales,
    egresosFiliales,
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
    prisma.donacion.findMany({
      where: {
        fecha: { gte: inicioRango, lte: finRango },
        ...(filtros.monedaId ? { monedaId: filtros.monedaId } : {}),
      },
      include: {
        tipoOfrenda: true,
        caja: true,
        moneda: true,
      },
    }),
    prisma.diezmoFilial.findMany({
      where: {
        creadoEn: { gte: inicioRango, lte: finRango },
        ...(filtros.monedaId ? { monedaId: filtros.monedaId } : {}),
      },
      include: {
        filial: true,
        moneda: true,
      },
    }),
    prisma.egresoFilial.findMany({
      where: {
        fechaSalida: { gte: inicioRango, lte: finRango },
        ...(filtros.monedaId ? { monedaId: filtros.monedaId } : {}),
      },
      include: {
        tipoGasto: true,
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
        ing.montos.some((m) => m.monedaId === filtros.monedaId),
      )
    : ingresos;

  // 1. Datos mensuales para gráfica de tendencia
  const datosMensuales = Array.from({ length: 12 }, (_, mes) => {
    const ingresosDelMes = ingresosFiltrados.filter(
      (ing) => new Date(ing.fechaRecaudacion).getMonth() === mes,
    );
    const donacionesDelMes = donaciones.filter(
      (don) => new Date(don.fecha).getMonth() === mes,
    );
    const diezmosDelMes = diezmosFiliales.filter(
      (dz) => new Date(dz.creadoEn).getMonth() === mes,
    );
    const egresosDelMes = egresos.filter(
      (eg) => new Date(eg.fechaSalida).getMonth() === mes,
    );
    const egresosFilalesDelMes = egresosFiliales.filter(
      (eg) => new Date(eg.fechaSalida).getMonth() === mes,
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

    donacionesDelMes.forEach((don) => {
      totalIngresos += Number(don.monto);
    });

    diezmosDelMes.forEach((dz) => {
      totalIngresos += Number(dz.monto);
    });

    egresosDelMes.forEach((eg) => {
      totalEgresos += Number(eg.monto);
    });

    egresosFilalesDelMes.forEach((eg) => {
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
      (ing) => ing.sociedadId === soc.id,
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
      (ing) => ing.tipoIngresoId === tipo.id,
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
    // Incluir ingresos donde esta caja es principal O secundaria
    // (tracking secundario solo para ofrendas)
    const ingresosDeCaja = ingresosFiltrados.filter(
      (ing) => ing.cajaId === caja.id || ing.cajaSecundariaId === caja.id,
    );
    const donacionesDeCaja = donaciones.filter((don) => don.cajaId === caja.id);
    const egresosDeCaja = egresos.filter((eg) => eg.cajaId === caja.id);

    let totalIngresos = 0;
    ingresosDeCaja.forEach((ing) => {
      ing.montos.forEach((m) => {
        if (!filtros.monedaId || m.monedaId === filtros.monedaId) {
          totalIngresos += Number(m.monto);
        }
      });
    });

    donacionesDeCaja.forEach((don) => {
      totalIngresos += Number(don.monto);
    });

    const totalEgresos = egresosDeCaja.reduce(
      (sum, eg) => sum + Number(eg.monto),
      0,
    );

    return {
      id: caja.id,
      nombre: caja.nombre,
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
    };
  });

  // Agregar "Caja Filiales" (virtual) si hay movimientos de filiales
  const totalDiezmosFiliales = diezmosFiliales.reduce(
    (sum, dz) => sum + Number(dz.monto),
    0,
  );
  const totalEgresosFiliales = egresosFiliales.reduce(
    (sum, eg) => sum + Number(eg.monto),
    0,
  );

  if (totalDiezmosFiliales > 0 || totalEgresosFiliales > 0) {
    porCaja.push({
      id: "filiales",
      nombre: "Caja Filiales",
      ingresos: totalDiezmosFiliales,
      egresos: totalEgresosFiliales,
      balance: totalDiezmosFiliales - totalEgresosFiliales,
    });
  }

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

  donaciones.forEach((don) => {
    totalIngresosAnio += Number(don.monto);
  });

  diezmosFiliales.forEach((dz) => {
    totalIngresosAnio += Number(dz.monto);
  });

  totalEgresosAnio = egresos.reduce((sum, eg) => sum + Number(eg.monto), 0);
  totalEgresosAnio += egresosFiliales.reduce(
    (sum, eg) => sum + Number(eg.monto),
    0,
  );

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
      cantidadIngresos:
        ingresosFiltrados.length + donaciones.length + diezmosFiliales.length,
      cantidadEgresos: egresos.length + egresosFiliales.length,
    },
    monedas: monedasRaw.map(serializarMoneda),
  };
}

// =====================
// REPORTE DE SALDOS ACTUALES
// =====================

export async function obtenerReporteSaldosActuales() {
  return withRetry(async () => {
    // Reporte de saldos actuales - muestra todos los saldos sin filtros
    const { cajas, monedas } = await obtenerCajasConSaldos();

    // Filtrar solo cajas reales (no virtuales)
    const cajasReales = cajas.filter(
      (c) => !("esVirtual" in c) || !(c as any).esVirtual,
    );
    const cajasVirtuales = cajas.filter(
      (c) => "esVirtual" in c && (c as any).esVirtual,
    );

    // Organizar datos por tipo
    const cajasGenerales = cajasReales.filter((c) => c.esGeneral);
    const cajasSociedades = cajasReales.filter(
      (c) => !c.esGeneral && c.sociedadId,
    );
    const cajasOtras = cajasReales.filter((c) => !c.esGeneral && !c.sociedadId);

    // Calcular totales por moneda
    const totalesPorMoneda: Record<
      string,
      { ingresos: number; egresos: number; saldo: number }
    > = {};

    cajasReales.forEach((caja: any) => {
      (caja.saldos || []).forEach((saldo: any) => {
        if (!totalesPorMoneda[saldo.monedaId]) {
          totalesPorMoneda[saldo.monedaId] = {
            ingresos: 0,
            egresos: 0,
            saldo: 0,
          };
        }
        totalesPorMoneda[saldo.monedaId].ingresos += saldo.ingresos;
        totalesPorMoneda[saldo.monedaId].egresos += saldo.egresos;
        totalesPorMoneda[saldo.monedaId].saldo += saldo.saldo;
      });
    });

    return {
      fecha: new Date(),
      cajasGenerales,
      cajasSociedades,
      cajasOtras,
      cajasVirtuales,
      totalesPorMoneda,
      monedas,
      totalCajas: cajasReales.length,
    };
  });
}

// =====================
// AUDITORÍA
// =====================

export interface FiltrosAuditoria {
  usuarioId?: string;
  tabla?: string;
  operacion?: "CREATE" | "UPDATE" | "DELETE";
  fechaInicio?: Date;
  fechaFin?: Date;
  limite?: number;
}

export async function obtenerLogAuditoria(filtros: FiltrosAuditoria) {
  // Solo admin puede ver auditoría
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  const rol = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuario.id },
    select: { rol: { select: { esAdmin: true } } },
  });

  if (!rol.rol?.esAdmin) {
    throw new Error("No tienes permiso para ver la auditoría");
  }

  const where: Prisma.AuditoriaLogWhereInput = {};

  if (filtros.usuarioId) {
    where.usuarioId = filtros.usuarioId;
  }

  if (filtros.tabla) {
    where.tabla = {
      contains: filtros.tabla,
      mode: "insensitive",
    };
  }

  if (filtros.operacion) {
    where.operacion = filtros.operacion;
  }

  if (filtros.fechaInicio || filtros.fechaFin) {
    where.fechaOperacion = {};
    if (filtros.fechaInicio) {
      where.fechaOperacion.gte = filtros.fechaInicio;
    }
    if (filtros.fechaFin) {
      where.fechaOperacion.lte = filtros.fechaFin;
    }
  }

  return withRetry(() =>
    prisma.auditoriaLog.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
      orderBy: {
        fechaOperacion: "desc",
      },
      take: filtros.limite || 100,
    }),
  );
}

export async function obtenerEstadisticasAuditoria() {
  // Solo admin puede ver estadísticas de auditoría
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  const rol = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuario.id },
    select: { rol: { select: { esAdmin: true } } },
  });

  if (!rol.rol?.esAdmin) {
    throw new Error("No tienes permiso para ver estadísticas de auditoría");
  }

  const ahora = new Date();
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOperaciones,
    operacionesPor7Dias,
    operacionesPor30Dias,
    porOperacion,
    porTabla,
    usuariosActivos,
  ] = await Promise.all([
    prisma.auditoriaLog.count(),
    prisma.auditoriaLog.count({
      where: {
        fechaOperacion: {
          gte: hace7Dias,
        },
      },
    }),
    prisma.auditoriaLog.count({
      where: {
        fechaOperacion: {
          gte: hace30Dias,
        },
      },
    }),
    prisma.auditoriaLog.groupBy({
      by: ["operacion"],
      _count: {
        id: true,
      },
    }),
    prisma.auditoriaLog.groupBy({
      by: ["tabla"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    }),
    prisma.auditoriaLog.findMany({
      select: {
        usuarioId: true,
      },
      distinct: ["usuarioId"],
    }),
  ]);

  return {
    totalOperaciones,
    operacionesPor7Dias,
    operacionesPor30Dias,
    porOperacion: porOperacion.map((item) => ({
      operacion: item.operacion,
      cantidad: item._count.id,
    })),
    porTabla: porTabla.map((item) => ({
      tabla: item.tabla,
      cantidad: item._count.id,
    })),
    usuariosActivos: usuariosActivos.length,
  };
}

// =====================
// CIERRE MENSUAL DIEZMO 10% (USD)
// =====================

async function obtenerCatalogosTransferencia(
  tx: Prisma.TransactionClient,
  usuarioId: string,
) {
  const [tipoGasto, tipoIngreso, sociedad, servicio] = await Promise.all([
    tx.tipoGasto.upsert({
      where: { nombre: "Transferencia Diezmo 10%" },
      update: {},
      create: {
        nombre: "Transferencia Diezmo 10%",
        descripcion: "Salida por cierre mensual de diezmo (10%)",
        orden: 997,
        creadoPorId: usuarioId,
      },
      select: { id: true },
    }),
    tx.tipoIngreso.upsert({
      where: { nombre: "Transferencia Diezmo 10%" },
      update: {},
      create: {
        nombre: "Transferencia Diezmo 10%",
        descripcion: "Ingreso por transferencia interna de cierre mensual",
        orden: 997,
        creadoPorId: usuarioId,
      },
      select: { id: true },
    }),
    tx.sociedad.upsert({
      where: { nombre: "Sistema" },
      update: {},
      create: {
        nombre: "Sistema",
        descripcion: "Entidad técnica para operaciones automáticas",
        orden: 998,
        creadoPorId: usuarioId,
      },
      select: { id: true },
    }),
    tx.tipoServicio.upsert({
      where: { nombre: "Sistema" },
      update: {},
      create: {
        nombre: "Sistema",
        descripcion: "Servicio técnico para operaciones automáticas",
        orden: 998,
        creadoPorId: usuarioId,
      },
      select: { id: true },
    }),
  ]);

  return {
    tipoGastoId: tipoGasto.id,
    tipoIngresoId: tipoIngreso.id,
    sociedadId: sociedad.id,
    servicioId: servicio.id,
  };
}

export async function obtenerEstadoCierreDiezmoMensual(
  anio: number,
  mes: number,
) {
  const inicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mes, 0, 23, 59, 59, 999);
  return calcularResumenDiezmoUSD(inicio, fin);
}

export async function aplicarTransferenciaDiezmoMensual(params: {
  anio: number;
  mes: number;
  cajaDestinoId: string;
  nota?: string;
}) {
  await validarPermisoActual("reportes", "editar");
  const usuario = await getUsuarioActual();
  if (!usuario) {
    return { success: false, error: "No autenticado" };
  }

  const inicioMes = new Date(params.anio, params.mes - 1, 1, 0, 0, 0, 0);
  const finMes = new Date(params.anio, params.mes, 0, 23, 59, 59, 999);

  try {
    const resultado = await withRetry(async () =>
      prisma.$transaction(
        async (tx) => {
          const [monedaUsd, cajaGeneral, cajaDestino] = await Promise.all([
            tx.moneda.findFirst({
              where: { codigo: "USD", activa: true },
              select: { id: true, simbolo: true, codigo: true },
            }),
            tx.caja.findFirst({
              where: { esGeneral: true, activa: true },
              select: { id: true, nombre: true },
            }),
            tx.caja.findFirst({
              where: { id: params.cajaDestinoId, activa: true },
              select: { id: true, nombre: true },
            }),
          ]);

          if (!monedaUsd) throw new Error("No existe moneda USD activa");
          if (!cajaGeneral) throw new Error("No existe Caja General activa");
          if (!cajaDestino) throw new Error("Caja destino inválida o inactiva");
          if (cajaDestino.id === cajaGeneral.id) {
            throw new Error("La caja destino debe ser distinta a Caja General");
          }

          const resumen = await calcularBaseDiezmoUSDConCliente(tx, {
            monedaUsdId: monedaUsd.id,
            cajaGeneralId: cajaGeneral.id,
            fechaInicio: inicioMes,
            fechaFin: finMes,
          });

          if (resumen.montoCalculado <= 0) {
            throw new Error(
              "No aplica transferencia: la base líquida es menor o igual a 0",
            );
          }

          const cierreExistente = await tx.cierreDiezmoMensual.findUnique({
            where: {
              anio_mes_monedaId: {
                anio: params.anio,
                mes: params.mes,
                monedaId: monedaUsd.id,
              },
            },
          });

          if (cierreExistente?.estado === "REALIZADO") {
            throw new Error("Este mes ya fue cerrado y transferido");
          }

          const catalogos = await obtenerCatalogosTransferencia(tx, usuario.id);

          const comentarioTransferencia = `${CIERRE_DIEZMO_COMENTARIO} ${params.anio}-${String(params.mes).padStart(2, "0")}`;

          const egreso = await tx.egreso.create({
            data: {
              fechaSalida: new Date(),
              solicitante: "Sistema - Cierre Mensual",
              monto: resumen.montoCalculado,
              descripcionGasto: "Transferencia diezmo mensual 10%",
              comentario: comentarioTransferencia,
              tipoGastoId: catalogos.tipoGastoId,
              monedaId: monedaUsd.id,
              cajaId: cajaGeneral.id,
              usuarioId: usuario.id,
              creadoPorId: usuario.id,
            },
            select: { id: true },
          });

          const ingreso = await tx.ingreso.create({
            data: {
              fechaRecaudacion: new Date(),
              comentario: comentarioTransferencia,
              sociedadId: catalogos.sociedadId,
              servicioId: catalogos.servicioId,
              tipoIngresoId: catalogos.tipoIngresoId,
              cajaId: cajaDestino.id,
              cajaSecundariaId: null,
              usuarioId: usuario.id,
              creadoPorId: usuario.id,
              montos: {
                create: {
                  monedaId: monedaUsd.id,
                  monto: resumen.montoCalculado,
                },
              },
            },
            select: { id: true },
          });

          const cierre = await tx.cierreDiezmoMensual.upsert({
            where: {
              anio_mes_monedaId: {
                anio: params.anio,
                mes: params.mes,
                monedaId: monedaUsd.id,
              },
            },
            update: {
              fechaInicio: inicioMes,
              fechaFin: finMes,
              totalOfrendas: resumen.totalOfrendas,
              totalEgresos: resumen.totalEgresos,
              baseLiquida: resumen.baseLiquida,
              porcentaje: 0.1,
              montoDiezmo: resumen.montoCalculado,
              estado: "REALIZADO",
              cajaOrigenId: cajaGeneral.id,
              cajaDestinoId: cajaDestino.id,
              transferenciaEgresoId: egreso.id,
              transferenciaIngresoId: ingreso.id,
              nota: params.nota || null,
              realizadoEn: new Date(),
              realizadoPorId: usuario.id,
            },
            create: {
              anio: params.anio,
              mes: params.mes,
              monedaId: monedaUsd.id,
              fechaInicio: inicioMes,
              fechaFin: finMes,
              totalOfrendas: resumen.totalOfrendas,
              totalEgresos: resumen.totalEgresos,
              baseLiquida: resumen.baseLiquida,
              porcentaje: 0.1,
              montoDiezmo: resumen.montoCalculado,
              estado: "REALIZADO",
              cajaOrigenId: cajaGeneral.id,
              cajaDestinoId: cajaDestino.id,
              transferenciaEgresoId: egreso.id,
              transferenciaIngresoId: ingreso.id,
              nota: params.nota || null,
              realizadoEn: new Date(),
              creadoPorId: usuario.id,
              realizadoPorId: usuario.id,
            },
          });

          return {
            success: true,
            cierreId: cierre.id,
            montoTransferido: resumen.montoCalculado,
            moneda: monedaUsd.codigo,
            cajaOrigen: cajaGeneral.nombre,
            cajaDestino: cajaDestino.nombre,
            cajaOrigenId: cajaGeneral.id,
            cajaDestinoId: cajaDestino.id,
            transferenciaEgresoId: egreso.id,
            transferenciaIngresoId: ingreso.id,
          };
        },
        {
          maxWait: 10000,
          timeout: 20000,
        },
      ),
    );

    if (resultado.success) {
      await registrarAuditoria({
        tabla: "CierreDiezmoMensual",
        registroId: resultado.cierreId,
        operacion: "UPDATE",
        usuarioId: usuario.id,
        datoNuevo: {
          anio: params.anio,
          mes: params.mes,
          montoDiezmo: resultado.montoTransferido,
          cajaOrigenId: resultado.cajaOrigenId,
          cajaDestinoId: resultado.cajaDestinoId,
          transferenciaEgresoId: resultado.transferenciaEgresoId,
          transferenciaIngresoId: resultado.transferenciaIngresoId,
          estado: "REALIZADO",
        },
        descripcion: `Cierre mensual ${params.mes}/${params.anio} aplicado con transferencia de 10%`,
      });
    }

    return resultado;
  } catch (error) {
    const prismaError = error as { code?: string; message?: string };
    const mensaje = prismaError?.message || "Error al aplicar transferencia";
    const tablaCierreNoDisponible =
      prismaError?.code === "P2021" ||
      mensaje.includes("cierres_diezmo_mensual") ||
      mensaje.includes("cierreDiezmoMensual");

    if (tablaCierreNoDisponible) {
      return {
        success: false,
        error:
          "No se puede aplicar transferencia porque la base de datos no tiene la tabla de cierre mensual. Ejecuta migraciones pendientes.",
      };
    }

    return {
      success: false,
      error: mensaje,
    };
  }
}

export async function obtenerCierreDiezmoPendienteAnterior() {
  const hoy = new Date();
  const anio = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
  const mes = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
  return obtenerEstadoCierreDiezmoMensual(anio, mes);
}
