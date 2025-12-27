"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Card, Badge, Button, Table, Select, Input } from "@/components/ui";

// Datos de ejemplo para la caja
const cajasData: Record<
  string,
  {
    id: string;
    nombre: string;
    sociedad: string | null;
    tipoIngreso: string | null;
    saldoGTQ: number;
    saldoUSD: number;
    activa: boolean;
  }
> = {
  "1": {
    id: "1",
    nombre: "Caja General",
    sociedad: null,
    tipoIngreso: "OFRENDA",
    saldoGTQ: 8500,
    saldoUSD: 1250,
    activa: true,
  },
  "2": {
    id: "2",
    nombre: "Caja Diezmos",
    sociedad: null,
    tipoIngreso: "DIEZMO",
    saldoGTQ: 15000,
    saldoUSD: 2100,
    activa: true,
  },
  "3": {
    id: "3",
    nombre: "Talentos Hombres",
    sociedad: "HOMBRES",
    tipoIngreso: "TALENTOS",
    saldoGTQ: 2450,
    saldoUSD: 320,
    activa: true,
  },
  "4": {
    id: "4",
    nombre: "Talentos Mujeres",
    sociedad: "MUJERES",
    tipoIngreso: "TALENTOS",
    saldoGTQ: 3200,
    saldoUSD: 480,
    activa: true,
  },
  "5": {
    id: "5",
    nombre: "Caja Promesas",
    sociedad: null,
    tipoIngreso: "PROMESAS",
    saldoGTQ: 1800,
    saldoUSD: 150,
    activa: true,
  },
  "6": {
    id: "6",
    nombre: "Donaciones",
    sociedad: null,
    tipoIngreso: "DONACION",
    saldoGTQ: 3500,
    saldoUSD: 500,
    activa: true,
  },
  "7": {
    id: "7",
    nombre: "Hno. en Ayuda",
    sociedad: null,
    tipoIngreso: "HNO_AYUDA",
    saldoGTQ: 1200,
    saldoUSD: 200,
    activa: true,
  },
};

// Movimientos de ejemplo
const movimientosData = [
  {
    id: "1",
    fecha: "2024-12-26",
    tipo: "ingreso",
    concepto: "Ofrenda Culto Dominical",
    montoGTQ: 500,
    montoUSD: 0,
    saldoGTQ: 8500,
    saldoUSD: 1250,
  },
  {
    id: "2",
    fecha: "2024-12-25",
    tipo: "egreso",
    concepto: "Pago Luz Eléctrica",
    montoGTQ: 450,
    montoUSD: 0,
    saldoGTQ: 8000,
    saldoUSD: 1250,
  },
  {
    id: "3",
    fecha: "2024-12-24",
    tipo: "ingreso",
    concepto: "Ofrenda Vigilia Navideña",
    montoGTQ: 1200,
    montoUSD: 50,
    saldoGTQ: 8450,
    saldoUSD: 1250,
  },
  {
    id: "4",
    fecha: "2024-12-23",
    tipo: "ingreso",
    concepto: "Ofrenda Especial",
    montoGTQ: 800,
    montoUSD: 100,
    saldoGTQ: 7250,
    saldoUSD: 1200,
  },
  {
    id: "5",
    fecha: "2024-12-22",
    tipo: "egreso",
    concepto: "Combustible",
    montoGTQ: 200,
    montoUSD: 0,
    saldoGTQ: 6450,
    saldoUSD: 1100,
  },
  {
    id: "6",
    fecha: "2024-12-21",
    tipo: "ingreso",
    concepto: "Ofrenda Culto",
    montoGTQ: 650,
    montoUSD: 0,
    saldoGTQ: 6650,
    saldoUSD: 1100,
  },
  {
    id: "7",
    fecha: "2024-12-20",
    tipo: "ingreso",
    concepto: "Ofrenda Servicio Especial",
    montoGTQ: 1000,
    montoUSD: 200,
    saldoGTQ: 6000,
    saldoUSD: 1100,
  },
  {
    id: "8",
    fecha: "2024-12-19",
    tipo: "egreso",
    concepto: "Materiales Limpieza",
    montoGTQ: 150,
    montoUSD: 0,
    saldoGTQ: 5000,
    saldoUSD: 900,
  },
];

