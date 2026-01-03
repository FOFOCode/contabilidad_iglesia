"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Card, Badge, Button, Table, Combobox, Input } from "@/components/ui";

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
}

interface Saldo {
  moneda: Moneda;
  ingresos: number;
  donaciones: number;
  egresos: number;
  saldo: number;
}

interface Movimiento {
  id: string;
  fecha: Date;
  tipo: "ingreso" | "egreso";
  concepto: string;
  esSecundario?: boolean;
  cajaPrincipal?: { id: string; nombre: string } | null;
  origen: "ingreso" | "egreso" | "donacion" | "diezmoFilial" | "egresoFilial";
  montos: {
    monto: number;
    monedaId: string;
    monedaCodigo: string;
    monedaSimbolo: string;
  }[];
}

interface MovimientoFilial {
  id: string;
  fecha: Date;
  tipo: "ingreso" | "egreso";
  concepto: string;
  filial: string;
  origen: "diezmoFilial" | "egresoFilial";
  montos: {
    monto: number;
    monedaId: string;
    monedaCodigo: string;
    monedaSimbolo: string;
  }[];
}

interface Caja {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  esGeneral: boolean;
  sociedad: { id: string; nombre: string } | null;
  tipoIngreso: { id: string; nombre: string } | null;
}

interface CajaDetalleClientProps {
  caja: Caja;
  movimientos: Movimiento[];
  movimientosFiliales: MovimientoFilial[];
  saldos: Saldo[];
  monedas: Moneda[];
}

