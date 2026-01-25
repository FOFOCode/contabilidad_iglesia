"use server";

import { prisma, withRetry } from "@/lib/prisma";
import { getUsuarioActual } from "./auth";
import { validarPermiso } from "@/lib/permisos";


// Helper para validar permisos del usuario actual
async function validarPermisoActual(
  modulo: string,
  accion: "crear" | "editar" | "eliminar"
) {
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");
  await validarPermiso(usuario.id, modulo, accion);
}

// =====================
// DONACIONES
// =====================

// Helper para obtener la caja general
// Las donaciones SIEMPRE van a la Caja General
async function obtenerCajaGeneral() {
  const cajaGeneral = await prisma.caja.findFirst({
    where: { esGeneral: true, activa: true },
  });

  if (!cajaGeneral) {
    throw new Error(
      "No existe una caja general configurada. Por favor configure una caja como 'General' en Configuración > Cajas."
    );
  }

  return cajaGeneral;
}

interface CrearDonacionData {
  nombre: string;
  numeroDocumento: string;
  telefono?: string;
  fecha: Date;
  monto: number;
  tipoOfrendaId: string;
  monedaId: string;
  usuarioId: string;
  comentario?: string;
}

export async function crearDonacion(data: CrearDonacionData) {
  await validarPermisoActual("donaciones", "crear");
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("No autenticado");

  // Obtener la caja general (donde siempre van las donaciones - dinero real)
  const cajaGeneral = await obtenerCajaGeneral();

  // Buscar o crear la caja virtual de "Donaciones" para el tracking
  let cajaDonaciones = await prisma.caja.findFirst({
    where: { nombre: "Donaciones", activa: true },
  });

  if (!cajaDonaciones) {
    // Crear la caja virtual de Donaciones si no existe
    cajaDonaciones = await prisma.caja.create({
      data: {
        nombre: "Donaciones",
        descripcion: "Caja virtual para tracking de donaciones (el dinero real va a la caja General)",
        activa: true,
        esGeneral: false,
        orden: 9998,
        creadoPorId: usuario.id,
      },
    });
  }

  // Redondear monto a 2 decimales de forma precisa y convertir a string para Prisma
  const montoString = (
    Math.round(data.monto * 100) / 100
  ).toFixed(2);
  
  console.log("[DEBUG] Monto original:", data.monto);
  console.log("[DEBUG] Monto redondeado:", montoString);

  // Crear la donación en la CAJA GENERAL y el tracking simultáneamente
  const donacion = await prisma.donacion.create({
    data: {
      nombre: data.nombre,
      numeroDocumento: data.numeroDocumento,
      telefono: data.telefono || null,
      fecha: data.fecha,
      monto: montoString,
      tipoOfrendaId: data.tipoOfrendaId,
      monedaId: data.monedaId,
      cajaId: cajaGeneral.id,
      usuarioId: data.usuarioId,
      creadoPorId: usuario.id, // Quién creó el registro
      comentario: data.comentario,
    },
    include: {
      tipoOfrenda: true,
      moneda: true,
      caja: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
  });

  // Crear el tracking para la caja "Donaciones" (solo referencia)
  await prisma.donacionTracking.create({
    data: {
      nombre: data.nombre,
      numeroDocumento: data.numeroDocumento,
      telefono: data.telefono || null,
      fecha: data.fecha,
      monto: montoString,
      tipoOfrendaId: data.tipoOfrendaId,
      monedaId: data.monedaId,
      usuarioId: data.usuarioId,
      comentario: data.comentario,
      donacionId: donacion.id,
      cajaId: cajaDonaciones.id, // Asociar a la caja virtual de Donaciones
    },
  });

  return donacion;
}

interface FiltrosDonacion {
  desde?: Date;
  hasta?: Date;
  tipoOfrendaId?: string;
  nombre?: string;
}

export async function obtenerDonaciones(filtros?: FiltrosDonacion) {
  return withRetry(() =>
    prisma.donacion.findMany({
      where: {
        fecha: {
          gte: filtros?.desde,
          lte: filtros?.hasta,
        },
        tipoOfrendaId: filtros?.tipoOfrendaId || undefined,
        nombre: filtros?.nombre
          ? { contains: filtros.nombre, mode: "insensitive" }
          : undefined,
      },
      include: {
        tipoOfrenda: true,
        moneda: true,
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })
  );
}

export async function obtenerDonacionPorId(id: string) {
  return withRetry(() =>
    prisma.donacion.findUnique({
      where: { id },
      include: {
        tipoOfrenda: true,
        moneda: true,
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    })
  );
}

// =====================
// TRACKING DE DONACIONES (para caja Donaciones)
// =====================

interface FiltrosDonacionTracking {
  desde?: Date;
  hasta?: Date;
  tipoOfrendaId?: string;
  nombre?: string;
}

export async function obtenerDonacionesTracking(
  filtros?: FiltrosDonacionTracking
) {
  return withRetry(() =>
    prisma.donacionTracking.findMany({
      where: {
        fecha: {
          gte: filtros?.desde,
          lte: filtros?.hasta,
        },
        tipoOfrendaId: filtros?.tipoOfrendaId || undefined,
        nombre: filtros?.nombre
          ? { contains: filtros.nombre, mode: "insensitive" }
          : undefined,
      },
      include: {
        tipoOfrenda: true,
        moneda: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })
  );
}

export async function obtenerResumenDonacionesTracking(
  desde?: Date,
  hasta?: Date
) {
  const donaciones = await prisma.donacionTracking.findMany({
    where: {
      fecha: {
        gte: desde,
        lte: hasta,
      },
    },
    include: {
      moneda: true,
      tipoOfrenda: true,
    },
  });

  // Agrupar por moneda
  const totalesPorMoneda: Record<
    string,
    { total: number; simbolo: string; codigo: string }
  > = {};

  for (const donacion of donaciones) {
    const key = donacion.monedaId;
    if (!totalesPorMoneda[key]) {
      totalesPorMoneda[key] = {
        total: 0,
        simbolo: donacion.moneda.simbolo,
        codigo: donacion.moneda.codigo,
      };
    }
    totalesPorMoneda[key].total += Number(donacion.monto);
  }

  // Agrupar por tipo de ofrenda
  const totalesPorTipo: Record<string, { total: number; nombre: string }> = {};

  for (const donacion of donaciones) {
    const key = donacion.tipoOfrendaId;
    if (!totalesPorTipo[key]) {
      totalesPorTipo[key] = {
        total: 0,
        nombre: donacion.tipoOfrenda.nombre,
      };
    }
    totalesPorTipo[key].total += Number(donacion.monto);
  }

  return {
    totalDonaciones: donaciones.length,
    totalesPorMoneda: Object.values(totalesPorMoneda),
    totalesPorTipo: Object.values(totalesPorTipo),
  };
}

interface ActualizarDonacionData {
  nombre?: string;
  numeroDocumento?: string;
  telefono?: string;
  fecha?: Date;
  monto?: number;
  tipoOfrendaId?: string;
  monedaId?: string;
  comentario?: string;
}

export async function actualizarDonacion(
  id: string,
  data: ActualizarDonacionData
) {
  await validarPermisoActual("donaciones", "editar");

  // Redondear monto a 2 decimales si viene definido
  const montoRedondeado =
    data.monto !== undefined ? Math.round(data.monto * 100) / 100 : undefined;

  return prisma.donacion.update({
    where: { id },
    data: {
      nombre: data.nombre,
      numeroDocumento: data.numeroDocumento,
      telefono: data.telefono,
      fecha: data.fecha,
      monto: montoRedondeado,
      tipoOfrendaId: data.tipoOfrendaId,
      monedaId: data.monedaId,
      comentario: data.comentario,
    },
    include: {
      tipoOfrenda: true,
      moneda: true,
      caja: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
  });
}

export async function eliminarDonacion(id: string) {
  await validarPermisoActual("donaciones", "eliminar");
  return prisma.donacion.delete({
    where: { id },
  });
}

// Obtener datos para el formulario de donación
export async function obtenerDatosFormularioDonacion() {
  const [tiposOfrenda, monedas, cajaGeneral] = await Promise.all([
    prisma.tipoIngreso.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
    }),
    prisma.caja.findFirst({
      where: { esGeneral: true, activa: true },
    }),
  ]);

  return {
    tiposOfrenda,
    monedas,
    cajaGeneral,
  };
}

// Obtener resumen de donaciones para el dashboard
export async function obtenerResumenDonaciones(desde?: Date, hasta?: Date) {
  const donaciones = await prisma.donacion.findMany({
    where: {
      fecha: {
        gte: desde,
        lte: hasta,
      },
    },
    include: {
      moneda: true,
      tipoOfrenda: true,
    },
  });

  // Agrupar por moneda
  const totalesPorMoneda: Record<
    string,
    { total: number; simbolo: string; codigo: string }
  > = {};

  for (const donacion of donaciones) {
    const key = donacion.monedaId;
    if (!totalesPorMoneda[key]) {
      totalesPorMoneda[key] = {
        total: 0,
        simbolo: donacion.moneda.simbolo,
        codigo: donacion.moneda.codigo,
      };
    }
    totalesPorMoneda[key].total += Number(donacion.monto);
  }

  // Agrupar por tipo de ofrenda
  const totalesPorTipo: Record<string, { total: number; nombre: string }> = {};

  for (const donacion of donaciones) {
    const key = donacion.tipoOfrendaId;
    if (!totalesPorTipo[key]) {
      totalesPorTipo[key] = {
        total: 0,
        nombre: donacion.tipoOfrenda.nombre,
      };
    }
    totalesPorTipo[key].total += Number(donacion.monto);
  }

  return {
    totalDonaciones: donaciones.length,
    totalesPorMoneda: Object.values(totalesPorMoneda),
    totalesPorTipo: Object.values(totalesPorTipo),
  };
}
