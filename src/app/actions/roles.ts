"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// =====================
// TIPOS
// =====================

export type Rol = {
  id: string;
  nombre: string;
  descripcion: string | null;
  esAdmin: boolean;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  _count?: {
    usuarios: number;
    permisos: number;
  };
};

export type Permiso = {
  id: string;
  modulo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
};

export type RolPermiso = {
  id: string;
  rolId: string;
  permisoId: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  permiso: Permiso;
};

export type RolConPermisos = Rol & {
  permisos: RolPermiso[];
};

// =====================
// OBTENER DATOS
// =====================

/**
 * Obtener todos los roles con sus permisos
 */
export async function obtenerRoles(): Promise<Rol[]> {
  try {
    const roles = await prisma.rol.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            permisos: true,
          },
        },
      },
      orderBy: [{ esAdmin: "desc" }, { nombre: "asc" }],
    });

    return roles;
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw new Error("No se pudieron cargar los roles");
  }
}

/**
 * Obtener un rol específico con todos sus permisos
 */
export async function obtenerRolConPermisos(
  rolId: string
): Promise<RolConPermisos | null> {
  try {
    const rol = await prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        permisos: {
          include: {
            permiso: true,
          },
          orderBy: {
            permiso: {
              orden: "asc",
            },
          },
        },
        _count: {
          select: {
            usuarios: true,
            permisos: true,
          },
        },
      },
    });

    return rol as RolConPermisos | null;
  } catch (error) {
    console.error("Error al obtener rol:", error);
    throw new Error("No se pudo cargar el rol");
  }
}

/**
 * Obtener todos los permisos disponibles
 */
export async function obtenerPermisos(): Promise<Permiso[]> {
  try {
    const permisos = await prisma.permiso.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return permisos;
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    throw new Error("No se pudieron cargar los permisos");
  }
}

/**
 * Obtener permisos del rol de un usuario específico
 */
export async function obtenerPermisosUsuario(
  usuarioId: string
): Promise<RolPermiso[]> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true,
              },
            },
          },
        },
      },
    });

    if (!usuario?.rol) {
      return [];
    }

    // Si es admin, tiene todos los permisos
    if (usuario.rol.esAdmin) {
      const todosPermisos = await prisma.permiso.findMany({
        where: { activo: true },
      });

      return todosPermisos.map((permiso) => ({
        id: `admin-${permiso.id}`,
        rolId: usuario.rol!.id,
        permisoId: permiso.id,
        puedeVer: true,
        puedeCrear: true,
        puedeEditar: true,
        puedeEliminar: true,
        permiso,
      }));
    }

    return usuario.rol.permisos;
  } catch (error) {
    console.error("Error al obtener permisos del usuario:", error);
    return [];
  }
}

// =====================
// CREAR / ACTUALIZAR
// =====================

/**
 * Crear un nuevo rol
 */
export async function crearRol(datos: {
  nombre: string;
  descripcion?: string;
  esAdmin?: boolean;
}): Promise<{ success: boolean; error?: string; rol?: Rol }> {
  try {
    // Validar que el nombre no exista
    const existente = await prisma.rol.findUnique({
      where: { nombre: datos.nombre },
    });

    if (existente) {
      return { success: false, error: "Ya existe un rol con ese nombre" };
    }

    const nuevoRol = await prisma.rol.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        esAdmin: datos.esAdmin || false,
      },
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true, rol: nuevoRol };
  } catch (error) {
    console.error("Error al crear rol:", error);
    return { success: false, error: "No se pudo crear el rol" };
  }
}

/**
 * Actualizar un rol existente
 */
export async function actualizarRol(
  rolId: string,
  datos: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // No permitir desactivar el rol de administrador
    const rolActual = await prisma.rol.findUnique({
      where: { id: rolId },
    });

    if (rolActual?.esAdmin && datos.activo === false) {
      return {
        success: false,
        error: "No se puede desactivar el rol de Administrador",
      };
    }

    // Validar nombre único si se está cambiando
    if (datos.nombre) {
      const existente = await prisma.rol.findFirst({
        where: {
          nombre: datos.nombre,
          id: { not: rolId },
        },
      });

      if (existente) {
        return { success: false, error: "Ya existe un rol con ese nombre" };
      }
    }

    await prisma.rol.update({
      where: { id: rolId },
      data: datos,
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return { success: false, error: "No se pudo actualizar el rol" };
  }
}

/**
 * Asignar o actualizar permisos de un rol
 */
export async function actualizarPermisosRol(
  rolId: string,
  permisos: Array<{
    permisoId: string;
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que no sea el rol de admin
    const rol = await prisma.rol.findUnique({
      where: { id: rolId },
    });

    if (rol?.esAdmin) {
      return {
        success: false,
        error: "No se pueden modificar los permisos del Administrador",
      };
    }

    // Eliminar permisos actuales
    await prisma.rolPermiso.deleteMany({
      where: { rolId },
    });

    // Crear nuevos permisos
    await prisma.rolPermiso.createMany({
      data: permisos.map((p) => ({
        rolId,
        permisoId: p.permisoId,
        puedeVer: p.puedeVer,
        puedeCrear: p.puedeCrear,
        puedeEditar: p.puedeEditar,
        puedeEliminar: p.puedeEliminar,
      })),
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar permisos del rol:", error);
    return { success: false, error: "No se pudieron actualizar los permisos" };
  }
}

/**
 * Eliminar un rol (solo si no tiene usuarios asignados)
 */
export async function eliminarRol(
  rolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const rol = await prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!rol) {
      return { success: false, error: "Rol no encontrado" };
    }

    if (rol.esAdmin) {
      return {
        success: false,
        error: "No se puede eliminar el rol de Administrador",
      };
    }

    if (rol._count.usuarios > 0) {
      return {
        success: false,
        error: `No se puede eliminar: hay ${rol._count.usuarios} usuario(s) con este rol`,
      };
    }

    await prisma.rol.delete({
      where: { id: rolId },
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    return { success: false, error: "No se pudo eliminar el rol" };
  }
}
