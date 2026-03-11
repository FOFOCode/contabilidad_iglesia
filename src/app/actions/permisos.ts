"use server";

import { getUsuarioActual } from "./auth";

/**
 * Obtiene los permisos del usuario actual (optimizado - usa la data de getUsuarioActual)
 */
export async function obtenerMisPermisos() {
  try {
    const usuario = await getUsuarioActual();

    if (!usuario || !usuario.rol) {
      return {
        esAdmin: false,
        permisos: {},
      };
    }

    // Convertir los permisos del rol a objeto indexado por módulo
    const permisosObj: Record<
      string,
      {
        puedeVer: boolean;
        puedeCrear: boolean;
        puedeEditar: boolean;
        puedeEliminar: boolean;
      }
    > = {};

    usuario.rol.permisos.forEach((rolPermiso) => {
      const modulo = rolPermiso.permiso.modulo;
      permisosObj[modulo] = {
        puedeVer: rolPermiso.puedeVer,
        puedeCrear: rolPermiso.puedeCrear,
        puedeEditar: rolPermiso.puedeEditar,
        puedeEliminar: rolPermiso.puedeEliminar,
      };
    });

    return {
      esAdmin: usuario.rol.nombre === "Administrador",
      permisos: permisosObj,
    };
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return {
      esAdmin: false,
      permisos: {},
    };
  }
}
