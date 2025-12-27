"use client";

import { useState } from "react";
import { Header } from "@/components/layout";
import { Card, Button, Select, Input, Badge, Table } from "@/components/ui";

const tipoReporteOptions = [
  { value: "ingresos", label: "Reporte de Ingresos" },
  { value: "egresos", label: "Reporte de Egresos" },
  { value: "balance", label: "Balance General" },
  { value: "caja", label: "Movimientos por Caja" },
  { value: "sociedad", label: "Ingresos por Sociedad" },
  { value: "comparativo", label: "Comparativo Mensual" },
];

const periodoOptions = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
  { value: "trimestre", label: "Este Trimestre" },
  { value: "anio", label: "Este Año" },
  { value: "personalizado", label: "Rango Personalizado" },
];

const cajaOptions = [
  { value: "todas", label: "Todas las Cajas" },
  { value: "caja-general", label: "Caja General (Ofrendas)" },
  { value: "caja-talentos-hombres", label: "Caja Talentos - Hombres" },
  { value: "caja-talentos-mujeres", label: "Caja Talentos - Mujeres" },
  { value: "caja-promesas", label: "Caja de Promesas" },
  { value: "caja-diezmos", label: "Caja de Diezmos" },
  { value: "caja-donaciones", label: "Caja de Donaciones" },
  { value: "caja-hno-ayuda", label: "Caja Hermano en Ayuda" },
];

const sociedadOptions = [
  { value: "todas", label: "Todas las Sociedades" },
  { value: "HOMBRES", label: "Hombres" },
  { value: "MUJERES", label: "Mujeres" },
  { value: "CULTO_GENERAL", label: "Culto General" },
];

// Datos de ejemplo para el reporte
const datosReporteEjemplo = [
  {
    id: "1",
    fecha: "2024-12-26",
    concepto: "Ofrenda - Culto General",
    tipo: "Ingreso",
    monto: 500,
    moneda: "GTQ",
  },
  {
    id: "2",
    fecha: "2024-12-25",
    concepto: "Diezmo - Juan Pérez",
    tipo: "Ingreso",
    monto: 1000,
    moneda: "GTQ",
  },
  {
    id: "3",
    fecha: "2024-12-24",
    concepto: "Combustible",
    tipo: "Egreso",
    monto: 200,
    moneda: "GTQ",
  },
  {
    id: "4",
    fecha: "2024-12-23",
    concepto: "Talentos - Mujeres",
    tipo: "Ingreso",
    monto: 150,
    moneda: "USD",
  },
  {
    id: "5",
    fecha: "2024-12-22",
    concepto: "Luz Eléctrica",
    tipo: "Egreso",
    monto: 450,
    moneda: "GTQ",
  },
];

