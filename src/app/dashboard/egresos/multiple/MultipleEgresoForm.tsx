"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Select, Button } from "@/components/ui";
import { crearEgresosMultiples } from "@/app/actions/operaciones";

interface TipoGasto {
  id: string;
  nombre: string;
}

interface Caja {
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

interface MultipleEgresoFormProps {
  tiposGasto: TipoGasto[];
  cajas: Caja[];
  monedas: Moneda[];
  usuarioId: string;
}

interface EgresoRow {
  id: number;
  fecha: string;
  solicitante: string;
  tipoGastoId: string;
  monto: string;
  monedaId: string;
  cajaId: string;
  descripcion: string;
}

export function MultipleEgresoForm({
  tiposGasto,
  cajas,
  monedas,
  usuarioId,
}: MultipleEgresoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Moneda por defecto (la principal o la primera)
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const createEmptyRow = (id: number): EgresoRow => ({
    id,
    fecha: new Date().toISOString().split("T")[0],
    solicitante: "",
    tipoGastoId: "",
    monto: "",
    monedaId: monedaPrincipal?.id || "",
    cajaId: cajas[0]?.id || "",
    descripcion: "",
  });

  const [rows, setRows] = useState<EgresoRow[]>([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3),
  ]);
  const [nextId, setNextId] = useState(4);

  // Opciones para selects
  const tipoGastoOptions = [
    { value: "", label: "-- Seleccione --" },
    ...tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
  ];

  const monedaOptions = monedas.map((m) => ({
    value: m.id,
    label: `${m.nombre} (${m.codigo})`,
  }));

  const cajaOptions = [
    { value: "", label: "-- Seleccione --" },
    ...cajas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  const addRow = () => {
    setRows([...rows, createEmptyRow(nextId)]);
    setNextId(nextId + 1);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: number, field: keyof EgresoRow, value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const duplicateRow = (id: number) => {
    const rowToDuplicate = rows.find((row) => row.id === id);
    if (rowToDuplicate) {
      const newRow = { ...rowToDuplicate, id: nextId };
      setRows([...rows, newRow]);
      setNextId(nextId + 1);
    }
  };

  // Calcular totales por moneda
  const totales = useMemo(() => {
    const result: Record<string, number> = {};
    monedas.forEach((m) => {
      result[m.id] = 0;
    });

    rows.forEach((row) => {
      if (row.monedaId && row.monto) {
        result[row.monedaId] =
          (result[row.monedaId] || 0) + (parseFloat(row.monto) || 0);
      }
    });

    return result;
  }, [rows, monedas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar filas
    const filasValidas = rows.filter((row) => {
      return (
        row.solicitante.trim() &&
        row.tipoGastoId &&
        row.cajaId &&
        row.monedaId &&
        parseFloat(row.monto) > 0
      );
    });

    if (filasValidas.length === 0) {
      setError("Complete al menos una fila con todos los campos requeridos");
      return;
    }

    startTransition(async () => {
      try {
        const egresos = filasValidas.map((row) => {
          // Crear fecha en zona horaria local para evitar desfase
          const [year, month, day] = row.fecha.split("-").map(Number);
          const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);

          return {
            fechaSalida: fechaLocal,
            solicitante: row.solicitante,
            monto: parseFloat(row.monto),
            tipoGastoId: row.tipoGastoId,
            monedaId: row.monedaId,
            cajaId: row.cajaId,
            usuarioId,
            descripcionGasto: row.descripcion || undefined,
          };
        });

        await crearEgresosMultiples(egresos);
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/egresos");
          router.refresh();
        }, 1500);
      } catch (err) {
        console.error(err);
        setError("Error al guardar los egresos. Intente nuevamente.");
      }
    });
  };

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Card className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ¡Egresos Guardados!
          </h3>
          <p className="text-gray-600">Redirigiendo al listado...</p>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Resumen de totales */}
      <Card className="mb-6 bg-gradient-to-r from-[#fcece9] to-white border-[#f3b5a5]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {monedas.map((moneda) => (
              <div key={moneda.id}>
                <p className="text-xs text-[#872a12] font-medium">
                  Total {moneda.codigo}
                </p>
                <p className="text-2xl font-bold text-[#5a1c0c]">
                  {moneda.simbolo}
                  {totales[moneda.id]?.toFixed(2) || "0.00"}
                </p>
              </div>
            ))}
            <div className="h-10 w-px bg-[#f3b5a5]" />
            <div>
              <p className="text-xs text-[#872a12] font-medium">Registros</p>
              <p className="text-2xl font-bold text-[#5a1c0c]">{rows.length}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={addRow}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar Fila
          </Button>
        </div>
      </Card>

      {/* Filas de egresos */}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <Card key={row.id} className="relative">
            {/* Número de fila */}
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-[#e0451f] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              {index + 1}
            </div>

            {/* Botones de acción */}
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                onClick={() => duplicateRow(row.id)}
                className="p-1.5 text-[#73a9bf] hover:text-[#40768c] hover:bg-gray-100 rounded transition-colors"
                title="Duplicar fila"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="p-1.5 text-gray-400 hover:text-[#e0451f] hover:bg-red-50 rounded transition-colors"
                  title="Eliminar fila"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Campos del formulario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <Input
                label="Fecha"
                type="date"
                value={row.fecha}
                onChange={(e) => updateRow(row.id, "fecha", e.target.value)}
                required
              />
              <Input
                label="Solicitante"
                placeholder="Nombre del solicitante"
                value={row.solicitante}
                onChange={(e) =>
                  updateRow(row.id, "solicitante", e.target.value)
                }
                required
              />
              <Select
                label="Tipo de Gasto"
                options={tipoGastoOptions}
                value={row.tipoGastoId}
                onChange={(e) =>
                  updateRow(row.id, "tipoGastoId", e.target.value)
                }
                required
              />
              <Select
                label="Caja"
                options={cajaOptions}
                value={row.cajaId}
                onChange={(e) => updateRow(row.id, "cajaId", e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Monto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={row.monto}
                  onChange={(e) => updateRow(row.id, "monto", e.target.value)}
                  required
                />
                <Select
                  label="Moneda"
                  options={monedaOptions}
                  value={row.monedaId}
                  onChange={(e) =>
                    updateRow(row.id, "monedaId", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <Input
                label="Descripción del gasto"
                placeholder="Descripción detallada..."
                value={row.descripcion}
                onChange={(e) =>
                  updateRow(row.id, "descripcion", e.target.value)
                }
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={() => router.push("/dashboard/egresos")}
        >
          Cancelar
        </Button>
        <Button type="button" variant="secondary" onClick={addRow}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar Otra Fila
        </Button>
        <Button
          type="submit"
          variant="danger"
          className="flex-1 sm:flex-none sm:ml-auto"
          isLoading={isPending}
        >
          <svg
            className="w-4 h-4 mr-2"
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
          Guardar Todos ({rows.length} registros)
        </Button>
      </div>
    </form>
  );
}
