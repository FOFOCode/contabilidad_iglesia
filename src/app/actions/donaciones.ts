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

interface CrearDonacionData {
  nombre: string;
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

  // Buscar la caja general (donde esGeneral = true)
  const cajaGeneral = await prisma.caja.findFirst({
    where: { esGeneral: true, activa: true },
  });

  if (!cajaGeneral) {
    throw new Error(
      "No existe una caja general configurada. Por favor configure una caja como 'General' en Configuración > Cajas."
    );
  }

  return prisma.donacion.create({
    data: {
      nombre: data.nombre,
      telefono: data.telefono || null,
      fecha: data.fecha,
      monto: data.monto,
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

interface ActualizarDonacionData {
  nombre?: string;
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
  return prisma.donacion.update({
    where: { id },
    data: {
      nombre: data.nombre,
      telefono: data.telefono,
      fecha: data.fecha,
      monto: data.monto,
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
