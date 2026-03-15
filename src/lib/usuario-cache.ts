/**
 * Cache por-request para la consulta del usuario actual.
 * React cache() deduplica llamadas idénticas dentro del mismo render tree
 * (layout + page en el mismo request comparten el resultado sin hacer 2 queries a BD).
 */
import { cache } from "react";
import { prisma } from "./prisma";

export const getCachedUsuario = cache(async (userId: string) => {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      activo: true,
      rol: {
        select: {
          id: true,
          nombre: true,
          permisos: {
            select: {
              puedeVer: true,
              puedeCrear: true,
              puedeEditar: true,
              puedeEliminar: true,
              permiso: {
                select: {
                  modulo: true,
                },
              },
            },
          },
        },
      },
    },
  });
});
