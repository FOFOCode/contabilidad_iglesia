"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Select, TextArea, Button } from "@/components/ui";
import { crearIngreso } from "@/app/actions/operaciones";

interface Sociedad {
  id: string;
  nombre: string;
}

interface TipoServicio {
  id: string;
  nombre: string;
}

interface TipoIngreso {
  id: string;
  nombre: string;
}

interface Caja {
  id: string;
  nombre: string;
  descripcion: string | null;
  sociedadId: string | null;
  tipoIngresoId: string | null;
  sociedad: { nombre: string } | null;
  tipoIngreso: { nombre: string } | null;
}

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface NuevoIngresoFormProps {
  sociedades: Sociedad[];
  servicios: TipoServicio[];
  tiposIngreso: TipoIngreso[];
  cajas: Caja[];
  monedas: Moneda[];
  usuarioId: string;
}

export function NuevoIngresoForm({
  sociedades,
  servicios,
  tiposIngreso,
  cajas,
  monedas,
  usuarioId,
}: NuevoIngresoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [cajaAsignada, setCajaAsignada] = useState<Caja | null>(null);
  const [cajaSugerida, setCajaSugerida] = useState(false);

  const [formData, setFormData] = useState({
    sociedadId: "",
    servicioId: "",
    tipoIngresoId: "",
    cajaId: "",
    fechaRecaudacion: new Date().toISOString().split("T")[0],
    montos: {} as Record<string, string>, // monedaId -> monto
    comentario: "",
  });

  // Convertir a options para selects
  const sociedadOptions = [
    { value: "", label: "-- Seleccione --" },
    ...sociedades.map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const servicioOptions = [
    { value: "", label: "-- Seleccione --" },
    ...servicios.map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const tipoIngresoOptions = [
    { value: "", label: "-- Seleccione --" },
    ...tiposIngreso.map((t) => ({ value: t.id, label: t.nombre })),
  ];

  const cajaOptions = [
    { value: "", label: "-- Seleccione manualmente --" },
    ...cajas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  // Buscar caja sugerida basada en sociedad y tipo de ingreso
  useEffect(() => {
    if (formData.sociedadId && formData.tipoIngresoId) {
      // Buscar caja que coincida con sociedad Y tipo de ingreso
      let cajaEncontrada = cajas.find(
        (c) =>
          c.sociedadId === formData.sociedadId &&
          c.tipoIngresoId === formData.tipoIngresoId
      );

      // Si no hay, buscar solo por tipo de ingreso (cajas generales sin sociedad)
      if (!cajaEncontrada) {
        cajaEncontrada = cajas.find(
          (c) => c.tipoIngresoId === formData.tipoIngresoId && !c.sociedadId
        );
      }

      // Si no hay, buscar solo por sociedad
      if (!cajaEncontrada) {
        cajaEncontrada = cajas.find(
          (c) => c.sociedadId === formData.sociedadId && !c.tipoIngresoId
        );
      }

      if (cajaEncontrada) {
        setCajaAsignada(cajaEncontrada);
        setFormData((prev) => ({ ...prev, cajaId: cajaEncontrada!.id }));
        setCajaSugerida(true);
      } else {
        setCajaAsignada(null);
        setCajaSugerida(false);
      }
    } else {
      setCajaSugerida(false);
    }
  }, [formData.sociedadId, formData.tipoIngresoId, cajas]);

  // Si se selecciona caja manualmente
  useEffect(() => {
    if (formData.cajaId && !cajaSugerida) {
      const caja = cajas.find((c) => c.id === formData.cajaId);
      setCajaAsignada(caja || null);
    }
  }, [formData.cajaId, cajas, cajaSugerida]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "cajaId") {
      setCajaSugerida(false);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMontoChange = (monedaId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      montos: { ...prev.montos, [monedaId]: value },
    }));
    if (errors.montos) {
      setErrors((prev) => ({ ...prev, montos: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.sociedadId) newErrors.sociedadId = "Seleccione una sociedad";
    if (!formData.servicioId)
      newErrors.servicioId = "Seleccione un tipo de servicio";
    if (!formData.tipoIngresoId)
      newErrors.tipoIngresoId = "Seleccione el tipo de ingreso";
    if (!formData.cajaId) newErrors.cajaId = "Seleccione una caja";

    // Validar que al menos un monto sea mayor a 0
    const montosValidos = Object.entries(formData.montos).filter(
      ([_, monto]) => parseFloat(monto) > 0
    );
    if (montosValidos.length === 0) {
      newErrors.montos = "Ingrese al menos un monto";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        await crearIngreso({
          fechaRecaudacion: new Date(formData.fechaRecaudacion),
          sociedadId: formData.sociedadId,
          servicioId: formData.servicioId,
          tipoIngresoId: formData.tipoIngresoId,
          cajaId: formData.cajaId,
          usuarioId,
          comentario: formData.comentario || undefined,
          montos: montosValidos.map(([monedaId, monto]) => ({
            monedaId,
            monto: parseFloat(monto),
          })),
        });

        setShowSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/ingresos");
        }, 1500);
      } catch (error) {
        console.error(error);
        setErrors({ general: "Error al guardar el ingreso" });
      }
    });
  };

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
            ¡Ingreso registrado correctamente!
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Sociedad u Origen"
                name="sociedadId"
                options={sociedadOptions}
                value={formData.sociedadId}
                onChange={handleChange}
                error={errors.sociedadId}
                required
              />
              <Select
                label="Tipo de Servicio"
                name="servicioId"
                options={servicioOptions}
                value={formData.servicioId}
                onChange={handleChange}
                error={errors.servicioId}
                required
              />
              <Select
                label="Tipo de Ingreso"
                name="tipoIngresoId"
                options={tipoIngresoOptions}
                value={formData.tipoIngresoId}
                onChange={handleChange}
                error={errors.tipoIngresoId}
                required
              />
            </div>
          </div>

          {/* Fecha y Caja */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Fecha y Destino
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Recaudación"
                name="fechaRecaudacion"
                type="date"
                value={formData.fechaRecaudacion}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caja de Destino <span className="text-[#e0451f]">*</span>
                </label>
                {cajaSugerida && cajaAsignada ? (
                  <div className="px-4 py-3 bg-[#ebfaf8] border border-[#aeeae3] rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#2ba193]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-medium text-[#15514a]">
                        {cajaAsignada.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-[#2ba193] mt-1">
                      Sugerida automáticamente
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCajaSugerida(false);
                        setFormData((prev) => ({ ...prev, cajaId: "" }));
                        setCajaAsignada(null);
                      }}
                      className="text-xs text-[#40768c] underline mt-1"
                    >
                      Cambiar manualmente
                    </button>
                  </div>
                ) : (
                  <Select
                    name="cajaId"
                    options={cajaOptions}
                    value={formData.cajaId}
                    onChange={handleChange}
                    error={errors.cajaId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Montos por moneda */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Montos
            </h3>
            {errors.montos && (
              <div className="mb-4 p-3 bg-[#fcf6e9] border border-[#f2dca6] rounded-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#b1871b]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[#59430d] text-sm">{errors.montos}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monedas.map((moneda) => (
                <Input
                  key={moneda.id}
                  label={`${moneda.nombre} (${moneda.codigo})`}
                  name={`monto_${moneda.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`${moneda.simbolo} 0.00`}
                  value={formData.montos[moneda.id] || ""}
                  onChange={(e) => handleMontoChange(moneda.id, e.target.value)}
                />
              ))}
            </div>
          </div>

          {/* Comentario */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Observaciones
            </h3>
            <TextArea
              label="Comentario (opcional)"
              name="comentario"
              placeholder="Agregar notas adicionales sobre este ingreso..."
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
              {isPending ? "Guardando..." : "Guardar Ingreso"}
            </Button>
            <Link href="/dashboard/ingresos" className="w-full sm:w-auto">
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
