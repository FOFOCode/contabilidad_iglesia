"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Select, TextArea, Button } from "@/components/ui";
import { crearEgreso } from "@/app/actions/operaciones";

interface TipoGasto {
  id: string;
  nombre: string;
}

interface Caja {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface NuevoEgresoFormProps {
  tiposGasto: TipoGasto[];
  cajas: Caja[];
  monedas: Moneda[];
  usuarioId: string;
}

export function NuevoEgresoForm({
  tiposGasto,
  cajas,
  monedas,
  usuarioId,
}: NuevoEgresoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Moneda principal por defecto
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const [formData, setFormData] = useState({
    tipoGastoId: "",
    cajaId: "",
    monedaId: monedaPrincipal?.id || "",
    fechaSalida: new Date().toISOString().split("T")[0],
    solicitante: "",
    monto: "",
    descripcionGasto: "",
    comentario: "",
  });

  // Convertir a options para selects
  const tipoGastoOptions = [
    { value: "", label: "-- Seleccione --" },
    ...tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
  ];

  const cajaOptions = [
    { value: "", label: "-- Seleccione --" },
    ...cajas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  const monedaOptions = monedas.map((m) => ({
    value: m.id,
    label: `${m.simbolo} ${m.codigo} - ${m.nombre}`,
  }));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.tipoGastoId)
      newErrors.tipoGastoId = "Seleccione un tipo de gasto";
    if (!formData.cajaId) newErrors.cajaId = "Seleccione una caja";
    if (!formData.monedaId) newErrors.monedaId = "Seleccione una moneda";
    if (!formData.solicitante.trim())
      newErrors.solicitante = "Ingrese el solicitante";
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = "Ingrese un monto válido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        await crearEgreso({
          fechaSalida: new Date(formData.fechaSalida),
          tipoGastoId: formData.tipoGastoId,
          cajaId: formData.cajaId,
          monedaId: formData.monedaId,
          solicitante: formData.solicitante,
          monto: parseFloat(formData.monto),
          descripcionGasto: formData.descripcionGasto || undefined,
          comentario: formData.comentario || undefined,
          usuarioId,
        });

        setShowSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/egresos");
        }, 1500);
      } catch (error) {
        console.error(error);
        setErrors({ general: "Error al guardar el egreso" });
      }
    });
  };

  // Obtener símbolo de moneda seleccionada
  const monedaSeleccionada = monedas.find((m) => m.id === formData.monedaId);

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      {showSuccess && (
        <div className="mb-6 p-4 bg-[#ebfaf8] border border-[#aeeae3] rounded-lg flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[#2ba193]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[#15514a] font-medium">
            ¡Egreso registrado correctamente!
          </span>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {errors.general}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clasificación */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Clasificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Gasto"
                name="tipoGastoId"
                options={tipoGastoOptions}
                value={formData.tipoGastoId}
                onChange={handleChange}
                error={errors.tipoGastoId}
                required
              />
              <Select
                label="Caja de Origen"
                name="cajaId"
                options={cajaOptions}
                value={formData.cajaId}
                onChange={handleChange}
                error={errors.cajaId}
                required
              />
            </div>
          </div>

          {/* Fecha y Moneda */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Fecha y Moneda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Salida"
                name="fechaSalida"
                type="date"
                value={formData.fechaSalida}
                onChange={handleChange}
                required
              />
              <Select
                label="Moneda"
                name="monedaId"
                options={monedaOptions}
                value={formData.monedaId}
                onChange={handleChange}
                error={errors.monedaId}
                required
              />
            </div>
          </div>

          {/* Solicitante y Monto */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Solicitante y Monto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Solicitante"
                name="solicitante"
                placeholder="Nombre de quien solicita el gasto"
                value={formData.solicitante}
                onChange={handleChange}
                error={errors.solicitante}
                required
              />
              <Input
                label={`Monto (${monedaSeleccionada?.simbolo || "$"})`}
                name="monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monto}
                onChange={handleChange}
                error={errors.monto}
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Detalles
            </h3>
            <TextArea
              label="Descripción del Gasto"
              name="descripcionGasto"
              placeholder="Detalle del gasto realizado..."
              value={formData.descripcionGasto}
              onChange={handleChange}
              className="mb-4"
            />
            <TextArea
              label="Comentario (opcional)"
              name="comentario"
              placeholder="Notas adicionales..."
              value={formData.comentario}
              onChange={handleChange}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t border-[#dceaef]">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar Egreso"}
            </Button>
            <Link href="/dashboard/egresos" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
