"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Button, Card, Input, Select } from "@/components/ui";

interface EgresoRow {
  id: number;
  fecha: string;
  solicitante: string;
  tipoGasto: string;
  monto: string;
  moneda: string;
  proveedor: string;
  factura: string;
  descripcion: string;
}

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

const createEmptyRow = (id: number): EgresoRow => ({
  id,
  fecha: new Date().toISOString().split("T")[0],
  solicitante: "",
  tipoGasto: "",
  monto: "",
  moneda: "GTQ",
  proveedor: "",
  factura: "",
  descripcion: "",
});

export default function MultipleEgresoPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EgresoRow[]>([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3),
  ]);
  const [nextId, setNextId] = useState(4);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar múltiples egresos
    console.log("Guardando egresos:", rows);
    alert("Egresos guardados exitosamente (maqueta)");
    router.push("/dashboard/egresos");
  };

  const calcularTotales = () => {
    return rows.reduce(
      (acc, row) => {
        const monto = parseFloat(row.monto) || 0;
        if (row.moneda === "GTQ") {
          return { ...acc, gtq: acc.gtq + monto };
        } else {
          return { ...acc, usd: acc.usd + monto };
        }
      },
      { gtq: 0, usd: 0 }
    );
  };

  const totales = calcularTotales();

  return (
    <div className="min-h-screen">
      <Header
        title="Múltiple Egreso"
        subtitle="Registrar varios egresos a la vez"
        backUrl="/dashboard/egresos"
      />

      <form onSubmit={handleSubmit} className="p-4 md:p-6">
        {/* Resumen de totales */}
        <Card className="mb-6 bg-gradient-to-r from-[#fcece9] to-white border-[#f3b5a5]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-[#872a12] font-medium">Total GTQ</p>
                <p className="text-2xl font-bold text-[#5a1c0c]">
                  Q{totales.gtq.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-px bg-[#f3b5a5]" />
              <div>
                <p className="text-xs text-[#872a12] font-medium">Total USD</p>
                <p className="text-2xl font-bold text-[#5a1c0c]">
                  ${totales.usd.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-px bg-[#f3b5a5]" />
              <div>
                <p className="text-xs text-[#872a12] font-medium">Registros</p>
                <p className="text-2xl font-bold text-[#5a1c0c]">
                  {rows.length}
                </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                  value={row.tipoGasto}
                  onChange={(e) =>
                    updateRow(row.id, "tipoGasto", e.target.value)
                  }
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
                    value={row.moneda}
                    onChange={(e) =>
                      updateRow(row.id, "moneda", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <Input
                  label="Proveedor"
                  placeholder="Nombre del proveedor"
                  value={row.proveedor}
                  onChange={(e) =>
                    updateRow(row.id, "proveedor", e.target.value)
                  }
                />
                <Input
                  label="No. Factura"
                  placeholder="FAC-000000"
                  value={row.factura}
                  onChange={(e) => updateRow(row.id, "factura", e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Descripción"
                    placeholder="Descripción del gasto..."
                    value={row.descripcion}
                    onChange={(e) =>
                      updateRow(row.id, "descripcion", e.target.value)
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
    </div>
  );
}