const formatSociedad = (sociedad: string | null) => {
  if (!sociedad) return null;
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

const formatTipoIngreso = (tipo: string | null) => {
  if (!tipo) return null;
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

export default function CajaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cajaId = params.id as string;
  const caja = cajasData[cajaId];

  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    tipo: "",
  });

  if (!caja) {
    return (
      <div className="min-h-screen">
        <Header title="Caja no encontrada" backUrl="/dashboard/cajas" />
        <div className="p-6">
          <Card className="text-center py-12">
            <p className="text-gray-500">La caja solicitada no existe.</p>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/cajas")}
            >
              Volver a Cajas
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: (typeof movimientosData)[0]) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (item: (typeof movimientosData)[0]) => (
        <Badge variant={item.tipo === "ingreso" ? "success" : "danger"}>
          {item.tipo === "ingreso" ? "Ingreso" : "Egreso"}
        </Badge>
      ),
    },
    {
      key: "concepto",
      header: "Concepto",
      render: (item: (typeof movimientosData)[0]) => (
        <span className="font-medium text-[#203b46]">{item.concepto}</span>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: (typeof movimientosData)[0]) => (
        <div
          className={
            item.tipo === "ingreso" ? "text-[#2ba193]" : "text-[#e0451f]"
          }
        >
          {item.tipo === "ingreso" ? "+" : "-"}
          {item.montoGTQ > 0 && (
            <span className="font-medium">Q{item.montoGTQ.toFixed(2)}</span>
          )}
          {item.montoGTQ > 0 && item.montoUSD > 0 && " / "}
          {item.montoUSD > 0 && (
            <span className="font-medium">${item.montoUSD.toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      key: "saldo",
      header: "Saldo",
      className: "text-right",
      render: (item: (typeof movimientosData)[0]) => (
        <div className="text-sm text-[#73a9bf]">
          <div>Q{item.saldoGTQ.toFixed(2)}</div>
          <div>${item.saldoUSD.toFixed(2)}</div>
        </div>
      ),
    },
  ];

  // Estadísticas de movimientos
  const stats = movimientosData.reduce(
    (acc, mov) => {
      if (mov.tipo === "ingreso") {
        return {
          ...acc,
          totalIngresosGTQ: acc.totalIngresosGTQ + mov.montoGTQ,
          totalIngresosUSD: acc.totalIngresosUSD + mov.montoUSD,
          countIngresos: acc.countIngresos + 1,
        };
      } else {
        return {
          ...acc,
          totalEgresosGTQ: acc.totalEgresosGTQ + mov.montoGTQ,
          totalEgresosUSD: acc.totalEgresosUSD + mov.montoUSD,
          countEgresos: acc.countEgresos + 1,
        };
      }
    },
    {
      totalIngresosGTQ: 0,
      totalIngresosUSD: 0,
      totalEgresosGTQ: 0,
      totalEgresosUSD: 0,
      countIngresos: 0,
      countEgresos: 0,
    }
  );

  const sociedadInfo = formatSociedad(caja.sociedad);

  return (
    <div className="min-h-screen">
      <Header
        title={caja.nombre}
        subtitle="Detalle y movimientos de la caja"
        backUrl="/dashboard/cajas"
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Información de la Caja */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saldo Actual */}
          <Card className="bg-gradient-to-br from-[#eef4f7] to-white border-[#b9d4df]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide">
                Saldo Actual
              </h3>
              <Badge variant={caja.activa ? "success" : "default"}>
                {caja.activa ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#73a9bf]">GTQ:</span>
                <span className="text-2xl font-bold text-[#203b46]">
                  Q{caja.saldoGTQ.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#73a9bf]">USD:</span>
                <span className="text-2xl font-bold text-[#203b46]">
                  ${caja.saldoUSD.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#b9d4df] space-y-2">
              {sociedadInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#73a9bf]">Sociedad:</span>
                  <Badge variant={sociedadInfo.variant} size="sm">
                    {sociedadInfo.label}
                  </Badge>
                </div>
              )}
              {caja.tipoIngreso && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#73a9bf]">Tipo Ingreso:</span>
                  <span className="text-sm text-[#305969]">
                    {formatTipoIngreso(caja.tipoIngreso)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Ingresos del Período */}
          <Card className="bg-gradient-to-br from-[#ebfaf8] to-white border-[#aeeae3]">
            <h3 className="text-sm font-semibold text-[#20796f] uppercase tracking-wide mb-4">
              Ingresos (Período)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2ba193]">GTQ:</span>
                <span className="text-xl font-bold text-[#15514a]">
                  +Q{stats.totalIngresosGTQ.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2ba193]">USD:</span>
                <span className="text-xl font-bold text-[#15514a]">
                  +${stats.totalIngresosUSD.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#aeeae3]">
              <span className="text-xs text-[#20796f]">
                {stats.countIngresos} movimientos de ingreso
              </span>
            </div>
          </Card>

          {/* Egresos del Período */}
          <Card className="bg-gradient-to-br from-[#fcece9] to-white border-[#f3b5a5]">
            <h3 className="text-sm font-semibold text-[#872a12] uppercase tracking-wide mb-4">
              Egresos (Período)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#e0451f]">GTQ:</span>
                <span className="text-xl font-bold text-[#5a1c0c]">
                  -Q{stats.totalEgresosGTQ.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#e0451f]">USD:</span>
                <span className="text-xl font-bold text-[#5a1c0c]">
                  -${stats.totalEgresosUSD.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#f3b5a5]">
              <span className="text-xs text-[#872a12]">
                {stats.countEgresos} movimientos de egreso
              </span>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
            Historial de Movimientos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              label="Desde"
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaDesde: e.target.value })
              }
            />
            <Input
              label="Hasta"
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaHasta: e.target.value })
              }
            />
            <Select
              label="Tipo"
              options={[
                { value: "ingreso", label: "Ingresos" },
                { value: "egreso", label: "Egresos" },
              ]}
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            />
            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  setFiltros({ fechaDesde: "", fechaHasta: "", tipo: "" })
                }
              >
                Limpiar
              </Button>
              <Button variant="secondary">
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
              </Button>
            </div>
          </div>

          {/* Tabla de movimientos */}
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={movimientosData}
              emptyMessage="No hay movimientos registrados"
            />
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/ingresos/nuevo"
            className="flex-1 sm:flex-none"
          >
            <Button className="w-full">
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
              Nuevo Ingreso a esta Caja
            </Button>
          </Link>
          <Link href="/dashboard/egresos/nuevo" className="flex-1 sm:flex-none">
            <Button variant="danger" className="w-full">
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
              Nuevo Egreso de esta Caja
            </Button>
          </Link>
          <Link
            href="/dashboard/reportes"
            className="flex-1 sm:flex-none sm:ml-auto"
          >
            <Button variant="secondary" className="w-full">
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
          </Link>
        </div>
      </div>
    </div>
  );
}
