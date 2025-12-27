"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/layout";
import { Button, Card, Table, Badge, Select, Input } from "@/components/ui";

// Datos de ejemplo para maquetación
const ingresosEjemplo = [
  {
    id: "1",
    fecha: "2024-12-26",
    sociedad: "HOMBRES",
    servicio: "CULTO",
    tipoIngreso: "OFRENDA",
    montoUSD: 50.0,
    montoGTQ: 150.0,
    caja: "Caja General",
    observaciones: "Ofrenda recolectada en culto dominical",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-26T10:30:00",
  },
  {
    id: "2",
    fecha: "2024-12-25",
    sociedad: "MUJERES",
    servicio: "ORACION",
    tipoIngreso: "DIEZMO",
    montoUSD: 0,
    montoGTQ: 500.0,
    caja: "Caja Diezmos",
    observaciones: "Diezmo de María García",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-25T14:15:00",
  },
  {
    id: "3",
    fecha: "2024-12-24",
    sociedad: "CULTO_GENERAL",
    servicio: "VIGILIA",
    tipoIngreso: "TALENTOS",
    montoUSD: 100.0,
    montoGTQ: 0,
    caja: "Talentos Hombres",
    observaciones: "Talentos recolectados en vigilia navideña",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-24T23:45:00",
  },
  {
    id: "4",
    fecha: "2024-12-23",
    sociedad: "HOMBRES",
    servicio: "ENSENANZA",
    tipoIngreso: "DONACION",
    montoUSD: 25.0,
    montoGTQ: 200.0,
    caja: "Donaciones",
    observaciones: "Donación especial para proyecto de construcción",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-23T16:00:00",
  },
];

type IngresoItem = (typeof ingresosEjemplo)[0];

const sociedadOptions = [
  { value: "HOMBRES", label: "Hombres" },
  { value: "MUJERES", label: "Mujeres" },
  { value: "CULTO_GENERAL", label: "Culto General" },
];

const tipoIngresoOptions = [
  { value: "OFRENDA", label: "Ofrenda" },
  { value: "TALENTOS", label: "Talentos" },
  { value: "PROMESAS", label: "Promesas" },
  { value: "DIEZMO", label: "Diezmo" },
  { value: "DONACION", label: "Donación" },
  { value: "HNO_AYUDA", label: "Hermano en Ayuda" },
];

const formatSociedad = (sociedad: string) => {
  const map: Record<
    string,
    { label: string; variant: "info" | "success" | "warning" }
  > = {
    HOMBRES: { label: "Hombres", variant: "info" },
    MUJERES: { label: "Mujeres", variant: "success" },
    CULTO_GENERAL: { label: "Culto General", variant: "warning" },
  };
  return map[sociedad] || { label: sociedad, variant: "info" as const };
};

const formatTipoIngreso = (tipo: string) => {
  const map: Record<string, string> = {
    OFRENDA: "Ofrenda",
    TALENTOS: "Talentos",
    PROMESAS: "Promesas",
    DIEZMO: "Diezmo",
    DONACION: "Donación",
    HNO_AYUDA: "Hno. Ayuda",
  };
  return map[tipo] || tipo;
};

