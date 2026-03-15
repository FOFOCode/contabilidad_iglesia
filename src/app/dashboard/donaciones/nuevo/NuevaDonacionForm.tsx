"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Combobox, TextArea, Button } from "@/components/ui";
import { crearDonacion } from "@/app/actions/donaciones";
import { obtenerFechaHoyElSalvador } from "@/lib/fechas";

interface TipoOfrenda {
  id: string;
  nombre: string;
}

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface NuevaDonacionFormProps {
  tiposOfrenda: TipoOfrenda[];
  monedas: Moneda[];
  usuarioId: string;
}

export function NuevaDonacionForm({
  tiposOfrenda,
  monedas,
  usuarioId,
}: NuevaDonacionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState("");

  // Moneda principal por defecto
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const [formData, setFormData] = useState({
    nombre: "",
    numeroDocumento: "",
    telefono: "",
    tipoOfrendaId: "",
    fecha: obtenerFechaHoyElSalvador(),
    monto: "",
    monedaId: monedaPrincipal?.id || "",
    comentario: "",
  });

  // Memoizar opciones de selects
  const tipoOfrendaOptions = useMemo(
    () => tiposOfrenda.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposOfrenda],
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo} - ${m.nombre}`,
      })),
    [monedas],
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleComboboxChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim())
      newErrors.nombre = "Ingrese el nombre del donante";
    if (!formData.numeroDocumento.trim())
      newErrors.numeroDocumento = "Ingrese el número de documento (DUI)";
    if (!formData.tipoOfrendaId)
      newErrors.tipoOfrendaId = "Seleccione el tipo de ofrenda";
    if (!formData.monedaId) newErrors.monedaId = "Seleccione una moneda";
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = "Ingrese un monto válido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        // Crear fecha en zona horaria local
        const [year, month, day] = formData.fecha.split("-").map(Number);
        const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);

        await crearDonacion({
          nombre: formData.nombre.trim(),
          numeroDocumento: formData.numeroDocumento.trim(),
          telefono: formData.telefono.trim() || undefined,
          tipoOfrendaId: formData.tipoOfrendaId,
          fecha: fechaLocal,
          monto: Math.round(parseFloat(formData.monto) * 100) / 100,
          monedaId: formData.monedaId,
          usuarioId,
          comentario: formData.comentario.trim() || undefined,
        });

        const _monedaActual = monedas.find((m) => m.id === formData.monedaId);
        setSuccessDetails(
          (_monedaActual?.simbolo || "") +
            parseFloat(formData.monto).toLocaleString("es-GT", {
              minimumFractionDigits: 2,
            }) +
            " de " +
            formData.nombre.trim(),
        );
        setShowSuccess(true);

        // Limpiar formulario
        setFormData({
          nombre: "",
          numeroDocumento: "",
          telefono: "",
          tipoOfrendaId: "",
          fecha: obtenerFechaHoyElSalvador(),
          monto: "",
          monedaId: monedaPrincipal?.id || "",
          comentario: "",
        });

        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : "Error al registrar la donación",
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {showSuccess && (
        <div className="mb-6 p-4 bg-[#ebfaf8] border border-[#aeeae3] rounded-lg flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[#2ba193] shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-[#15514a] font-semibold">
              ✓ Donación de {successDetails} registrada correctamente
            </p>
            <p className="text-[#2ba193] text-xs mt-0.5">
              Formulario listo para un nuevo registro
            </p>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 text-[#b43718]">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errors.submit}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrors((prev) => ({ ...prev, submit: "" }))}
            className="text-[#b43718] hover:text-[#8a2c16] text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del donante */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              📋 Datos del Donante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Donante *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre completo"
                error={errors.nombre}
              />
              <Input
                label="Número de Documento (DUI) *"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleChange}
                placeholder="Ej: 12345678-9"
                error={errors.numeroDocumento}
              />
              <Input
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 7777-8888"
              />
            </div>
          </div>

          {/* Datos de la donación */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              💰 Datos de la Donación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Fecha *"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
              />
              <Combobox
                label="Tipo de Ofrenda *"
                options={tipoOfrendaOptions}
                value={formData.tipoOfrendaId}
                onChange={(value) =>
                  handleComboboxChange("tipoOfrendaId", value)
                }
                placeholder="Seleccione..."
                error={errors.tipoOfrendaId}
              />
              <Combobox
                label="Moneda *"
                options={monedaOptions}
                value={formData.monedaId}
                onChange={(value) => handleComboboxChange("monedaId", value)}
                placeholder="Seleccione..."
                error={errors.monedaId}
              />
              <Input
                type="number"
                label="Monto *"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                error={errors.monto}
              />
            </div>
          </div>

          {/* Comentario */}
          <div>
            <TextArea
              label="Comentario (opcional)"
              name="comentario"
              value={formData.comentario}
              onChange={handleChange}
              placeholder="Notas adicionales sobre la donación..."
              rows={3}
            />
          </div>

          {/* Información de destino */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <span className="text-xl">ℹ️</span>
              <span className="text-sm">
                Las donaciones se registran en la{" "}
                <strong>Caja Donaciones</strong>, independientemente del tipo de
                ofrenda seleccionado.
              </span>
            </div>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Link href="/dashboard/donaciones">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "💾 Guardar Donación"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
