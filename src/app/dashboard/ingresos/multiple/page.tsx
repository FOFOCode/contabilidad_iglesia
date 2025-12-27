"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Button, Card, Input, Select, TextArea } from "@/components/ui";

interface IngresoRow {
  id: number;
  fecha: string;
  sociedad: string;
  servicio: string;
  tipoIngreso: string;
  montoGTQ: string;
  montoUSD: string;
  observaciones: string;
}

const sociedadOptions = [
  { value: "HOMBRES", label: "Hombres" },
  { value: "MUJERES", label: "Mujeres" },
  { value: "CULTO_GENERAL", label: "Culto General" },
];

const servicioOptions = [
  { value: "CULTO", label: "Culto" },
  { value: "ORACION", label: "Oración" },
  { value: "ENSENANZA", label: "Enseñanza" },
  { value: "VIGILIA", label: "Vigilia" },
  { value: "ESPECIAL", label: "Servicio Especial" },
];

const tipoIngresoOptions = [
  { value: "OFRENDA", label: "Ofrenda" },
  { value: "TALENTOS", label: "Talentos" },
  { value: "PROMESAS", label: "Promesas" },
  { value: "DIEZMO", label: "Diezmo" },
  { value: "DONACION", label: "Donación" },
  { value: "HNO_AYUDA", label: "Hermano en Ayuda" },
];

const createEmptyRow = (id: number): IngresoRow => ({
  id,
  fecha: new Date().toISOString().split("T")[0],
  sociedad: "",
  servicio: "",
  tipoIngreso: "",
  montoGTQ: "",
  montoUSD: "",
  observaciones: "",
});

export default function MultipleIngresoPage() {
  const router = useRouter();
  const [rows, setRows] = useState<IngresoRow[]>([
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

  const updateRow = (id: number, field: keyof IngresoRow, value: string) => {
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
    // Aquí iría la lógica para guardar múltiples ingresos
    console.log("Guardando ingresos:", rows);
    alert("Ingresos guardados exitosamente (maqueta)");
    router.push("/dashboard/ingresos");
  };

  const calcularTotales = () => {
    return rows.reduce(
      (acc, row) => ({
        gtq: acc.gtq + (parseFloat(row.montoGTQ) || 0),
        usd: acc.usd + (parseFloat(row.montoUSD) || 0),
      }),
      { gtq: 0, usd: 0 }
    );
  };

  const totales = calcularTotales();

  return (
    <div className="min-h-screen">
      <Header
        title="Múltiple Ingreso"
        subtitle="Registrar varios ingresos a la vez"
        backUrl="/dashboard/ingresos"
      />

      <form onSubmit={handleSubmit} className="p-4 md:p-6">
        {/* Resumen de totales */}
        <Card className="mb-6 bg-gradient-to-r from-[#ebfaf8] to-white border-[#aeeae3]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-[#20796f] font-medium">Total GTQ</p>
                <p className="text-2xl font-bold text-[#15514a]">
                  Q{totales.gtq.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-px bg-[#aeeae3]" />
              <div>
                <p className="text-xs text-[#20796f] font-medium">Total USD</p>
                <p className="text-2xl font-bold text-[#15514a]">
                  ${totales.usd.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-px bg-[#aeeae3]" />
              <div>
                <p className="text-xs text-[#20796f] font-medium">Registros</p>
                <p className="text-2xl font-bold text-[#15514a]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                  value={row.sociedad}
                  onChange={(e) =>
                    updateRow(row.id, "sociedad", e.target.value)
                  }
                  required
                />
                <Select
                  label="Tipo de Servicio"
                  options={servicioOptions}
                  value={row.servicio}
                  onChange={(e) =>
                    updateRow(row.id, "servicio", e.target.value)
                  }
                  required
                />
                <Select
                  label="Tipo de Ingreso"
                  options={tipoIngresoOptions}
                  value={row.tipoIngreso}
                  onChange={(e) =>
                    updateRow(row.id, "tipoIngreso", e.target.value)
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <Input
                  label="Monto GTQ"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={row.montoGTQ}
                  onChange={(e) =>
                    updateRow(row.id, "montoGTQ", e.target.value)
                  }
                />
                <Input
                  label="Monto USD"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={row.montoUSD}
                  onChange={(e) =>
                    updateRow(row.id, "montoUSD", e.target.value)
                  }
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Observaciones"
                    placeholder="Notas adicionales..."
                    value={row.observaciones}
                    onChange={(e) =>
                      updateRow(row.id, "observaciones", e.target.value)
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
          <Button type="submit" className="flex-1 sm:flex-none sm:ml-auto">
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
