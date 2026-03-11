/**
 * Utilidades para verificación de permisos
 */

import { prisma } from "@/lib/prisma";

export type Accion = "ver" | "crear" | "editar" | "eliminar";

/**
 * Verifica si un usuario tiene permiso para una acción específica en un módulo
 */
export async function verificarPermiso(
  usuarioId: string,
  modulo: string,
  accion: Accion
): Promise<boolean> {
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

    if (!usuario || !usuario.activo) {
      return false;
    }

    // Si no tiene rol, no tiene permisos
    if (!usuario.rol) {
      return false;
    }

    // Si es admin, tiene todos los permisos
    if (usuario.rol.esAdmin) {
      return true;
    }

    // Buscar el permiso específico para el módulo
    const permisoRol = usuario.rol.permisos.find(
      (rp) => rp.permiso.modulo === modulo
    );

    if (!permisoRol) {
      return false;
    }

    // Verificar la acción específica
    switch (accion) {
      case "ver":
        return permisoRol.puedeVer;
      case "crear":
        return permisoRol.puedeCrear;
      case "editar":
        return permisoRol.puedeEditar;
      case "eliminar":
        return permisoRol.puedeEliminar;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error verificando permiso:", error);
    return false;
  }
}

/**
 * Obtiene todos los permisos de un usuario organizados por módulo
 */
export async function obtenerPermisosUsuario(usuarioId: string) {
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

    if (!usuario || !usuario.activo || !usuario.rol) {
      return {
        esAdmin: false,
        permisos: {} as Record<
          string,
          {
            puedeVer: boolean;
            puedeCrear: boolean;
            puedeEditar: boolean;
            puedeEliminar: boolean;
          }
        >,
      };
    }

    // Si es admin, tiene todos los permisos
    if (usuario.rol.esAdmin) {
      const todosPermisos = await prisma.permiso.findMany({
        where: { activo: true },
      });

      const permisosMap: Record<
        string,
        {
          puedeVer: boolean;
          puedeCrear: boolean;
          puedeEditar: boolean;
          puedeEliminar: boolean;
        }
      > = {};

      todosPermisos.forEach((permiso) => {
        permisosMap[permiso.modulo] = {
          puedeVer: true,
          puedeCrear: true,
          puedeEditar: true,
          puedeEliminar: true,
        };
      });

      return {
        esAdmin: true,
        permisos: permisosMap,
      };
    }

    // Construir mapa de permisos
    const permisosMap: Record<
      string,
      {
        puedeVer: boolean;
        puedeCrear: boolean;
        puedeEditar: boolean;
        puedeEliminar: boolean;
      }
    > = {};

    usuario.rol.permisos.forEach((rp) => {
      permisosMap[rp.permiso.modulo] = {
        puedeVer: rp.puedeVer,
        puedeCrear: rp.puedeCrear,
        puedeEditar: rp.puedeEditar,
        puedeEliminar: rp.puedeEliminar,
      };
    });

    return {
      esAdmin: false,
      permisos: permisosMap,
    };
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return {
      esAdmin: false,
      permisos: {} as Record<
        string,
        {
          puedeVer: boolean;
          puedeCrear: boolean;
          puedeEditar: boolean;
          puedeEliminar: boolean;
        }
      >,
    };
  }
}

/**
 * Lanza error si el usuario no tiene permiso
 */
export async function validarPermiso(
  usuarioId: string,
  modulo: string,
  accion: Accion
): Promise<void> {
  const tienePermiso = await verificarPermiso(usuarioId, modulo, accion);

  if (!tienePermiso) {
    throw new Error(`No tienes permiso para ${accion} en el módulo ${modulo}`);
  }
}
