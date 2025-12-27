"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/layout";
import { Button, Card, Table, Badge, Select, Input } from "@/components/ui";

// Datos de ejemplo para maquetación
const egresosEjemplo = [
  {
    id: "1",
    fecha: "2024-12-26",
    solicitante: "Pastor Juan Pérez",
    tipoGasto: "COMBUSTIBLE",
    monto: 500.0,
    moneda: "GTQ",
    descripcion: "Combustible para vehículo de la iglesia",
    proveedor: "Gasolinera Shell",
    factura: "FAC-001234",
    caja: "Caja General",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-26T11:00:00",
  },
  {
    id: "2",
    fecha: "2024-12-24",
    solicitante: "Tesorero Mario López",
    tipoGasto: "LUZ_ELECTRICA",
    monto: 850.0,
    moneda: "GTQ",
    descripcion: "Pago de recibo de luz mes de diciembre",
    proveedor: "EEGSA",
    factura: "REC-DIC-2024",
    caja: "Caja General",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-24T09:30:00",
  },
  {
    id: "3",
    fecha: "2024-12-22",
    solicitante: "Diacono Carlos Ruiz",
    tipoGasto: "AGUA_PIPA",
    monto: 200.0,
    moneda: "GTQ",
    descripcion: "Compra de pipa de agua para el templo",
    proveedor: "Agua Pura SA",
    factura: "FAC-5678",
    caja: "Caja General",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-22T14:15:00",
  },
  {
    id: "4",
    fecha: "2024-12-20",
    solicitante: "Administración",
    tipoGasto: "OTROS",
    monto: 50.0,
    moneda: "USD",
    descripcion: "Compra de materiales de limpieza",
    proveedor: "Ferretería Central",
    factura: "FAC-9012",
    caja: "Caja General",
    registradoPor: "Admin",
    fechaRegistro: "2024-12-20T16:45:00",
  },
];

type EgresoItem = (typeof egresosEjemplo)[0];

const tipoGastoOptions = [
  { value: "COMBUSTIBLE", label: "Combustible" },
  { value: "AGUA_PIPA", label: "Agua / Pipa" },
  { value: "FUNERARIA", label: "Funeraria" },
  { value: "LUZ_ELECTRICA", label: "Luz Eléctrica" },
  { value: "OTROS", label: "Otros" },
];

const formatTipoGasto = (tipo: string) => {
  const map: Record<
    string,
    { label: string; variant: "default" | "info" | "warning" | "danger" }
  > = {
    COMBUSTIBLE: { label: "Combustible", variant: "info" },
    AGUA_PIPA: { label: "Agua / Pipa", variant: "info" },
    FUNERARIA: { label: "Funeraria", variant: "warning" },
    LUZ_ELECTRICA: { label: "Luz Eléctrica", variant: "warning" },
    OTROS: { label: "Otros", variant: "default" },
  };
  return map[tipo] || { label: tipo, variant: "default" as const };
};

export default function EgresosPage() {
  const [filtros, setFiltros] = useState({
    fecha: "",
    tipoGasto: "",
  });
  const [selectedEgreso, setSelectedEgreso] = useState<EgresoItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openDetailModal = (egreso: EgresoItem) => {
    setSelectedEgreso(egreso);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEgreso(null);
  };

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: (typeof egresosEjemplo)[0]) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "solicitante",
      header: "Solicitante",
      render: (item: (typeof egresosEjemplo)[0]) => (
        <span className="font-medium text-gray-900">{item.solicitante}</span>
      ),
    },
    {
      key: "tipoGasto",
      header: "Tipo de Gasto",
      render: (item: (typeof egresosEjemplo)[0]) => {
        const { label, variant } = formatTipoGasto(item.tipoGasto);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: (typeof egresosEjemplo)[0]) => (
        <span className="font-medium text-red-600">
          {item.moneda === "USD" ? "$" : "Q"}
          {item.monto.toFixed(2)}
        </span>
      ),
    },
    {
      key: "moneda",
      header: "Moneda",
      render: (item: (typeof egresosEjemplo)[0]) => (
        <Badge variant={item.moneda === "USD" ? "success" : "info"}>
          {item.moneda}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      render: (item: EgresoItem) => (
        <button
          className="text-gray-400 hover:text-[#e0451f] transition-colors"
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
        title="Egresos"
        subtitle="Gestión de gastos y salidas de dinero"
      />

      <div className="p-4 md:p-6">
        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Input
              label="Fecha"
              type="date"
              value={filtros.fecha}
              onChange={(e) =>
                setFiltros({ ...filtros, fecha: e.target.value })
              }
            />
            <Select
              label="Tipo de Gasto"
              options={tipoGastoOptions}
              value={filtros.tipoGasto}
              onChange={(e) =>
                setFiltros({ ...filtros, tipoGasto: e.target.value })
              }
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setFiltros({ fecha: "", tipoGasto: "" })}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Link href="/dashboard/egresos/multiple">
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
                Múltiple Egreso
              </Button>
            </Link>
            <Link href="/dashboard/egresos/nuevo">
              <Button variant="danger" className="w-full sm:w-auto">
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
                    d="M20 12H4"
                  />
                </svg>
                Nuevo Egreso
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tabla de egresos */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={egresosEjemplo}
            emptyMessage="No hay egresos registrados"
          />
        </div>
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedEgreso && (
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
                  <div className="w-10 h-10 bg-[#fcece9] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#e0451f]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#203b46]">
                      Detalle del Egreso
                    </h3>
                    <p className="text-sm text-[#73a9bf]">
                      ID: {selectedEgreso.id}
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
                {/* Monto */}
                <div className="p-4 bg-gradient-to-br from-[#fcece9] to-white rounded-xl border border-[#f3b5a5]">
                  <p className="text-xs text-[#872a12] font-medium mb-1">
                    Monto
                  </p>
                  <p className="text-2xl font-bold text-[#5a1c0c]">
                    {selectedEgreso.moneda === "USD" ? "$" : "Q"}
                    {selectedEgreso.monto.toFixed(2)}
                    <span className="text-sm font-normal text-[#872a12] ml-2">
                      {selectedEgreso.moneda}
                    </span>
                  </p>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Fecha
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {new Date(selectedEgreso.fecha).toLocaleDateString(
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
                      Tipo de Gasto
                    </p>
                    <Badge
                      variant={
                        formatTipoGasto(selectedEgreso.tipoGasto).variant
                      }
                    >
                      {formatTipoGasto(selectedEgreso.tipoGasto).label}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Solicitante
                    </p>
                    <p className="text-sm font-medium text-[#203b46]">
                      {selectedEgreso.solicitante}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Proveedor
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {selectedEgreso.proveedor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      No. Factura
                    </p>
                    <p className="text-sm text-[#203b46] font-mono">
                      {selectedEgreso.factura}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Caja Origen
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
                      {selectedEgreso.caja}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#73a9bf] font-medium mb-1">
                      Registrado por
                    </p>
                    <p className="text-sm text-[#203b46]">
                      {selectedEgreso.registradoPor}
                    </p>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <p className="text-xs text-[#73a9bf] font-medium mb-1">
                    Descripción
                  </p>
                  <p className="text-sm text-[#305969] bg-gray-50 p-3 rounded-lg">
                    {selectedEgreso.descripcion || "Sin descripción"}
                  </p>
                </div>

                {/* Fecha de registro */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-[#73a9bf]">
                    Registrado el{" "}
                    {new Date(selectedEgreso.fechaRegistro).toLocaleString(
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
                <Button variant="danger" className="flex-1">
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
