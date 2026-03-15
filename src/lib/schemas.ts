/**
 * Zod schemas para validación de inputs en Server Actions.
 * La validación ocurre en el servidor ANTES de tocar la base de datos,
 * lo que evita queries innecesarias con datos inválidos.
 */
import { z } from "zod";

// =====================
// COMUNES
// =====================

const uuidSchema = z.string().uuid("ID inválido");
const montoSchema = z
  .number({ error: "El monto debe ser un número" })
  .positive("El monto debe ser mayor a 0")
  .max(9_999_999_999.99, "El monto excede el máximo permitido");

// =====================
// INGRESOS
// =====================

export const montoIngresoSchema = z.object({
  monedaId: uuidSchema,
  monto: montoSchema,
});

export const crearIngresoSchema = z.object({
  fechaRecaudacion: z.date({ error: "Fecha inválida" }),
  sociedadId: uuidSchema,
  servicioId: uuidSchema,
  tipoIngresoId: uuidSchema,
  cajaId: uuidSchema,
  cajaSecundariaId: uuidSchema.nullable().optional(),
  usuarioId: uuidSchema,
  comentario: z.string().max(500).optional(),
  montos: z
    .array(montoIngresoSchema)
    .min(1, "Debe ingresar al menos un monto")
    .max(10, "No puede ingresar más de 10 montos"),
});

export const actualizarIngresoSchema = crearIngresoSchema
  .omit({ usuarioId: true })
  .partial()
  .extend({
    montos: z
      .array(montoIngresoSchema)
      .min(1, "Debe ingresar al menos un monto")
      .optional(),
  });

// =====================
// EGRESOS
// =====================

export const crearEgresoSchema = z.object({
  fechaSalida: z.date({ error: "Fecha inválida" }),
  solicitante: z
    .string()
    .min(1, "El solicitante es obligatorio")
    .max(200, "El solicitante es demasiado largo"),
  monto: montoSchema,
  descripcionGasto: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(500, "La descripción es demasiado larga"),
  comentario: z.string().max(500).optional(),
  numeroFactura: z.string().max(50).optional(),
  cajaId: uuidSchema,
  monedaId: uuidSchema,
  tipoGastoId: uuidSchema,
  usuarioId: uuidSchema,
});

export const actualizarEgresoSchema = crearEgresoSchema
  .omit({ usuarioId: true })
  .partial();

// =====================
// DONACIONES
// =====================

export const crearDonacionSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre es demasiado largo"),
  numeroDocumento: z
    .string()
    .min(1, "El número de documento es obligatorio")
    .max(50, "El número de documento es demasiado largo"),
  telefono: z.string().max(20).optional(),
  fecha: z.date({ error: "Fecha inválida" }),
  monto: montoSchema,
  tipoOfrendaId: uuidSchema,
  monedaId: uuidSchema,
  usuarioId: uuidSchema,
  comentario: z.string().max(500).optional(),
});

export const actualizarDonacionSchema = crearDonacionSchema
  .omit({ usuarioId: true })
  .partial();

// =====================
// HELPER
// =====================

/**
 * Valida y lanza error con mensaje legible si falla.
 * Usado en Server Actions antes de queries a BD.
 */
export function validarSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const mensajes = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Datos inválidos: ${mensajes}`);
  }
  return result.data;
}
