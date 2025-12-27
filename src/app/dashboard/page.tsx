"use client";

import Link from "next/link";
import { Header } from "@/components/layout";
import { Card, Badge } from "@/components/ui";

// Datos de ejemplo para el dashboard
const resumenFinanciero = {
  totalIngresosGTQ: 35650.0,
  totalIngresosUSD: 5000.5,
  totalEgresosGTQ: 12500.0,
  totalEgresosUSD: 800.0,
  balanceGTQ: 23150.0,
  balanceUSD: 4200.5,
};

const ingresosPorTipo = [
  { tipo: "Ofrendas", monto: 8500, porcentaje: 24, color: "#2ba193" },
  { tipo: "Diezmos", monto: 15000, porcentaje: 42, color: "#305969" },
  { tipo: "Talentos", monto: 5650, porcentaje: 16, color: "#dea821" },
  { tipo: "Donaciones", monto: 3500, porcentaje: 10, color: "#ee7411" },
  { tipo: "Promesas", monto: 1800, porcentaje: 5, color: "#40768c" },
  { tipo: "Hno. Ayuda", monto: 1200, porcentaje: 3, color: "#e0451f" },
];

const egresosPorTipo = [
  { tipo: "Combustible", monto: 5000, porcentaje: 40, color: "#305969" },
  { tipo: "Luz Eléctrica", monto: 3500, porcentaje: 28, color: "#dea821" },
  { tipo: "Agua/Pipa", monto: 2000, porcentaje: 16, color: "#2ba193" },
  { tipo: "Funeraria", monto: 1500, porcentaje: 12, color: "#ee7411" },
  { tipo: "Otros", monto: 500, porcentaje: 4, color: "#73a9bf" },
];

const cajas = [
  { nombre: "Caja General", saldoGTQ: 8500, saldoUSD: 1250, activa: true },
  { nombre: "Caja Diezmos", saldoGTQ: 15000, saldoUSD: 2100, activa: true },
  { nombre: "Talentos Hombres", saldoGTQ: 2450, saldoUSD: 320, activa: true },
  { nombre: "Talentos Mujeres", saldoGTQ: 3200, saldoUSD: 480, activa: true },
  { nombre: "Caja Promesas", saldoGTQ: 1800, saldoUSD: 150, activa: true },
  { nombre: "Donaciones", saldoGTQ: 3500, saldoUSD: 500, activa: true },
  { nombre: "Hno. en Ayuda", saldoGTQ: 1200, saldoUSD: 200, activa: true },
];

const ultimosMovimientos = [
  {
    id: "1",
    tipo: "ingreso",
    concepto: "Ofrenda - Culto Dominical",
    monto: 500,
    moneda: "GTQ",
    fecha: "2024-12-26",
  },
  {
    id: "2",
    tipo: "egreso",
    concepto: "Pago Luz Eléctrica",
    monto: 450,
    moneda: "GTQ",
    fecha: "2024-12-25",
  },
  {
    id: "3",
    tipo: "ingreso",
    concepto: "Diezmo - Juan Pérez",
    monto: 1000,
    moneda: "GTQ",
    fecha: "2024-12-24",
  },
  {
    id: "4",
    tipo: "ingreso",
    concepto: "Talentos Mujeres",
    monto: 150,
    moneda: "USD",
    fecha: "2024-12-24",
  },
  {
    id: "5",
    tipo: "egreso",
    concepto: "Combustible",
    monto: 200,
    moneda: "GTQ",
    fecha: "2024-12-23",
  },
];

const tendenciaMensual = [
  { mes: "Jul", ingresos: 28000, egresos: 10000 },
  { mes: "Ago", ingresos: 32000, egresos: 11500 },
  { mes: "Sep", ingresos: 29500, egresos: 9800 },
  { mes: "Oct", ingresos: 35000, egresos: 12000 },
  { mes: "Nov", ingresos: 33000, egresos: 11000 },
  { mes: "Dic", ingresos: 35650, egresos: 12500 },
];