export default function IngresosPage() {
  const [filtros, setFiltros] = useState({
    fecha: "",
    sociedad: "",
    tipoIngreso: "",
  });
  const [selectedIngreso, setSelectedIngreso] = useState<IngresoItem | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const openDetailModal = (ingreso: IngresoItem) => {
    setSelectedIngreso(ingreso);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIngreso(null);
  };

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: (typeof ingresosEjemplo)[0]) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "sociedad",
      header: "Sociedad",
      render: (item: (typeof ingresosEjemplo)[0]) => {
        const { label, variant } = formatSociedad(item.sociedad);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: "tipoIngreso",
      header: "Tipo",
      render: (item: (typeof ingresosEjemplo)[0]) =>
        formatTipoIngreso(item.tipoIngreso),
    },
    {
      key: "montoUSD",
      header: "USD",
      className: "text-right",
      render: (item: (typeof ingresosEjemplo)[0]) =>
        item.montoUSD > 0 ? (
          <span className="font-medium text-green-600">
            ${item.montoUSD.toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "montoGTQ",
      header: "GTQ",
      className: "text-right",
      render: (item: (typeof ingresosEjemplo)[0]) =>
        item.montoGTQ > 0 ? (
          <span className="font-medium text-green-600">
            Q{item.montoGTQ.toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "acciones",
      header: "",
      render: (item: IngresoItem) => (
        <button
          className="text-gray-400 hover:text-[#2ba193] transition-colors"
          onClick={() => openDetailModal(item)}
          title="Ver detalles"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Ingresos"
        subtitle="Gestión de ofrendas, diezmos, talentos y donaciones"
      />

      <div className="p-4 md:p-6">
        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              label="Fecha"
              type="date"
              value={filtros.fecha}
              onChange={(e) =>
                setFiltros({ ...filtros, fecha: e.target.value })
              }
            />
            <Select
              label="Sociedad"
              options={sociedadOptions}
              value={filtros.sociedad}
              onChange={(e) =>
                setFiltros({ ...filtros, sociedad: e.target.value })
              }
            />
            <Select
              label="Tipo de Ingreso"
              options={tipoIngresoOptions}
              value={filtros.tipoIngreso}
              onChange={(e) =>
                setFiltros({ ...filtros, tipoIngreso: e.target.value })
              }
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() =>
                  setFiltros({ fecha: "", sociedad: "", tipoIngreso: "" })
                }
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Link href="/dashboard/ingresos/multiple">
              <Button variant="secondary" className="w-full sm:w-auto">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Múltiple Ingreso
              </Button>
            </Link>
            <Link href="/dashboard/ingresos/nuevo">
              <Button className="w-full sm:w-auto">
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
                Nuevo Ingreso
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tabla de ingresos */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={ingresosEjemplo}
            emptyMessage="No hay ingresos registrados"
          />
        </div>
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedIngreso && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={closeModal}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:my-16">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ebfaf8] rounded-lg flex items-center justify-center">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#203b46]">
                      Detalle del Ingreso
                    </h3>
                    <p className="text-sm text-[#73a9bf]">
                      ID: {selectedIngreso.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Montos */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-[#ebfaf8] to-white rounded-xl border border-[#aeeae3]">
                  <div>
                    <p className="text-xs text-[#20796f] font-medium mb-1">
                      Monto GTQ
                    </p>
                    <p className="text-xl font-bold text-[#15514a]">
                      {selectedIngreso.montoGTQ > 0
                        ? `Q${selectedIngreso.montoGTQ.toFixed(2)}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#20796f] font-medium mb-1">
                      Monto USD
                    </p>
                    <p className="text-xl font-bold text-[#15514a]">
                      {selectedIngreso.montoUSD > 0
                        ? `$${selectedIngreso.montoUSD.toFixed(2)}`
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Fecha
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {new Date(selectedIngreso.fecha).toLocaleDateString(
                        "es-GT",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Tipo de Servicio
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {selectedIngreso.servicio}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Sociedad
                    </p>
                    <Badge
                      variant={formatSociedad(selectedIngreso.sociedad).variant}
                    >
                      {formatSociedad(selectedIngreso.sociedad).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Tipo de Ingreso
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {formatTipoIngreso(selectedIngreso.tipoIngreso)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Caja Destino
                    </p>
                    <p className="text-sm text-[#203b46] flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-[#dea821]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      {selectedIngreso.caja}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Registrado por
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {selectedIngreso.registradoPor}
                    </p>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <p className="text-xs text-[#73a9bf] font-medium mb-1">
                    Observaciones
                  </p>
                  <p className="text-sm text-[#305969] bg-gray-50 p-3 rounded-lg">
                    {selectedIngreso.observaciones || "Sin observaciones"}
                  </p>
                </div>

                {/* Fecha de registro */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-[#73a9bf]">
                    Registrado el{" "}
                    {new Date(selectedIngreso.fechaRegistro).toLocaleString(
                      "es-GT"
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cerrar
                </Button>
                <Button className="flex-1">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
