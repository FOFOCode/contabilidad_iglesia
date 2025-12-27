"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button, Card, Input, Select, TextArea } from "@/components/ui";

const tipoGastoOptions = [
  { value: "COMBUSTIBLE", label: "Combustible" },
  { value: "AGUA_PIPA", label: "Agua / Pipa" },
  { value: "FUNERARIA", label: "Funeraria" },
  { value: "LUZ_ELECTRICA", label: "Luz Eléctrica" },
  { value: "OTROS", label: "Otros" },
];

const monedaOptions = [
  { value: "GTQ", label: "Quetzales (GTQ)" },
  { value: "USD", label: "Dólares (USD)" },
];

const cajaOptions = [
  { value: "1", label: "Caja Principal" },
  { value: "2", label: "Caja Secundaria" },
];

export default function NuevoEgresoPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fechaSalida: new Date().toISOString().split("T")[0],
    solicitante: "",
    tipoGasto: "",
    descripcionGasto: "",
    monto: "",
    moneda: "GTQ",
    cajaId: "",
    comentario: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error al modificar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const newErrors: Record<string, string> = {};

    if (!formData.solicitante.trim()) {
      newErrors.solicitante = "Ingrese el nombre del solicitante";
    }
    if (!formData.tipoGasto) {
      newErrors.tipoGasto = "Seleccione el tipo de gasto";
    }
    if (formData.tipoGasto === "OTROS" && !formData.descripcionGasto.trim()) {
      newErrors.descripcionGasto = "Describa el tipo de gasto";
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = "Ingrese un monto válido";
    }
    if (!formData.cajaId) {
      newErrors.cajaId = "Seleccione una caja";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mostrar éxito (maquetación)
    setShowSuccess(true);
    setTimeout(() => {
      router.push("/dashboard/egresos");
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Header title="Nuevo Egreso" subtitle="Registrar una salida de dinero" />

      <div className="p-4 md:p-6 max-w-3xl">
        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 font-medium">
              ¡Egreso registrado correctamente!
            </span>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha y Solicitante */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Información General
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
                <Input
                  label="Solicitante"
                  name="solicitante"
                  placeholder="Nombre del solicitante"
                  value={formData.solicitante}
                  onChange={handleChange}
                  error={errors.solicitante}
                  required
                />
              </div>
            </div>

            {/* Tipo de Gasto */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Clasificación del Gasto
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Select
                  label="Tipo de Gasto"
                  name="tipoGasto"
                  options={tipoGastoOptions}
                  value={formData.tipoGasto}
                  onChange={handleChange}
                  error={errors.tipoGasto}
                  required
                />
                {formData.tipoGasto === "OTROS" && (
                  <Input
                    label="Descripción del Gasto"
                    name="descripcionGasto"
                    placeholder="Especifique el tipo de gasto"
                    value={formData.descripcionGasto}
                    onChange={handleChange}
                    error={errors.descripcionGasto}
                    required
                  />
                )}
              </div>
            </div>

            {/* Monto y Moneda */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Monto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Monto"
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
                <Select
                  label="Moneda"
                  name="moneda"
                  options={monedaOptions}
                  value={formData.moneda}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Caja */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Origen
              </h3>
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

            {/* Comentario */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Observaciones
              </h3>
              <TextArea
                label="Comentario (opcional)"
                name="comentario"
                placeholder="Agregar notas adicionales sobre este egreso..."
                value={formData.comentario}
                onChange={handleChange}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Guardar Egreso
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
    </div>
  );
}
