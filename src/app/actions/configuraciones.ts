"use server";

import { prisma, withRetry } from "@/lib/prisma";
import { getUsuarioActual } from "./auth";
import { validarPermiso } from "@/lib/permisos";
import { unstable_cache, revalidateTag } from "next/cache";
import bcrypt from "bcryptjs";

// Helper para validar permisos del usuario actual
async function validarPermisoActual(
  modulo: string,
  accion: "crear" | "editar" | "eliminar",
) {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    throw new Error("No autenticado");
  }
  await validarPermiso(usuario.id, modulo, accion);
}

// =====================
// MONEDAS
// =====================

// Catálogo cacheado: monedas cambian muy raramente.
// revalidate: 300s (5 min) | invalidar con revalidateTag('catalogo-monedas')
const _getMonedasCached = unstable_cache(
  async () => {
    const rows = await withRetry(() =>
      prisma.moneda.findMany({
        orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }, { nombre: "asc" }],
      }),
    );
    // Serializar Decimal a number para compatibilidad con JSON cache
    return rows.map((m) => ({ ...m, tasaCambio: Number(m.tasaCambio) }));
  },
  ["catalogo-monedas"],
  { revalidate: 300, tags: ["catalogo-monedas"] },
);

export async function getMonedas() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _getMonedasCached() as unknown as ReturnType<
    typeof prisma.moneda.findMany
  >;
}

export async function createMoneda(data: {
  codigo: string;
  nombre: string;
  simbolo: string;
  tasaCambio?: number;
  esPrincipal?: boolean;
  orden?: number;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() =>
    prisma.moneda.create({
      data: {
        ...data,
        tasaCambio: data.tasaCambio ?? 1,
      },
    }),
  );
  revalidateTag("catalogo-monedas", {});
  return result;
}

export async function updateMoneda(
  id: string,
  data: {
    codigo?: string;
    nombre?: string;
    simbolo?: string;
    tasaCambio?: number;
    esPrincipal?: boolean;
    activa?: boolean;
    orden?: number;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.moneda.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-monedas", {});
  return result;
}

export async function deleteMoneda(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.moneda.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-monedas", {});
  return result;
}

// =====================
// SOCIEDADES
// =====================

const _getSociedadesCached = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.sociedad.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    ),
  ["catalogo-sociedades"],
  { revalidate: 300, tags: ["catalogo-sociedades"] },
);

export async function getSociedades() {
  return _getSociedadesCached();
}

export async function createSociedad(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() => prisma.sociedad.create({ data }));
  revalidateTag("catalogo-sociedades", {});
  return result;
}

export async function updateSociedad(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
    orden?: number;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.sociedad.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-sociedades", {});
  return result;
}

export async function deleteSociedad(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.sociedad.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-sociedades", {});
  return result;
}

// =====================
// TIPOS DE SERVICIO
// =====================

const _getTiposServicioCached = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.tipoServicio.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    ),
  ["catalogo-tipos-servicio"],
  { revalidate: 300, tags: ["catalogo-tipos-servicio"] },
);

export async function getTiposServicio() {
  return _getTiposServicioCached();
}

export async function createTipoServicio(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() => prisma.tipoServicio.create({ data }));
  revalidateTag("catalogo-tipos-servicio", {});
  return result;
}

export async function updateTipoServicio(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.tipoServicio.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-tipos-servicio", {});
  return result;
}

export async function deleteTipoServicio(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.tipoServicio.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-tipos-servicio", {});
  return result;
}

// =====================
// TIPOS DE INGRESO
// =====================

const _getTiposIngresoCached = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.tipoIngreso.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    ),
  ["catalogo-tipos-ingreso"],
  { revalidate: 300, tags: ["catalogo-tipos-ingreso"] },
);

export async function getTiposIngreso() {
  return _getTiposIngresoCached();
}

export async function createTipoIngreso(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() => prisma.tipoIngreso.create({ data }));
  revalidateTag("catalogo-tipos-ingreso", {});
  return result;
}

export async function updateTipoIngreso(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.tipoIngreso.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-tipos-ingreso", {});
  return result;
}

export async function deleteTipoIngreso(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.tipoIngreso.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-tipos-ingreso", {});
  return result;
}

// =====================
// TIPOS DE GASTO
// =====================

const _getTiposGastoCached = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.tipoGasto.findMany({
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    ),
  ["catalogo-tipos-gasto"],
  { revalidate: 300, tags: ["catalogo-tipos-gasto"] },
);

export async function getTiposGasto() {
  return _getTiposGastoCached();
}

export async function createTipoGasto(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() => prisma.tipoGasto.create({ data }));
  revalidateTag("catalogo-tipos-gasto", {});
  return result;
}

export async function updateTipoGasto(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.tipoGasto.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-tipos-gasto", {});
  return result;
}

export async function deleteTipoGasto(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.tipoGasto.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-tipos-gasto", {});
  return result;
}

// =====================
// CAJAS
// =====================

const _getCajasCached = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.caja.findMany({
        include: {
          sociedad: true,
          tipoIngreso: true,
        },
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    ),
  ["catalogo-cajas"],
  { revalidate: 120, tags: ["catalogo-cajas"] }, // 2 min (cajas cambian algo más seguido)
);

export async function getCajas() {
  return _getCajasCached();
}

export async function createCaja(data: {
  nombre: string;
  descripcion?: string;
  esGeneral?: boolean;
  orden?: number;
  sociedadId?: string;
  tipoIngresoId?: string;
}) {
  await validarPermisoActual("configuracion", "crear");
  const result = await withRetry(() => prisma.caja.create({ data }));
  revalidateTag("catalogo-cajas", {});
  return result;
}

