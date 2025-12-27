"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Card, Badge, Button, Select, Input } from "@/components/ui";

// Las 7 cajas del sistema con sus datos de ejemplo
const cajasDelSistema = [
  {
    id: "caja-general",
    nombre: "Caja General",
    descripcion: "Recibe todas las ofrendas del culto general y servicios",
    tipoIngreso: "OFRENDA",
    activa: true,
    totalUSD: 1250.5,
    totalGTQ: 8500.0,
    color: "charcoal",
  },
  {
    id: "caja-talentos-hombres",
    nombre: "Caja Talentos - Hombres",
    descripcion: "Talentos recaudados por la sociedad de hombres",
    tipoIngreso: "TALENTOS",
    sociedad: "HOMBRES",
    activa: true,
    totalUSD: 320.0,
    totalGTQ: 2450.0,
    color: "verdigris",
  },
  {
    id: "caja-talentos-mujeres",
    nombre: "Caja Talentos - Mujeres",
    descripcion: "Talentos recaudados por la sociedad de mujeres",
    tipoIngreso: "TALENTOS",
    sociedad: "MUJERES",
    activa: true,
    totalUSD: 480.0,
    totalGTQ: 3200.0,
    color: "verdigris",
  },
  {
    id: "caja-promesas",
    nombre: "Caja de Promesas",
    descripcion: "Promesas exclusivas de la sociedad de mujeres",
    tipoIngreso: "PROMESAS",
    sociedad: "MUJERES",
    activa: true,
    totalUSD: 150.0,
    totalGTQ: 1800.0,
    color: "tuscan",
  },
  {
    id: "caja-diezmos",
    nombre: "Caja de Diezmos",
    descripcion: "Diezmos de todos los miembros de la iglesia",
    tipoIngreso: "DIEZMO",
    activa: true,
    totalUSD: 2100.0,
    totalGTQ: 15000.0,
    color: "sandy",
  },
  {
    id: "caja-donaciones",
    nombre: "Caja de Donaciones",
    descripcion: "Donaciones especiales y ofrendas de amor",
    tipoIngreso: "DONACION",
    activa: true,
    totalUSD: 500.0,
    totalGTQ: 3500.0,
    color: "burnt",
  },
  {
    id: "caja-hno-ayuda",
    nombre: "Caja Hermano en Ayuda",
    descripcion: "Fondos destinados para ayudar a hermanos necesitados",
    tipoIngreso: "HNO_AYUDA",
    activa: true,
    totalUSD: 200.0,
    totalGTQ: 1200.0,
    color: "charcoal",
  },
];

const colorClasses: Record<
  string,
  { bg: string; border: string; icon: string; text: string }
> = {
  charcoal: {
    bg: "bg-[#eef4f7]",
    border: "border-[#b9d4df]",
    icon: "text-[#40768c]",
    text: "text-[#305969]",
  },
  verdigris: {
    bg: "bg-[#ebfaf8]",
    border: "border-[#aeeae3]",
    icon: "text-[#2ba193]",
    text: "text-[#20796f]",
  },
  tuscan: {
    bg: "bg-[#fcf6e9]",
    border: "border-[#f2dca6]",
    icon: "text-[#b1871b]",
    text: "text-[#856514]",
  },
  sandy: {
    bg: "bg-[#fdf1e7]",
    border: "border-[#f8c8a0]",
    icon: "text-[#bf5d0d]",
    text: "text-[#8f460a]",
  },
  burnt: {
    bg: "bg-[#fcece9]",
    border: "border-[#f3b5a5]",
    icon: "text-[#b43718]",
    text: "text-[#872a12]",
  },
};

const reporteOptions = [
  { value: "diario", label: "Reporte Diario" },
  { value: "semanal", label: "Reporte Semanal" },
  { value: "mensual", label: "Reporte Mensual" },
  { value: "anual", label: "Reporte Anual" },
  { value: "personalizado", label: "Rango Personalizado" },
];

const cajaReporteOptions = [
  { value: "todas", label: "Todas las Cajas" },
  ...cajasDelSistema.map((c) => ({ value: c.id, label: c.nombre })),
];