export function CajaDetalleClient({
  caja,
  movimientos: movimientosIniciales,
  movimientosFiliales,
  saldos,
  monedas,
}: CajaDetalleClientProps) {
  const router = useRouter();
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    tipo: "",
  });

  // Filtrar movimientos
  const movimientosFiltrados = movimientosIniciales.filter((mov) => {
    if (filtros.tipo && mov.tipo !== filtros.tipo) return false;
    if (filtros.fechaDesde) {
      const fechaMov = new Date(mov.fecha);
      const fechaDesde = new Date(filtros.fechaDesde);
      if (fechaMov < fechaDesde) return false;
    }
    if (filtros.fechaHasta) {
      const fechaMov = new Date(mov.fecha);
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      if (fechaMov > fechaHasta) return false;
    }
    return true;
  });

  // Calcular estadísticas del período filtrado
  const stats = movimientosFiltrados.reduce(
    (acc, mov) => {
      mov.montos.forEach((m) => {
        if (!acc.porMoneda[m.monedaId]) {
          acc.porMoneda[m.monedaId] = {
            codigo: m.monedaCodigo,
            simbolo: m.monedaSimbolo,
            ingresos: 0,
            egresos: 0,
          };
        }
        if (mov.tipo === "ingreso") {
          acc.porMoneda[m.monedaId].ingresos += m.monto;
          acc.countIngresos++;
        } else {
          acc.porMoneda[m.monedaId].egresos += m.monto;
          acc.countEgresos++;
        }
      });
      return acc;
    },
    {
      porMoneda: {} as Record<
        string,
        { codigo: string; simbolo: string; ingresos: number; egresos: number }
      >,
      countIngresos: 0,
      countEgresos: 0,
    }
  );

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: Movimiento) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (item: Movimiento) => (
        <div className="flex flex-col gap-1">
          <Badge variant={item.tipo === "ingreso" ? "success" : "danger"}>
            {item.tipo === "ingreso" ? "Ingreso" : "Egreso"}
          </Badge>
          {item.esSecundario && (
            <Badge variant="info" size="sm">
              Tracking
            </Badge>
          )}
          {item.origen === "donacion" && (
            <Badge variant="warning" size="sm">
              Donación
            </Badge>
          )}
          {item.origen === "diezmoFilial" && (
            <Badge variant="info" size="sm">
              Diezmo Filial
            </Badge>
          )}
          {item.origen === "egresoFilial" && (
            <Badge variant="warning" size="sm">
              Egreso Filial
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "concepto",
      header: "Concepto",
      render: (item: Movimiento) => (
        <div>
          <span className="font-medium text-[#203b46]">{item.concepto}</span>
          {item.esSecundario && item.cajaPrincipal && (
            <p className="text-xs text-[#73a9bf] mt-1">
              Dinero en: {item.cajaPrincipal.nombre}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: Movimiento) => (
        <div>
          {item.montos.map((m, idx) => (
            <span
              key={idx}
              className={`block font-medium ${
                item.tipo === "ingreso" ? "text-[#2ba193]" : "text-[#e0451f]"
              }`}
            >
              {item.tipo === "ingreso" ? "+" : "-"}
              {m.monedaSimbolo}
              {m.monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
            </span>
          ))}
        </div>
      ),
    },
  ];

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
              <div className="flex gap-2">
                <Badge variant={caja.activa ? "success" : "default"}>
                  {caja.activa ? "Activa" : "Inactiva"}
                </Badge>
                {caja.esGeneral && <Badge variant="info">General</Badge>}
              </div>
            </div>
            <div className="space-y-2">
              {saldos.map((s) => (
                <div
                  key={s.moneda.id}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-[#73a9bf]">
                    {s.moneda.codigo}:
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      s.saldo >= 0 ? "text-[#203b46]" : "text-[#e0451f]"
                    }`}
                  >
                    {s.moneda.simbolo}
                    {s.saldo.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#b9d4df] space-y-2">
              {caja.sociedad && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#73a9bf]">Sociedad:</span>
                  <Badge variant="info" size="sm">
                    {caja.sociedad.nombre}
                  </Badge>
                </div>
              )}
              {caja.tipoIngreso && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#73a9bf]">Tipo Ingreso:</span>
                  <span className="text-sm text-[#305969]">
                    {caja.tipoIngreso.nombre}
                  </span>
                </div>
              )}
              {caja.descripcion && (
                <div className="mt-2">
                  <span className="text-xs text-[#73a9bf]">Descripción:</span>
                  <p className="text-sm text-[#305969]">{caja.descripcion}</p>
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
              {Object.entries(stats.porMoneda).map(([monedaId, data]) => (
                <div
                  key={monedaId}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-[#2ba193]">{data.codigo}:</span>
                  <span className="text-xl font-bold text-[#15514a]">
                    +{data.simbolo}
                    {data.ingresos.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
              {Object.keys(stats.porMoneda).length === 0 && (
                <p className="text-sm text-[#73a9bf]">Sin movimientos</p>
              )}
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
              {Object.entries(stats.porMoneda).map(([monedaId, data]) => (
                <div
                  key={monedaId}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-[#e0451f]">{data.codigo}:</span>
                  <span className="text-xl font-bold text-[#5a1c0c]">
                    -{data.simbolo}
                    {data.egresos.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
              {Object.keys(stats.porMoneda).length === 0 && (
                <p className="text-sm text-[#73a9bf]">Sin movimientos</p>
              )}
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
            <Combobox
              label="Tipo"
              options={[
                { value: "ingreso", label: "Ingresos" },
                { value: "egreso", label: "Egresos" },
              ]}
              value={filtros.tipo}
              onChange={(value) => setFiltros({ ...filtros, tipo: value })}
              placeholder="Todos"
              clearable
              searchable={false}
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
            </div>
          </div>

          {/* Tabla de movimientos */}
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={movimientosFiltrados}
              emptyMessage="No hay movimientos registrados"
            />
          </div>
        </Card>

        {/* Movimientos de Filiales */}
        {movimientosFiliales.length > 0 && (
          <Card className="bg-gradient-to-br from-[#f8f3ff] to-white border-[#d4c5e8]">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-[#6b4b9c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-sm font-semibold text-[#6b4b9c] uppercase tracking-wide">
                Movimientos de Filiales (Referencia)
              </h3>
              <Badge variant="info" size="sm">
                {movimientosFiliales.length} movimientos
              </Badge>
            </div>
            <p className="text-sm text-[#8b7ba8] mb-4">
              Los movimientos de filiales se registran en una "Caja Filiales"
              virtual y se muestran aquí como referencia.
            </p>
            <div className="overflow-x-auto">
              <Table
                columns={[
                  {
                    key: "fecha",
                    header: "Fecha",
                    render: (item: MovimientoFilial) =>
                      new Date(item.fecha).toLocaleDateString("es-GT"),
                  },
                  {
                    key: "tipo",
                    header: "Tipo",
                    render: (item: MovimientoFilial) => (
                      <Badge
                        variant={item.tipo === "ingreso" ? "success" : "danger"}
                      >
                        {item.tipo === "ingreso" ? "Diezmo" : "Egreso"}
                      </Badge>
                    ),
                  },
                  {
                    key: "filial",
                    header: "Filial",
                    render: (item: MovimientoFilial) => (
                      <Badge variant="info">{item.filial}</Badge>
                    ),
                  },
                  {
                    key: "concepto",
                    header: "Concepto",
                    render: (item: MovimientoFilial) => (
                      <span className="text-[#203b46]">{item.concepto}</span>
                    ),
                  },
                  {
                    key: "monto",
                    header: "Monto",
                    className: "text-right",
                    render: (item: MovimientoFilial) => (
                      <div>
                        {item.montos.map((m, idx) => (
                          <span
                            key={idx}
                            className={`block font-medium ${
                              item.tipo === "ingreso"
                                ? "text-[#2ba193]"
                                : "text-[#e0451f]"
                            }`}
                          >
                            {item.tipo === "ingreso" ? "+" : "-"}
                            {m.monedaSimbolo}
                            {m.monto.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                ]}
                data={movimientosFiliales}
                emptyMessage="No hay movimientos de filiales"
              />
            </div>
          </Card>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/dashboard/ingresos/nuevo?cajaId=${caja.id}`}
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
          <Link
            href={`/dashboard/egresos/nuevo?cajaId=${caja.id}`}
            className="flex-1 sm:flex-none"
          >
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
            href={`/dashboard/reportes?cajaId=${caja.id}`}
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