const maxTendencia = Math.max(
  ...tendenciaMensual.map((t) => Math.max(t.ingresos, t.egresos))
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="Inicio" subtitle="Resumen de ingresos y gastos" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Tarjetas de Resumen Principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Ingresos */}
          <Card className="bg-gradient-to-br from-[#ebfaf8] to-white border-[#aeeae3]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#20796f] font-medium">
                  💰 Ingresos
                </p>
                <p className="text-2xl font-bold text-[#15514a]">
                  ${resumenFinanciero.totalIngresosUSD.toFixed(2)}
                </p>
                <p className="text-sm text-[#2ba193]">
                  Q{resumenFinanciero.totalIngresosGTQ.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#2ba193] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
            </div>
          </Card>

          {/* Total Egresos */}
          <Card className="bg-gradient-to-br from-[#fcece9] to-white border-[#f3b5a5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#872a12] font-medium">
                  💸 Gastos
                </p>
                <p className="text-2xl font-bold text-[#5a1c0c]">
                  ${resumenFinanciero.totalEgresosUSD.toFixed(2)}
                </p>
                <p className="text-sm text-[#e0451f]">
                  Q{resumenFinanciero.totalEgresosGTQ.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#e0451f] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
            </div>
          </Card>

          {/* Balance */}
          <Card className="bg-gradient-to-br from-[#eef4f7] to-white border-[#b9d4df]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#305969] font-medium">
                  📊 Disponible
                </p>
                <p className="text-2xl font-bold text-[#203b46]">
                  ${resumenFinanciero.balanceUSD.toFixed(2)}
                </p>
                <p className="text-sm text-[#40768c]">
                  Q{resumenFinanciero.balanceGTQ.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#40768c] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
            </div>
          </Card>

          {/* Cajas Activas */}
          <Card className="bg-gradient-to-br from-[#fcf6e9] to-white border-[#f2dca6]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#856514] font-medium">
                  🗄️ Cajas
                </p>
                <p className="text-2xl font-bold text-[#59430d]">
                  {cajas.filter((c) => c.activa).length}
                </p>
                <p className="text-sm text-[#b1871b]">
                  activas
                </p>
              </div>
              <div className="w-12 h-12 bg-[#dea821] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
            </div>
          </Card>
        </div>

        {/* Gráficos y Distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Tendencia Mensual */}
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] mb-4 flex items-center gap-2">
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
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              📈 Últimos 6 meses
            </h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {tendenciaMensual.map((mes, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex gap-1 h-36 items-end justify-center">
                    <div
                      className="w-4 bg-[#2ba193] rounded-t transition-all hover:bg-[#20796f]"
                      style={{
                        height: `${(mes.ingresos / maxTendencia) * 100}%`,
                      }}
                      title={`Ingresos: Q${mes.ingresos.toFixed(2)}`}
                    />
                    <div
                      className="w-4 bg-[#e0451f] rounded-t transition-all hover:bg-[#b43718]"
                      style={{
                        height: `${(mes.egresos / maxTendencia) * 100}%`,
                      }}
                      title={`Egresos: Q${mes.egresos.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-xs text-[#73a9bf]">{mes.mes}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#2ba193] rounded" />
                <span className="text-xs text-[#73a9bf]">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#e0451f] rounded" />
                <span className="text-xs text-[#73a9bf]">Egresos</span>
              </div>
            </div>
          </Card>

          {/* Distribución de Ingresos */}
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] mb-4 flex items-center gap-2">
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
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              💵 ¿De dónde vienen los ingresos?
            </h3>
            <div className="space-y-3">
              {ingresosPorTipo.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#305969]">{item.tipo}</span>
                    <span className="font-medium text-[#203b46]">
                      Q{item.monto.toFixed(2)} ({item.porcentaje}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.porcentaje}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Segunda fila de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución de Egresos */}
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] mb-4 flex items-center gap-2">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              💳 ¿En qué se gasta?
            </h3>
            <div className="space-y-3">
              {egresosPorTipo.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#305969]">{item.tipo}</span>
                    <span className="font-medium text-[#203b46]">
                      Q{item.monto.toFixed(2)} ({item.porcentaje}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.porcentaje}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Últimos Movimientos */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#40768c] flex items-center gap-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                🕒 Actividad reciente
              </h3>
              <Link
                href="/dashboard/reportes"
                className="text-xs text-[#2ba193] hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {ultimosMovimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        mov.tipo === "ingreso" ? "bg-[#ebfaf8]" : "bg-[#fcece9]"
                      }`}
                    >
                      {mov.tipo === "ingreso" ? (
                        <svg
                          className="w-4 h-4 text-[#2ba193]"
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
                      ) : (
                        <svg
                          className="w-4 h-4 text-[#e0451f]"
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
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#203b46]">
                        {mov.concepto}
                      </p>
                      <p className="text-xs text-[#73a9bf]">
                        {new Date(mov.fecha).toLocaleDateString("es-GT")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      mov.tipo === "ingreso"
                        ? "text-[#2ba193]"
                        : "text-[#e0451f]"
                    }`}
                  >
                    {mov.tipo === "ingreso" ? "+" : "-"}
                    {mov.moneda === "USD" ? "$" : "Q"}
                    {mov.monto.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Resumen de Cajas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#40768c] flex items-center gap-2">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              🗃️ Dinero en cada caja
            </h3>
            <Link
              href="/dashboard/cajas"
              className="text-xs text-[#2ba193] hover:underline"
            >
              Ver detalle
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {cajas.map((caja, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#b9d4df] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#305969] truncate">
                    {caja.nombre}
                  </span>
                  <Badge variant="success" size="sm">
                    Activa
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-[#73a9bf]">USD: </span>
                    <span className="font-semibold text-[#203b46]">
                      ${caja.saldoUSD.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#73a9bf]">GTQ: </span>
                    <span className="font-semibold text-[#203b46]">
                      Q{caja.saldoGTQ.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Accesos Rápidos */}
        <div>
          <h3 className="text-sm font-semibold text-[#40768c] mb-4">
            ⚡ Acciones rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/ingresos/nuevo"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#aeeae3] hover:bg-[#ebfaf8] transition-all"
            >
              <div className="w-10 h-10 bg-[#ebfaf8] rounded-full flex items-center justify-center">
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
              <span className="text-sm font-medium text-[#305969]">
                Nuevo Ingreso
              </span>
            </Link>

            <Link
              href="/dashboard/egresos/nuevo"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#f3b5a5] hover:bg-[#fcece9] transition-all"
            >
              <div className="w-10 h-10 bg-[#fcece9] rounded-full flex items-center justify-center">
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
              <span className="text-sm font-medium text-[#305969]">
                Nuevo Egreso
              </span>
            </Link>

            <Link
              href="/dashboard/cajas"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#b9d4df] hover:bg-[#eef4f7] transition-all"
            >
              <div className="w-10 h-10 bg-[#eef4f7] rounded-full flex items-center justify-center">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#305969]">
                Ver Cajas
              </span>
            </Link>

            <Link
              href="/dashboard/reportes"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#f2dca6] hover:bg-[#fcf6e9] transition-all"
            >
              <div className="w-10 h-10 bg-[#fcf6e9] rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#dea821]"
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
              </div>
              <span className="text-sm font-medium text-[#305969]">
                Reportes
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
