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

  // Moneda principal por defecto
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const [formData, setFormData] = useState({
    nombre: "",
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
    [tiposOfrenda]
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo} - ${m.nombre}`,
      })),
    [monedas]
  );

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
          telefono: formData.telefono.trim() || undefined,
          tipoOfrendaId: formData.tipoOfrendaId,
          fecha: fechaLocal,
          monto: parseFloat(formData.monto),
          monedaId: formData.monedaId,
          usuarioId,
          comentario: formData.comentario.trim() || undefined,
        });

        setShowSuccess(true);

        // Limpiar formulario
        setFormData({
          nombre: "",
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
      {/* Mensaje de éxito */}
      {showSuccess && (
        <Card className="p-4 mb-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-xl">✅</span>
            <span className="font-medium">
              Donación registrada correctamente
            </span>
          </div>
        </Card>
      )}

      {/* Error de envío */}
      {errors.submit && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <p className="text-red-700">{errors.submit}</p>
        </Card>
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
                Las donaciones siempre se registran en la{" "}
                <strong>Caja General</strong>, independientemente del tipo de
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
