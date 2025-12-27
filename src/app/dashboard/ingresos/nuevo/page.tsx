"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button, Card, Input, Select, TextArea } from "@/components/ui";

const sociedadOptions = [
  { value: "HOMBRES", label: "Hombres" },
  { value: "MUJERES", label: "Mujeres" },
  { value: "CULTO_GENERAL", label: "Culto General" },
];

const servicioOptions = [
  { value: "CULTO", label: "Culto" },
  { value: "ORACION", label: "Oración" },
  { value: "VIGILIA", label: "Vigilia" },
  { value: "MATUTINO", label: "Matutino" },
  { value: "ENSENANZA", label: "Enseñanza" },
];

const tipoIngresoOptions = [
  { value: "OFRENDA", label: "Ofrenda" },
  { value: "TALENTOS", label: "Talentos" },
  { value: "PROMESAS", label: "Promesas" },
  { value: "DIEZMO", label: "Diezmo" },
  { value: "DONACION", label: "Donación" },
  { value: "HNO_AYUDA", label: "Hermano en Ayuda" },
];

// Definición de cajas del sistema
const CAJAS = {
  GENERAL: { id: "caja-general", nombre: "Caja General (Ofrendas)" },
  TALENTOS_HOMBRES: {
    id: "caja-talentos-hombres",
    nombre: "Caja Talentos - Hombres",
  },
  TALENTOS_MUJERES: {
    id: "caja-talentos-mujeres",
    nombre: "Caja Talentos - Mujeres",
  },
  PROMESAS: { id: "caja-promesas", nombre: "Caja de Promesas" },
  DIEZMOS: { id: "caja-diezmos", nombre: "Caja de Diezmos" },
  DONACIONES: { id: "caja-donaciones", nombre: "Caja de Donaciones" },
  HNO_AYUDA: { id: "caja-hno-ayuda", nombre: "Caja Hermano en Ayuda" },
};

// Función para determinar la caja según tipo de ingreso y sociedad
function getCajaDestino(
  tipoIngreso: string,
  sociedad: string
): { id: string; nombre: string } | null {
  switch (tipoIngreso) {
    case "OFRENDA":
      return CAJAS.GENERAL;
    case "TALENTOS":
      if (sociedad === "HOMBRES") return CAJAS.TALENTOS_HOMBRES;
      if (sociedad === "MUJERES") return CAJAS.TALENTOS_MUJERES;
      return null;
    case "PROMESAS":
      if (sociedad === "MUJERES") return CAJAS.PROMESAS;
      return null;
    case "DIEZMO":
      return CAJAS.DIEZMOS;
    case "DONACION":
      return CAJAS.DONACIONES;
    case "HNO_AYUDA":
      return CAJAS.HNO_AYUDA;
    default:
      return null;
  }
}

// Obtener tipos de ingreso disponibles según la sociedad
function getTiposIngresoDisponibles(sociedad: string) {
  if (sociedad === "MUJERES") {
    return tipoIngresoOptions;
  } else if (sociedad === "HOMBRES") {
    return tipoIngresoOptions.filter((t) => t.value !== "PROMESAS");
  } else {
    return tipoIngresoOptions.filter(
      (t) => !["TALENTOS", "PROMESAS"].includes(t.value)
    );
  }
}

export default function NuevoIngresoPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [cajaAsignada, setCajaAsignada] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [tiposIngresoFiltrados, setTiposIngresoFiltrados] =
    useState(tipoIngresoOptions);

  const [formData, setFormData] = useState({
    sociedad: "",
    servicio: "",
    tipoIngreso: "",
    fechaRecaudacion: new Date().toISOString().split("T")[0],
    montoUSD: "",
    montoGTQ: "",
    comentario: "",
  });

  // Actualizar tipos de ingreso cuando cambia la sociedad
  useEffect(() => {
    if (formData.sociedad) {
      const tiposDisponibles = getTiposIngresoDisponibles(formData.sociedad);
      setTiposIngresoFiltrados(tiposDisponibles);

      if (
        formData.tipoIngreso &&
        !tiposDisponibles.find((t) => t.value === formData.tipoIngreso)
      ) {
        setFormData((prev) => ({ ...prev, tipoIngreso: "" }));
        setCajaAsignada(null);
      }
    }
  }, [formData.sociedad, formData.tipoIngreso]);

  // Actualizar caja cuando cambia tipo de ingreso o sociedad
  useEffect(() => {
    if (formData.tipoIngreso && formData.sociedad) {
      const caja = getCajaDestino(formData.tipoIngreso, formData.sociedad);
      setCajaAsignada(caja);
    } else {
      setCajaAsignada(null);
    }
  }, [formData.tipoIngreso, formData.sociedad]);

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

    if (!formData.sociedad) {
      newErrors.sociedad = "Seleccione una sociedad";
    }
    if (!formData.servicio) {
      newErrors.servicio = "Seleccione un tipo de servicio";
    }
    if (!formData.tipoIngreso) {
      newErrors.tipoIngreso = "Seleccione el tipo de ingreso";
    }
    if (!cajaAsignada) {
      newErrors.caja = "Combinación de sociedad y tipo de ingreso no válida";
    }
    if (!formData.montoUSD && !formData.montoGTQ) {
      newErrors.montoUSD = "Ingrese al menos un monto";
      newErrors.montoGTQ = "Ingrese al menos un monto";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      router.push("/dashboard/ingresos");
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Nuevo Ingreso"
        subtitle="Registrar un nuevo ingreso al sistema"
      />

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
                  name="sociedad"
                  options={sociedadOptions}
                  value={formData.sociedad}
                  onChange={handleChange}
                  error={errors.sociedad}
                  required
                />
                <Select
                  label="Tipo de Servicio"
                  name="servicio"
                  options={servicioOptions}
                  value={formData.servicio}
                  onChange={handleChange}
                  error={errors.servicio}
                  required
                />
                <Select
                  label="Tipo de Ingreso"
                  name="tipoIngreso"
                  options={tiposIngresoFiltrados}
                  value={formData.tipoIngreso}
                  onChange={handleChange}
                  error={errors.tipoIngreso}
                  required
                />
              </div>
            </div>

            {/* Fecha y Caja Asignada */}
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
                  {cajaAsignada ? (
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
                        Asignada automáticamente
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-3 rounded-lg border ${
                        errors.caja
                          ? "bg-[#fcece9] border-[#f3b5a5]"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span
                        className={
                          errors.caja ? "text-[#b43718]" : "text-gray-500"
                        }
                      >
                        {errors.caja || "Seleccione sociedad y tipo de ingreso"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Montos */}
            <div>
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
                Montos
              </h3>
              {(errors.montoUSD || errors.montoGTQ) &&
                !formData.montoUSD &&
                !formData.montoGTQ && (
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
                    <span className="text-[#59430d] text-sm">
                      Debe ingresar al menos un monto (USD o GTQ)
                    </span>
                  </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Monto en Dólares (USD)"
                  name="montoUSD"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.montoUSD}
                  onChange={handleChange}
                  error={formData.montoGTQ ? undefined : errors.montoUSD}
                />
                <Input
                  label="Monto en Quetzales (GTQ)"
                  name="montoGTQ"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.montoGTQ}
                  onChange={handleChange}
                  error={formData.montoUSD ? undefined : errors.montoGTQ}
                />
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
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Guardar Ingreso
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
    </div>
  );
}
