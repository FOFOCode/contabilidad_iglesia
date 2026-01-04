"use server";

import { prisma, withRetry } from "@/lib/prisma";

// =====================
// MONEDAS
// =====================

export async function getMonedas() {
  return withRetry(() =>
    prisma.moneda.findMany({
      orderBy: [{ esPrincipal: "desc" }, { orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createMoneda(data: {
  codigo: string;
  nombre: string;
  simbolo: string;
  tasaCambio?: number;
  esPrincipal?: boolean;
  orden?: number;
}) {
  return withRetry(() =>
    prisma.moneda.create({
      data: {
        ...data,
        tasaCambio: data.tasaCambio ?? 1,
      },
    })
  );
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
  }
) {
  return withRetry(() =>
    prisma.moneda.update({
      where: { id },
      data,
    })
  );
}

export async function deleteMoneda(id: string) {
  return withRetry(() =>
    prisma.moneda.delete({
      where: { id },
    })
  );
}

// =====================
// SOCIEDADES
// =====================

export async function getSociedades() {
  return withRetry(() =>
    prisma.sociedad.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createSociedad(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  return withRetry(() => prisma.sociedad.create({ data }));
}

export async function updateSociedad(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
    orden?: number;
  }
) {
  return withRetry(() =>
    prisma.sociedad.update({
      where: { id },
      data,
    })
  );
}

export async function deleteSociedad(id: string) {
  return withRetry(() =>
    prisma.sociedad.delete({
      where: { id },
    })
  );
}

// =====================
// TIPOS DE SERVICIO
// =====================

export async function getTiposServicio() {
  return withRetry(() =>
    prisma.tipoServicio.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createTipoServicio(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  return withRetry(() => prisma.tipoServicio.create({ data }));
}

export async function updateTipoServicio(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  }
) {
  return withRetry(() =>
    prisma.tipoServicio.update({
      where: { id },
      data,
    })
  );
}

export async function deleteTipoServicio(id: string) {
  return withRetry(() =>
    prisma.tipoServicio.delete({
      where: { id },
    })
  );
}

// =====================
// TIPOS DE INGRESO
// =====================

export async function getTiposIngreso() {
  return withRetry(() =>
    prisma.tipoIngreso.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createTipoIngreso(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  return withRetry(() => prisma.tipoIngreso.create({ data }));
}

export async function updateTipoIngreso(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  }
) {
  return withRetry(() =>
    prisma.tipoIngreso.update({
      where: { id },
      data,
    })
  );
}

export async function deleteTipoIngreso(id: string) {
  return withRetry(() =>
    prisma.tipoIngreso.delete({
      where: { id },
    })
  );
}

// =====================
// TIPOS DE GASTO
// =====================

export async function getTiposGasto() {
  return withRetry(() =>
    prisma.tipoGasto.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createTipoGasto(data: {
  nombre: string;
  descripcion?: string;
  orden?: number;
}) {
  return withRetry(() => prisma.tipoGasto.create({ data }));
}

export async function updateTipoGasto(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
  }
) {
  return withRetry(() =>
    prisma.tipoGasto.update({
      where: { id },
      data,
    })
  );
}

export async function deleteTipoGasto(id: string) {
  return withRetry(() =>
    prisma.tipoGasto.delete({
      where: { id },
    })
  );
}

// =====================
// CAJAS
// =====================

export async function getCajas() {
  return withRetry(() =>
    prisma.caja.findMany({
      include: {
        sociedad: true,
        tipoIngreso: true,
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    })
  );
}

export async function createCaja(data: {
  nombre: string;
  descripcion?: string;
  esGeneral?: boolean;
  orden?: number;
  sociedadId?: string;
  tipoIngresoId?: string;
}) {
  return withRetry(() => prisma.caja.create({ data }));
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
  }
) {
  return withRetry(() =>
    prisma.caja.update({
      where: { id },
      data,
    })
  );
}

export async function deleteCaja(id: string) {
  return withRetry(() =>
    prisma.caja.delete({
      where: { id },
    })
  );
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
      },
    })
  );
}

export async function createUsuario(data: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
}) {
  // Hash simple para la contraseña (en producción usar bcrypt)
  const contrasenaHash = Buffer.from(data.contrasena).toString("base64");
  return withRetry(() =>
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
      },
    })
  );
}

export async function updateUsuario(
  id: string,
  data: {
    nombre?: string;
    apellido?: string;
    correo?: string;
    contrasena?: string;
    activo?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.contrasena) {
    updateData.contrasena = Buffer.from(data.contrasena).toString("base64");
  }
  return withRetry(() =>
    prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        activo: true,
      },
    })
  );
}

export async function deleteUsuario(id: string) {
  return withRetry(() =>
    prisma.usuario.delete({
      where: { id },
    })
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
    })
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
    })
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
      montos: {
        create: {
          monedaId: data.monedaId,
          monto: data.monto,
        },
      },
    },
  });
}
