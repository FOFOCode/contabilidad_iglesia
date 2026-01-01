"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Combobox, TextArea, Button } from "@/components/ui";
import { crearEgreso, obtenerSaldoCaja } from "@/app/actions/operaciones";

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
  const [saldoCaja, setSaldoCaja] = useState<
    {
      monedaId: string;
      monedaCodigo: string;
      monedaSimbolo: string;
      saldo: number;
    }[]
  >([]);
  const [cargandoSaldo, setCargandoSaldo] = useState(false);

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

  // Memoizar opciones de selects para evitar recálculos
  const tipoGastoOptions = useMemo(
    () => tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposGasto]
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

  // Cargar saldo de la caja seleccionada
  useEffect(() => {
    if (formData.cajaId) {
      setCargandoSaldo(true);
      obtenerSaldoCaja(formData.cajaId)
        .then((saldos) => {
          setSaldoCaja(saldos);
        })
        .catch(console.error)
        .finally(() => setCargandoSaldo(false));
    } else {
      setSaldoCaja([]);
    }
  }, [formData.cajaId]);

  // Obtener saldo actual de la moneda seleccionada
  const saldoMonedaActual = saldoCaja.find(
    (s) => s.monedaId === formData.monedaId
  );
  const montoNumerico = parseFloat(formData.monto) || 0;
  const saldoProyectado = saldoMonedaActual
    ? saldoMonedaActual.saldo - montoNumerico
    : null;

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

    if (!formData.tipoGastoId)
      newErrors.tipoGastoId = "Seleccione un tipo de gasto";
    if (!formData.cajaId) newErrors.cajaId = "Seleccione una caja";
    if (!formData.monedaId) newErrors.monedaId = "Seleccione una moneda";
    if (!formData.solicitante.trim())
      newErrors.solicitante = "Ingrese el solicitante";
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = "Ingrese un monto válido";
    }

    // Validación de saldo insuficiente
    if (saldoProyectado !== null && saldoProyectado < 0) {
      const simbolo = saldoMonedaActual?.monedaSimbolo || "";
      newErrors.monto = `Saldo insuficiente. Disponible: ${simbolo}${saldoMonedaActual?.saldo.toLocaleString(
        "es-GT",
        { minimumFractionDigits: 2 }
      )}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        // Crear fecha en zona horaria local para evitar desfase
        const [year, month, day] = formData.fechaSalida.split("-").map(Number);
        const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);

        await crearEgreso({
          fechaSalida: fechaLocal,
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
        const errorMessage =
          error instanceof Error ? error.message : "Error al guardar el egreso";
        setErrors({ general: errorMessage });
      }
    });
  };

  // Obtener símbolo de moneda seleccionada
  const monedaSeleccionada = monedas.find((m) => m.id === formData.monedaId);

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
              <Combobox
                label="Tipo de Gasto"
                options={tipoGastoOptions}
                value={formData.tipoGastoId}
                onChange={(value) => handleComboboxChange("tipoGastoId", value)}
                error={errors.tipoGastoId}
                placeholder="Seleccionar tipo de gasto..."
                required
              />
              <Combobox
                label="Caja de Origen"
                options={cajaOptions}
                value={formData.cajaId}
                onChange={(value) => handleComboboxChange("cajaId", value)}
                error={errors.cajaId}
                placeholder="Seleccionar caja..."
                required
              />
            </div>

            {/* Preview de Saldo de la Caja */}
            {formData.cajaId && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#eef4f7] to-white rounded-lg border border-[#b9d4df]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#40768c] uppercase">
                    Saldo Disponible en Caja
                  </h4>
                  {cargandoSaldo && (
                    <span className="text-xs text-[#73a9bf]">Cargando...</span>
                  )}
                </div>
                {!cargandoSaldo && saldoCaja.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {saldoCaja.map((s) => (
                      <div
                        key={s.monedaId}
                        className={`p-2 rounded ${
                          s.monedaId === formData.monedaId
                            ? "bg-white border-2 border-[#40768c]"
                            : "bg-white/50"
                        }`}
                      >
                        <p className="text-xs text-[#73a9bf]">
                          {s.monedaCodigo}
                        </p>
                        <p
                          className={`font-bold ${
                            s.saldo >= 0 ? "text-[#2ba193]" : "text-[#e0451f]"
                          }`}
                        >
                          {s.monedaSimbolo}
                          {s.saldo.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proyección después del egreso */}
                {saldoMonedaActual && montoNumerico > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#b9d4df]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#73a9bf]">
                        Saldo después del egreso (
                        {saldoMonedaActual.monedaCodigo}):
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          saldoProyectado !== null && saldoProyectado >= 0
                            ? "text-[#2ba193]"
                            : "text-[#e0451f]"
                        }`}
                      >
                        {saldoMonedaActual.monedaSimbolo}
                        {saldoProyectado?.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {saldoProyectado !== null && saldoProyectado < 0 && (
                      <p className="text-xs text-[#e0451f] mt-1 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        ¡Atención! El saldo quedaría negativo
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
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
              <Combobox
                label="Moneda"
                options={monedaOptions}
                value={formData.monedaId}
                onChange={(value) => handleComboboxChange("monedaId", value)}
                error={errors.monedaId}
                placeholder="Seleccionar moneda..."
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
              disabled={
                isPending || (saldoProyectado !== null && saldoProyectado < 0)
              }
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