export default function ReportesPage() {
  const [filtros, setFiltros] = useState({
    tipoReporte: "ingresos",
    periodo: "mes",
    fechaInicio: "",
    fechaFin: "",
    caja: "todas",
    sociedad: "todas",
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerarReporte = () => {
    setMostrarResultados(true);
  };

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: (typeof datosReporteEjemplo)[0]) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "concepto",
      header: "Concepto",
      render: (item: (typeof datosReporteEjemplo)[0]) => (
        <span className="font-medium text-[#203b46]">{item.concepto}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (item: (typeof datosReporteEjemplo)[0]) => (
        <Badge variant={item.tipo === "Ingreso" ? "success" : "danger"}>
          {item.tipo}
        </Badge>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: (typeof datosReporteEjemplo)[0]) => (
        <span
          className={`font-semibold ${
            item.tipo === "Ingreso" ? "text-[#2ba193]" : "text-[#e0451f]"
          }`}
        >
          {item.tipo === "Ingreso" ? "+" : "-"}
          {item.moneda === "USD" ? "$" : "Q"}
          {item.monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  // Cálculos de resumen
  const totalIngresos = datosReporteEjemplo
    .filter((d) => d.tipo === "Ingreso" && d.moneda === "GTQ")
    .reduce((acc, d) => acc + d.monto, 0);
  const totalEgresos = datosReporteEjemplo
    .filter((d) => d.tipo === "Egreso" && d.moneda === "GTQ")
    .reduce((acc, d) => acc + d.monto, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Reportes"
        subtitle="Genera y exporta reportes detallados del sistema"
      />

      <div className="p-4 md:p-6">
        {/* Panel de Filtros */}
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4 flex items-center gap-2">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Configurar Reporte
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Select
              label="Tipo de Reporte"
              name="tipoReporte"
              options={tipoReporteOptions}
              value={filtros.tipoReporte}
              onChange={handleChange}
            />
            <Select
              label="Período"
              name="periodo"
              options={periodoOptions}
              value={filtros.periodo}
              onChange={handleChange}
            />
            <Select
              label="Caja"
              name="caja"
              options={cajaOptions}
              value={filtros.caja}
              onChange={handleChange}
            />
          </div>

          {filtros.periodo === "personalizado" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Input
                label="Fecha Inicio"
                name="fechaInicio"
                type="date"
                value={filtros.fechaInicio}
                onChange={handleChange}
              />
              <Input
                label="Fecha Fin"
                name="fechaFin"
                type="date"
                value={filtros.fechaFin}
                onChange={handleChange}
              />
            </div>
          )}

          {(filtros.tipoReporte === "ingresos" ||
            filtros.tipoReporte === "sociedad") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Select
                label="Sociedad"
                name="sociedad"
                options={sociedadOptions}
                value={filtros.sociedad}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGenerarReporte}>
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
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generar Reporte
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setFiltros({
                  tipoReporte: "ingresos",
                  periodo: "mes",
                  fechaInicio: "",
                  fechaFin: "",
                  caja: "todas",
                  sociedad: "todas",
                })
              }
            >
              Limpiar Filtros
            </Button>
          </div>
        </Card>

        {/* Resultados del Reporte */}
        {mostrarResultados && (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-[#ebfaf8] to-white border-[#aeeae3]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2ba193] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                    <p className="text-xs text-[#20796f] font-medium">
                      Total Ingresos
                    </p>
                    <p className="text-xl font-bold text-[#15514a]">
                      Q{totalIngresos.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[#fcece9] to-white border-[#f3b5a5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e0451f] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                    <p className="text-xs text-[#872a12] font-medium">
                      Total Egresos
                    </p>
                    <p className="text-xl font-bold text-[#5a1c0c]">
                      Q{totalEgresos.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[#eef4f7] to-white border-[#b9d4df]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#40768c] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#305969] font-medium">
                      Balance
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        totalIngresos - totalEgresos >= 0
                          ? "text-[#15514a]"
                          : "text-[#e0451f]"
                      }`}
                    >
                      Q{(totalIngresos - totalEgresos).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[#fcf6e9] to-white border-[#f2dca6]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#dea821] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                  <div>
                    <p className="text-xs text-[#856514] font-medium">
                      Movimientos
                    </p>
                    <p className="text-xl font-bold text-[#59430d]">
                      {datosReporteEjemplo.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Botones de Exportación */}
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide flex items-center gap-2">
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Exportar Reporte
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    PDF
                  </Button>
                  <Button size="sm" variant="secondary">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </Button>
                  <Button size="sm" variant="secondary">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    CSV
                  </Button>
                  <Button size="sm" variant="ghost">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Imprimir
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabla de Resultados */}
            <Card>
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4 flex items-center gap-2">
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
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Detalle de Movimientos
              </h3>
              <div className="overflow-x-auto -mx-6 px-6">
                <Table
                  columns={columns}
                  data={datosReporteEjemplo}
                  emptyMessage="No hay movimientos para mostrar"
                />
              </div>
            </Card>
          </>
        )}

        {/* Reportes Rápidos */}
        {!mostrarResultados && (
          <div>
            <h3 className="text-lg font-semibold text-[#203b46] mb-4">
              Reportes Rápidos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "ingresos",
                    periodo: "mes",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#ebfaf8] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#2ba193]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">
                      Ingresos del Mes
                    </h4>
                    <p className="text-sm text-[#73a9bf]">
                      Todos los ingresos de diciembre
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "egresos",
                    periodo: "mes",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#fcece9] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#e0451f]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">
                      Egresos del Mes
                    </h4>
                    <p className="text-sm text-[#73a9bf]">
                      Todos los gastos de diciembre
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "balance",
                    periodo: "mes",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#eef4f7] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#40768c]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">
                      Balance Mensual
                    </h4>
                    <p className="text-sm text-[#73a9bf]">
                      Resumen de ingresos vs egresos
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "caja",
                    periodo: "mes",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#fcf6e9] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#dea821]"
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
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">Por Caja</h4>
                    <p className="text-sm text-[#73a9bf]">
                      Movimientos por cada caja
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "sociedad",
                    periodo: "mes",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#fdf1e7] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#ee7411]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">
                      Por Sociedad
                    </h4>
                    <p className="text-sm text-[#73a9bf]">Ingresos por grupo</p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="cursor-pointer"
                onClick={() => {
                  setFiltros((prev) => ({
                    ...prev,
                    tipoReporte: "comparativo",
                    periodo: "anio",
                  }));
                  setMostrarResultados(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#d7f4f1] rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#20796f]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#203b46]">
                      Comparativo Anual
                    </h4>
                    <p className="text-sm text-[#73a9bf]">
                      Tendencias mes a mes
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
