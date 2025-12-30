"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Select, Button } from "@/components/ui";
import { crearIngresosMultiples } from "@/app/actions/operaciones";

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
}

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface MultipleIngresoFormProps {
  sociedades: Sociedad[];
  servicios: TipoServicio[];
  tiposIngreso: TipoIngreso[];
  cajas: Caja[];
  monedas: Moneda[];
  usuarioId: string;
}

interface IngresoRow {
  id: number;
  fecha: string;
  sociedadId: string;
  servicioId: string;
  tipoIngresoId: string;
  cajaId: string;
  monto: string;
  monedaId: string;
  comentario: string;
}

export function MultipleIngresoForm({
  sociedades,
  servicios,
  tiposIngreso,
  cajas,
  monedas,
  usuarioId,
}: MultipleIngresoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Moneda principal por defecto
  const monedaPrincipal = monedas.find((m) => m.esPrincipal) || monedas[0];

  const createEmptyRow = (id: number): IngresoRow => ({
    id,
    fecha: new Date().toISOString().split("T")[0],
    sociedadId: "",
    servicioId: "",
    tipoIngresoId: "",
    cajaId: "",
    monto: "",
    monedaId: monedaPrincipal?.id || "",
    comentario: "",
  });

  const [rows, setRows] = useState<IngresoRow[]>([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3),
  ]);
  const [nextId, setNextId] = useState(4);

  // Opciones para selects
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
    { value: "", label: "-- Seleccione --" },
    ...cajas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  const monedaOptions = monedas.map((m) => ({
    value: m.id,
    label: `${m.simbolo} ${m.codigo}`,
  }));

  // Función para encontrar caja sugerida
  const findSuggestedCaja = (
    sociedadId: string,
    tipoIngresoId: string
  ): string => {
    if (!sociedadId || !tipoIngresoId) return "";

    // Obtener el nombre del tipo de ingreso seleccionado
    const tipoSeleccionado = tiposIngreso.find((t) => t.id === tipoIngresoId);

    // Si es OFRENDA, buscar la caja general primero
    if (tipoSeleccionado?.nombre.toUpperCase() === "OFRENDA") {
      const cajaGeneral = cajas.find((c) => c.esGeneral);
      if (cajaGeneral) return cajaGeneral.id;
    }

    // Buscar caja que coincida con sociedad Y tipo de ingreso
    let caja = cajas.find(
      (c) => c.sociedadId === sociedadId && c.tipoIngresoId === tipoIngresoId
    );

    // Si no hay, buscar solo por tipo de ingreso
    if (!caja) {
      caja = cajas.find(
        (c) => c.tipoIngresoId === tipoIngresoId && !c.sociedadId
      );
    }

    // Si no hay, buscar solo por sociedad
    if (!caja) {
      caja = cajas.find((c) => c.sociedadId === sociedadId && !c.tipoIngresoId);
    }

    return caja?.id || "";
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow(nextId)]);
    setNextId(nextId + 1);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (
    id: number,
    field: keyof IngresoRow,
    value: string | Record<string, string>
  ) => {
    setRows(
      rows.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: value };

        // Auto-asignar caja cuando se selecciona sociedad o tipo de ingreso
        if (field === "sociedadId" || field === "tipoIngresoId") {
          const sociedadId =
            field === "sociedadId" ? (value as string) : row.sociedadId;
          const tipoIngresoId =
            field === "tipoIngresoId" ? (value as string) : row.tipoIngresoId;
          const suggestedCajaId = findSuggestedCaja(sociedadId, tipoIngresoId);
          if (suggestedCajaId) {
            updatedRow.cajaId = suggestedCajaId;
          }
        }

        return updatedRow;
      })
    );
  };

  const duplicateRow = (id: number) => {
    const rowToDuplicate = rows.find((row) => row.id === id);
    if (rowToDuplicate) {
      const newRow = {
        ...rowToDuplicate,
        id: nextId,
      };
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
      if (row.monto && row.monedaId) {
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
      if (
        !row.sociedadId ||
        !row.servicioId ||
        !row.tipoIngresoId ||
        !row.cajaId ||
        !row.monedaId
      ) {
        return false;
      }
      const tieneMontos = parseFloat(row.monto) > 0;
      return tieneMontos;
    });

    if (filasValidas.length === 0) {
      setError(
        "Complete al menos una fila con todos los campos requeridos y un monto válido"
      );
      return;
    }

    startTransition(async () => {
      try {
        const ingresos = filasValidas.map((row) => {
          // Crear fecha en zona horaria local para evitar desfase
          const [year, month, day] = row.fecha.split("-").map(Number);
          const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);

          return {
            fechaRecaudacion: fechaLocal,
            sociedadId: row.sociedadId,
            servicioId: row.servicioId,
            tipoIngresoId: row.tipoIngresoId,
            cajaId: row.cajaId,
            usuarioId,
            comentario: row.comentario || undefined,
            montos: [
              {
                monedaId: row.monedaId,
                monto: parseFloat(row.monto),
              },
            ],
          };
        });

        await crearIngresosMultiples(ingresos);
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/ingresos");
          router.refresh();
        }, 1500);
      } catch (err) {
        console.error(err);
        setError("Error al guardar los ingresos. Intente nuevamente.");
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
            ¡Ingresos Guardados!
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
      <Card className="mb-6 bg-gradient-to-r from-[#ebfaf8] to-white border-[#aeeae3]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {monedas.map((moneda) => (
              <div key={moneda.id}>
                <p className="text-xs text-[#20796f] font-medium">
                  Total {moneda.codigo}
                </p>
                <p className="text-2xl font-bold text-[#15514a]">
                  {moneda.simbolo}
                  {totales[moneda.id]?.toFixed(2) || "0.00"}
                </p>
              </div>
            ))}
            <div className="h-10 w-px bg-[#aeeae3]" />
            <div>
              <p className="text-xs text-[#20796f] font-medium">Registros</p>
              <p className="text-2xl font-bold text-[#15514a]">{rows.length}</p>
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

      {/* Filas de ingresos */}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <Card key={row.id} className="relative">
            {/* Número de fila */}
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-[#2ba193] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
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
              <Select
                label="Sociedad"
                options={sociedadOptions}
                value={row.sociedadId}
                onChange={(e) =>
                  updateRow(row.id, "sociedadId", e.target.value)
                }
                required
              />
              <Select
                label="Tipo de Servicio"
                options={servicioOptions}
                value={row.servicioId}
                onChange={(e) =>
                  updateRow(row.id, "servicioId", e.target.value)
                }
                required
              />
              <Select
                label="Tipo de Ingreso"
                options={tipoIngresoOptions}
                value={row.tipoIngresoId}
                onChange={(e) =>
                  updateRow(row.id, "tipoIngresoId", e.target.value)
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
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
                onChange={(e) => updateRow(row.id, "monedaId", e.target.value)}
                required
              />
              <div className="col-span-2">
                <Input
                  label="Observaciones"
                  placeholder="Notas adicionales..."
                  value={row.comentario}
                  onChange={(e) =>
                    updateRow(row.id, "comentario", e.target.value)
                  }
                />
              </div>
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
          onClick={() => router.push("/dashboard/ingresos")}
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
