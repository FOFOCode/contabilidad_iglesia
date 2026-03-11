import { prisma } from "./prisma";

export interface AuditoriaParams {
  tabla: string;
  registroId: string;
  operacion: "CREATE" | "UPDATE" | "DELETE";
  usuarioId: string;
  datoAnterior?: Record<string, any>;
  datoNuevo?: Record<string, any>;
  descripcion?: string;
}

/**
 * Registra un evento de auditoría en la tabla AuditoriaLog
 */
export async function registrarAuditoria({
  tabla,
  registroId,
  operacion,
  usuarioId,
  datoAnterior,
  datoNuevo,
  descripcion,
}: AuditoriaParams): Promise<void> {
  try {
    await prisma.auditoriaLog.create({
      data: {
        tabla,
        registroId,
        operacion,
        usuarioId,
        datoAnterior,
        datoNuevo,
        descripcion,
      },
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
    // No lanzar error para no interrumpir la operación principal
  }
}

/**
 * Genera una descripción legible del cambio de auditoría
 */
export function generarDescripcionAuditoria(
  operacion: "CREATE" | "UPDATE" | "DELETE",
  tabla: string,
  datoAnterior?: Record<string, any>,
  datoNuevo?: Record<string, any>
): string {
  const tablaNombre = tabla.toLowerCase();

  switch (operacion) {
    case "CREATE":
      return `Se creó un nuevo registro en ${tablaNombre}`;
    case "DELETE":
      return `Se eliminó un registro de ${tablaNombre}`;
    case "UPDATE":
      if (!datoAnterior || !datoNuevo) {
        return `Se modificó un registro en ${tablaNombre}`;
      }

      const cambios: string[] = [];
      Object.keys(datoNuevo).forEach((key) => {
        if (datoAnterior[key] !== datoNuevo[key]) {
          cambios.push(
            `${key}: ${JSON.stringify(datoAnterior[key])} → ${JSON.stringify(
              datoNuevo[key]
            )}`
          );
        }
      });

      return cambios.length > 0
        ? `Se modificó ${tablaNombre}: ${cambios.join(", ")}`
        : `Se intentó modificar ${tablaNombre} sin cambios reales`;
    default:
      return `Operación en ${tablaNombre}`;
  }
}