export default function CajasPage() {
  const [filtroReporte, setFiltroReporte] = useState({
    tipo: "mensual",
    caja: "todas",
    fechaInicio: "",
    fechaFin: "",
  });

  const totalGeneralUSD = cajasDelSistema.reduce(
    (acc, c) => acc + c.totalUSD,
    0
  );
  const totalGeneralGTQ = cajasDelSistema.reduce(
    (acc, c) => acc + c.totalGTQ,
    0
  );

  return (
    <div className="min-h-screen">
      <Header title="Cajas" subtitle="Gestión de cajas contables y fondos" />

      <div className="p-4 md:p-6">
        {/* Resumen Total */}
        <div className="mb-8 p-4 md:p-6 bg-gradient-to-r from-[#101e23] to-[#305969] rounded-2xl text-white">
          <h2 className="text-base md:text-lg font-medium text-[#b9d4df] mb-4">
            Balance Total del Sistema
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div>
              <p className="text-xs md:text-sm text-[#96bfcf]">Total USD</p>
              <p className="text-xl md:text-3xl font-bold">
                $
                {totalGeneralUSD.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-[#96bfcf]">Total GTQ</p>
              <p className="text-xl md:text-3xl font-bold">
                Q
                {totalGeneralGTQ.toLocaleString("es-GT", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-[#96bfcf]">Cajas Activas</p>
              <p className="text-xl md:text-3xl font-bold">
                {cajasDelSistema.filter((c) => c.activa).length}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-[#96bfcf]">Total Cajas</p>
              <p className="text-xl md:text-3xl font-bold">
                {cajasDelSistema.length}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Cajas */}
        <h3 className="text-lg font-semibold text-[#203b46] mb-4">
          Cajas del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {cajasDelSistema.map((caja) => {
            const colors = colorClasses[caja.color] || colorClasses.charcoal;
            return (
              <Card
                key={caja.id}
                className={`relative ${
                  !caja.activa ? "opacity-60" : ""
                } hover:shadow-lg transition-shadow`}
              >
                {/* Indicador de estado */}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={caja.activa ? "success" : "default"}
                    size="sm"
                  >
                    {caja.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>

                {/* Icono y nombre */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} border ${colors.border}`}
                  >
                    <svg
                      className={`w-5 h-5 ${colors.icon}`}
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
                  <div className="flex-1 min-w-0 pr-8">
                    <h4
                      className={`text-sm font-semibold ${colors.text} truncate`}
                    >
                      {caja.nombre}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {caja.descripcion}
                    </p>
                  </div>
                </div>

                {/* Saldos */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#ebfaf8] rounded-md p-2">
                      <p className="text-[10px] text-[#2ba193] font-medium">
                        USD
                      </p>
                      <p className="text-sm font-bold text-[#15514a]">
                        $
                        {caja.totalUSD.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="bg-[#eef4f7] rounded-md p-2">
                      <p className="text-[10px] text-[#40768c] font-medium">
                        GTQ
                      </p>
                      <p className="text-sm font-bold text-[#203b46]">
                        Q
                        {caja.totalGTQ.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón Ver Detalle */}
                <Link
                  href={`/dashboard/cajas/${cajasDelSistema.indexOf(caja) + 1}`}
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-[#40768c] hover:text-[#305969] hover:bg-[#eef4f7] rounded-lg transition-colors"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Ver Detalle
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Sección de Reportes */}
        <div className="border-t border-[#b9d4df] pt-8">
          <h3 className="text-lg font-semibold text-[#203b46] mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#40768c]"
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
            Reportes Específicos
          </h3>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Select
                label="Tipo de Reporte"
                options={reporteOptions}
                value={filtroReporte.tipo}
                onChange={(e) =>
                  setFiltroReporte((prev) => ({
                    ...prev,
                    tipo: e.target.value,
                  }))
                }
              />
              <Select
                label="Caja"
                options={cajaReporteOptions}
                value={filtroReporte.caja}
                onChange={(e) =>
                  setFiltroReporte((prev) => ({
                    ...prev,
                    caja: e.target.value,
                  }))
                }
              />
              {filtroReporte.tipo === "personalizado" && (
                <>
                  <Input
                    label="Fecha Inicio"
                    type="date"
                    value={filtroReporte.fechaInicio}
                    onChange={(e) =>
                      setFiltroReporte((prev) => ({
                        ...prev,
                        fechaInicio: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Fecha Fin"
                    type="date"
                    value={filtroReporte.fechaFin}
                    onChange={(e) =>
                      setFiltroReporte((prev) => ({
                        ...prev,
                        fechaFin: e.target.value,
                      }))
                    }
                  />
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Ver Reporte
              </Button>
              <Button variant="secondary">
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Exportar PDF
              </Button>
              <Button variant="secondary">
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exportar Excel
              </Button>
            </div>
          </Card>

          {/* Reportes Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card hoverable className="cursor-pointer">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-[#203b46]">
                    Ingresos del Mes
                  </h4>
                  <p className="text-xs text-gray-500">
                    Resumen de todos los ingresos
                  </p>
                </div>
              </div>
            </Card>

            <Card hoverable className="cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fcece9] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#b43718]"
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
                  <h4 className="font-medium text-[#203b46]">
                    Egresos del Mes
                  </h4>
                  <p className="text-xs text-gray-500">
                    Resumen de todos los egresos
                  </p>
                </div>
              </div>
            </Card>

            <Card hoverable className="cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fcf6e9] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#b1871b]"
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
                  <h4 className="font-medium text-[#203b46]">
                    Comparativo por Caja
                  </h4>
                  <p className="text-xs text-gray-500">Análisis entre cajas</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-8 p-4 bg-[#eef4f7] rounded-lg border border-[#b9d4df]">
          <p className="text-xs font-semibold text-[#40768c] uppercase tracking-wide mb-3">
            Leyenda de Cajas
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#305969]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#36c9b8] rounded-full" />
              <span>Caja activa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span>Caja inactiva</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
