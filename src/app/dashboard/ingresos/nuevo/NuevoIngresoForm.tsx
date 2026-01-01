"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Combobox, TextArea, Button } from "@/components/ui";
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
  esGeneral: boolean;
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

  // Moneda principal por defecto
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const [formData, setFormData] = useState({
    sociedadId: "",
    servicioId: "",
    tipoIngresoId: "",
    cajaId: "",
    fechaRecaudacion: new Date().toISOString().split("T")[0],
    monto: "",
    monedaId: monedaPrincipal?.id || "",
    comentario: "",
  });

  // Memoizar opciones de selects para evitar recálculos
  const sociedadOptions = useMemo(
    () => sociedades.map((s) => ({ value: s.id, label: s.nombre })),
    [sociedades]
  );

  const servicioOptions = useMemo(
    () => servicios.map((s) => ({ value: s.id, label: s.nombre })),
    [servicios]
  );

  const tipoIngresoOptions = useMemo(
    () => tiposIngreso.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposIngreso]
  );

  const cajaOptions = useMemo(
    () => cajas.map((c) => ({ value: c.id, label: c.nombre })),
    [cajas]
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo} - ${m.nombre}`,
      })),
    [monedas]
  );

  // Buscar caja sugerida basada en sociedad y tipo de ingreso
  useEffect(() => {
    if (formData.sociedadId && formData.tipoIngresoId) {
      // Obtener el nombre del tipo de ingreso seleccionado
      const tipoSeleccionado = tiposIngreso.find(
        (t) => t.id === formData.tipoIngresoId
      );

      let cajaEncontrada;

      // Si es OFRENDA, buscar la caja general primero
      if (tipoSeleccionado?.nombre.toUpperCase() === "OFRENDA") {
        cajaEncontrada = cajas.find((c) => c.esGeneral);
      }

      // Si no se encontró caja general o no es ofrenda, usar la lógica normal
      if (!cajaEncontrada) {
        // Buscar caja que coincida con sociedad Y tipo de ingreso
        cajaEncontrada = cajas.find(
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
  }, [formData.sociedadId, formData.tipoIngresoId, cajas, tiposIngreso]);

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

  const handleComboboxChange = (name: string, value: string) => {
    if (name === "cajaId") {
      setCajaSugerida(false);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
        // Crear fecha en zona horaria local para evitar desfase
        const [year, month, day] = formData.fechaRecaudacion
          .split("-")
          .map(Number);
        const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);

        await crearIngreso({
          fechaRecaudacion: fechaLocal,
          sociedadId: formData.sociedadId,
          servicioId: formData.servicioId,
          tipoIngresoId: formData.tipoIngresoId,
          cajaId: formData.cajaId,
          usuarioId,
          comentario: formData.comentario || undefined,
          montos: [
            {
              monedaId: formData.monedaId,
              monto: parseFloat(formData.monto),
            },
          ],
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
    <div className="p-4 md:p-5 lg:p-6 max-w-3xl mx-auto lg:mx-0">
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
              <Combobox
                label="Sociedad u Origen"
                options={sociedadOptions}
                value={formData.sociedadId}
                onChange={(value) => handleComboboxChange("sociedadId", value)}
                error={errors.sociedadId}
                placeholder="Seleccionar sociedad..."
                required
              />
              <Combobox
                label="Tipo de Servicio"
                options={servicioOptions}
                value={formData.servicioId}
                onChange={(value) => handleComboboxChange("servicioId", value)}
                error={errors.servicioId}
                placeholder="Seleccionar servicio..."
                required
              />
              <Combobox
                label="Tipo de Ingreso"
                options={tipoIngresoOptions}
                value={formData.tipoIngresoId}
                onChange={(value) =>
                  handleComboboxChange("tipoIngresoId", value)
                }
                error={errors.tipoIngresoId}
                placeholder="Seleccionar tipo..."
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
                  <Combobox
                    options={cajaOptions}
                    value={formData.cajaId}
                    onChange={(value) => handleComboboxChange("cajaId", value)}
                    error={errors.cajaId}
                    placeholder="Seleccionar caja manualmente..."
                  />
                )}
              </div>
            </div>
          </div>

          {/* Monto */}
          <div>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              Monto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Combobox
                label="Moneda"
                options={monedaOptions}
                value={formData.monedaId}
                onChange={(value) => handleComboboxChange("monedaId", value)}
                error={errors.monedaId}
                placeholder="Seleccionar moneda..."
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