export async function updateCaja(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
    esGeneral?: boolean;
    orden?: number;
    sociedadId?: string | null;
    tipoIngresoId?: string | null;
  },
) {
  await validarPermisoActual("configuracion", "editar");
  const result = await withRetry(() =>
    prisma.caja.update({
      where: { id },
      data,
    }),
  );
  revalidateTag("catalogo-cajas", {});
  return result;
}

export async function deleteCaja(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  const result = await withRetry(() =>
    prisma.caja.delete({
      where: { id },
    }),
  );
  revalidateTag("catalogo-cajas", {});
  return result;
}

// =====================
// USUARIOS
// =====================

export async function getUsuarios() {
  return withRetry(() =>
    prisma.usuario.findMany({
      orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
        rolId: true,
        rol: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    }),
  );
}

export async function createUsuario(data: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  rolId?: string;
}) {
  try {
    console.log("[Usuarios] Intentando crear usuario:", data.correo);
    await validarPermisoActual("configuracion", "crear");
    console.log("[Usuarios] Hasheando contraseña con bcrypt");
    const contrasenaHash = await bcrypt.hash(data.contrasena, 10);
    console.log("[Usuarios] Hash creado exitosamente");

    const resultado = await withRetry(() =>
      prisma.usuario.create({
        data: {
          ...data,
          contrasena: contrasenaHash,
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          activo: true,
          rolId: true,
        },
      }),
    );
    console.log("[Usuarios] Usuario creado exitosamente:", resultado.correo);
    return resultado;
  } catch (error) {
    console.error("[Usuarios] Error al crear usuario:", error);
    throw error;
  }
}

export async function updateUsuario(
  id: string,
  data: {
    nombre?: string;
    apellido?: string;
    correo?: string;
    contrasena?: string;
    activo?: boolean;
    rolId?: string | null;
  },
) {
  try {
    console.log("[Usuarios] Intentando actualizar usuario:", id);
    await validarPermisoActual("configuracion", "editar");
    const updateData: Record<string, unknown> = { ...data };
    if (data.contrasena) {
      console.log("[Usuarios] Actualizando contraseña con bcrypt");
      updateData.contrasena = await bcrypt.hash(data.contrasena, 10);
      console.log("[Usuarios] Nueva contraseña hasheada");
    }
    const resultado = await withRetry(() =>
      prisma.usuario.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          activo: true,
          rolId: true,
        },
      }),
    );
    console.log("[Usuarios] Usuario actualizado:", resultado.correo);
    return resultado;
  } catch (error) {
    console.error("[Usuarios] Error al actualizar usuario:", error);
    throw error;
  }
}

export async function deleteUsuario(id: string) {
  await validarPermisoActual("configuracion", "eliminar");
  return withRetry(() =>
    prisma.usuario.delete({
      where: { id },
    }),
  );
}

// =====================
// SALDOS INICIALES
// =====================

export async function getCajasActivas() {
  return withRetry(() =>
    prisma.caja.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        esGeneral: true,
      },
    }),
  );
}

export async function getMonedasActivas() {
  return withRetry(() =>
    prisma.moneda.findMany({
      where: { activa: true },
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }],
      select: {
        id: true,
        codigo: true,
        simbolo: true,
        esPrincipal: true,
      },
    }),
  );
}

export async function registrarSaldoInicial(data: {
  cajaId: string;
  monedaId: string;
  monto: number;
  usuarioId: string;
}) {
  // Buscar o crear sociedad y tipo de ingreso para "Saldo Inicial"
  let sociedadSistema = await prisma.sociedad.findFirst({
    where: { nombre: "Sistema" },
  });

  if (!sociedadSistema) {
    sociedadSistema = await prisma.sociedad.create({
      data: {
        nombre: "Sistema",
        descripcion: "Sociedad del sistema para saldos iniciales",
        orden: 999,
      },
    });
  }

  let tipoIngresoSaldoInicial = await prisma.tipoIngreso.findFirst({
    where: { nombre: "Saldo Inicial" },
  });

  if (!tipoIngresoSaldoInicial) {
    tipoIngresoSaldoInicial = await prisma.tipoIngreso.create({
      data: {
        nombre: "Saldo Inicial",
        descripcion: "Saldo inicial de la caja",
        orden: 999,
      },
    });
  }

  let tipoServicioSistema = await prisma.tipoServicio.findFirst({
    where: { nombre: "Sistema" },
  });

  if (!tipoServicioSistema) {
    tipoServicioSistema = await prisma.tipoServicio.create({
      data: {
        nombre: "Sistema",
        descripcion: "Tipo de servicio del sistema",
        orden: 999,
      },
    });
  }

  // Crear el ingreso como saldo inicial
  // IMPORTANTE: No asignar caja secundaria para saldos iniciales
  return prisma.ingreso.create({
    data: {
      fechaRecaudacion: new Date(),
      comentario: "Saldo inicial de la caja",
      sociedadId: sociedadSistema.id,
      servicioId: tipoServicioSistema.id,
      tipoIngresoId: tipoIngresoSaldoInicial.id,
      cajaId: data.cajaId,
      cajaSecundariaId: null, // Explícitamente null para evitar asignación automática
      usuarioId: data.usuarioId,
      creadoPorId: data.usuarioId, // Quién creó el saldo inicial
      montos: {
        create: {
          monedaId: data.monedaId,
          monto: data.monto,
        },
      },
    },
  });
}
