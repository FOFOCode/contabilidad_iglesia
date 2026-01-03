"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface MontoAgrupado {
  monedaId: string;
  total: number;
}

interface UltimoIngreso {
  id: string;
  fechaRecaudacion: Date;
  sociedad: { nombre: string };
  tipoIngreso: { nombre: string };
  caja: { nombre: string };
  montos: { monto: number; moneda: { simbolo: string; codigo: string } }[];
}

interface UltimoEgreso {
  id: string;
  fechaSalida: Date;
  solicitante: string;
  monto: number;
  tipoGasto: { nombre: string };
  caja: { nombre: string };
  moneda: { simbolo: string; codigo: string };
}

interface IngresoPorSociedad {
  sociedadId: string;
  nombre: string;
  montos: { monedaId: string; total: number }[];
}

interface EgresoPorTipo {
  tipoGastoId: string;
  monedaId: string;
  total: number;
}

interface TipoGasto {
  id: string;
  nombre: string;
}

interface CajaConSaldo {
  id: string;
  nombre: string;
  esGeneral: boolean;
  saldos: { monedaId: string; saldo: number }[];
}

interface CajaVirtualMonto {
  monedaId: string;
  monto: number;
  simbolo: string;
  codigo: string;
}

interface CajaVirtualSociedad {
  id: string;
  nombre: string;
  montos: CajaVirtualMonto[];
}

interface CajaVirtual {
  id: string;
  nombre: string;
  totalPorMoneda: CajaVirtualMonto[];
  porSociedad: CajaVirtualSociedad[];
}

interface DashboardClientProps {
  monedas: Moneda[];
  ingresosMes: MontoAgrupado[];
  egresosMes: MontoAgrupado[];
  ingresosMesAnterior: MontoAgrupado[];
  egresosMesAnterior: MontoAgrupado[];
  ingresosAnio: MontoAgrupado[];
  egresosAnio: MontoAgrupado[];
  ingresosPorSociedad: IngresoPorSociedad[];
  egresosPorTipo: EgresoPorTipo[];
  tiposGasto: TipoGasto[];
  cajasConSaldos: CajaConSaldo[];
  cajasVirtuales: CajaVirtual[];
  totalIngresos: number;
  totalEgresos: number;
  totalCajas: number;
  ultimosIngresos: UltimoIngreso[];
  ultimosEgresos: UltimoEgreso[];
  configurado: boolean;
}

export function DashboardClient({
  monedas,
  ingresosMes,
  egresosMes,
  ingresosMesAnterior,
  egresosMesAnterior,
  ingresosAnio,
  egresosAnio,
  ingresosPorSociedad,
  egresosPorTipo,
  tiposGasto,
  cajasConSaldos,
  cajasVirtuales,
  totalIngresos,
  totalEgresos,
  totalCajas,
  ultimosIngresos,
  ultimosEgresos,
  configurado,
}: DashboardClientProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatMonto = (monto: number, simbolo: string) => {
    return `${simbolo} ${monto.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calcular porcentaje de cambio
  const calcularCambio = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };

  // Moneda principal para algunos cálculos - memoizado
  const monedaPrincipal = useMemo(
    () => monedas.find((m) => m.esPrincipal) || monedas[0],
    [monedas]
  );

  // Calcular resúmenes por moneda - memoizado para evitar recálculos
  const resumenPorMoneda = useMemo(
    () =>
      monedas
        .map((moneda) => {
          const ingresos =
            ingresosMes.find((i) => i.monedaId === moneda.id)?.total || 0;
          const egresos =
            egresosMes.find((e) => e.monedaId === moneda.id)?.total || 0;
          const ingresosAnt =
            ingresosMesAnterior.find((i) => i.monedaId === moneda.id)?.total ||
            0;
          const egresosAnt =
            egresosMesAnterior.find((e) => e.monedaId === moneda.id)?.total ||
            0;
          const ingresosAnual =
            ingresosAnio.find((i) => i.monedaId === moneda.id)?.total || 0;
          const egresosAnual =
            egresosAnio.find((e) => e.monedaId === moneda.id)?.total || 0;
          return {
            moneda,
            ingresos,
            egresos,
            balance: ingresos - egresos,
            ingresosAnt,
            egresosAnt,
            balanceAnt: ingresosAnt - egresosAnt,
            ingresosAnual,
            egresosAnual,
            balanceAnual: ingresosAnual - egresosAnual,
          };
        })
        .filter(
          (r) =>
            r.ingresos > 0 ||
            r.egresos > 0 ||
            r.ingresosAnual > 0 ||
            r.egresosAnual > 0
        ),
    [
      monedas,
      ingresosMes,
      egresosMes,
      ingresosMesAnterior,
      egresosMesAnterior,
      ingresosAnio,
      egresosAnio,
    ]
  );

  if (!configurado) {
    return (
      <div className="p-4 md:p-6">
        <Card className="text-center py-16 bg-gradient-to-br from-[#eef4f7] to-white">
          <div className="text-6xl mb-6">⛪</div>
          <h2 className="text-2xl font-bold text-[#203b46] mb-4">
            ¡Bienvenido al Sistema de Contabilidad!
          </h2>
          <p className="text-[#40768c] mb-8 max-w-md mx-auto">
            Para comenzar a usar el sistema, primero necesitas configurar las
            monedas, sociedades, tipos de ingreso/gasto y cajas.
          </p>
          <Link href="/dashboard/configuracion/inicio">
            <Button size="lg">🚀 Configurar Sistema</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 lg:p-6 space-y-5 md:space-y-6">
      {/* Acciones rápidas */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-[#203b46] mb-2 md:mb-3">
          ⚡ Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Link href="/dashboard/ingresos/nuevo">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2ba193] text-white font-medium text-sm hover:bg-[#238a7e] shadow-sm hover:shadow-md transition-all">
              <span className="text-lg">💵</span> Nuevo Ingreso
            </button>
          </Link>
          <Link href="/dashboard/egresos/nuevo">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#305969] font-medium text-sm border border-[#dceaef] hover:border-[#e0451f]/40 hover:bg-[#fcf8f7] shadow-sm hover:shadow-md transition-all">
              <span className="text-lg">💸</span> Nuevo Egreso
            </button>
          </Link>
          <Link href="/dashboard/ingresos/multiple">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#305969] font-medium text-sm border border-[#dceaef] hover:border-[#40768c]/40 hover:bg-[#f8fbfc] shadow-sm hover:shadow-md transition-all">
              <span className="text-lg">📋</span> Ingreso Múltiple
            </button>
          </Link>
          <Link href="/dashboard/reportes">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#305969] font-medium text-sm border border-[#dceaef] hover:border-[#40768c]/40 hover:bg-[#f8fbfc] shadow-sm hover:shadow-md transition-all">
              <span className="text-lg">📊</span> Ver Reportes
            </button>
          </Link>
        </div>
      </section>

      {/* Balance del mes por moneda */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-[#203b46] mb-2 md:mb-3">
          📊 Balance del Mes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {resumenPorMoneda.length > 0 ? (
            resumenPorMoneda.map(
              ({ moneda, ingresos, egresos, balance, ingresosAnt }) => {
                const cambioIngresos = calcularCambio(ingresos, ingresosAnt);
                return (
                  <Card
                    key={moneda.id}
                    className="bg-gradient-to-br from-[#203b46] to-[#305969] text-white"
                  >
                    <div className="text-sm opacity-75">
                      Balance del Mes ({moneda.codigo})
                    </div>
                    <div
                      className={`text-3xl font-bold my-2 ${
                        balance >= 0 ? "text-[#aeeae3]" : "text-[#f3b5a5]"
                      }`}
                    >
                      {formatMonto(balance, moneda.simbolo)}
                    </div>
                    <div className="flex justify-between text-xs opacity-75 mb-2">
                      <span>+ {formatMonto(ingresos, moneda.simbolo)}</span>
                      <span>- {formatMonto(egresos, moneda.simbolo)}</span>
                    </div>
                    {/* Comparativa */}
                    <div className="pt-2 border-t border-white/20 text-xs">
                      <div className="flex justify-between">
                        <span>vs mes anterior:</span>
                        <span
                          className={
                            cambioIngresos >= 0
                              ? "text-[#aeeae3]"
                              : "text-[#f3b5a5]"
                          }
                        >
                          {cambioIngresos >= 0 ? "↑" : "↓"}{" "}
                          {Math.abs(cambioIngresos).toFixed(0)}% ing.
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              }
            )
          ) : (
            <Card className="col-span-full bg-[#fcf6e9] border-[#f2dca6]">
              <p className="text-[#856514] text-center">
                📊 No hay movimientos este mes. ¡Registra tu primer ingreso!
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Estadísticas rápidas + Acumulado anual */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-[#ebfaf8] border-[#aeeae3]">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💵</div>
            <div>
              <div className="text-sm text-[#20796f]">Ingresos del Mes</div>
              <div className="text-2xl font-bold text-[#15514a]">
                {totalIngresos}
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-[#fcece9] border-[#f3b5a5]">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💸</div>
            <div>
              <div className="text-sm text-[#b43718]">Egresos del Mes</div>
              <div className="text-2xl font-bold text-[#e0451f]">
                {totalEgresos}
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-[#eef4f7] border-[#b9d4df]">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🗃️</div>
            <div>
              <div className="text-sm text-[#40768c]">Cajas Activas</div>
              <div className="text-2xl font-bold text-[#305969]">
                {totalCajas}
              </div>
            </div>
          </div>
        </Card>
        {/* Acumulado anual */}
        {monedaPrincipal && resumenPorMoneda.length > 0 && (
          <Card className="bg-gradient-to-br from-[#f8f4eb] to-white border-[#e6d9b8]">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📅</div>
              <div>
                <div className="text-sm text-[#856514]">
                  Balance Anual ({monedaPrincipal.codigo})
                </div>
                <div
                  className={`text-2xl font-bold ${
                    (resumenPorMoneda.find(
                      (r) => r.moneda.id === monedaPrincipal.id
                    )?.balanceAnual || 0) >= 0
                      ? "text-[#2ba193]"
                      : "text-[#e0451f]"
                  }`}
                >
                  {formatMonto(
                    resumenPorMoneda.find(
                      (r) => r.moneda.id === monedaPrincipal.id
                    )?.balanceAnual || 0,
                    monedaPrincipal.simbolo
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Cajas con mayor saldo */}
      {cajasConSaldos.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-[#203b46] mb-2 md:mb-3">
            🗃️ Saldos por Caja
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {cajasConSaldos.map((caja) => (
              <Link key={caja.id} href={`/dashboard/cajas/${caja.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#203b46]">
                      {caja.nombre}
                    </h4>
                    {caja.esGeneral && (
                      <Badge variant="info" size="sm">
                        General
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {caja.saldos.length > 0 ? (
                      caja.saldos.map((saldo) => {
                        const moneda = monedas.find(
                          (m) => m.id === saldo.monedaId
                        );
                        if (!moneda || saldo.saldo === 0) return null;
                        return (
                          <div
                            key={saldo.monedaId}
                            className="flex justify-between"
                          >
                            <span className="text-sm text-[#73a9bf]">
                              {moneda.codigo}:
                            </span>
                            <span
                              className={`font-semibold ${
                                saldo.saldo >= 0
                                  ? "text-[#2ba193]"
                                  : "text-[#e0451f]"
                              }`}
                            >
                              {formatMonto(saldo.saldo, moneda.simbolo)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-sm text-[#73a9bf]">
                        Sin movimientos
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CAJAS VIRTUALES POR TIPO DE INGRESO */}
      {cajasVirtuales.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-[#203b46] mb-2 md:mb-3">
            💰 Recaudación por Tipo de Ingreso (Mes)
          </h2>
          <p className="text-sm text-[#73a9bf] mb-3">
            Vista consolidada de ingresos agrupados por tipo, independiente de
            la caja física
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {cajasVirtuales.map((cajaVirtual) => (
              <Card
                key={cajaVirtual.id}
                className="bg-gradient-to-br from-[#f0f9f7] to-white border-[#aeeae3]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💵</span>
                  <h4 className="font-semibold text-[#203b46]">
                    {cajaVirtual.nombre}
                  </h4>
                </div>

                {/* Totales del tipo de ingreso */}
                <div className="mb-3 pb-3 border-b border-[#dceaef]">
                  <div className="text-xs text-[#73a9bf] mb-1">
                    Total recaudado:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cajaVirtual.totalPorMoneda.map((m) => (
                      <span
                        key={m.monedaId}
                        className="text-lg font-bold text-[#2ba193]"
                      >
                        {formatMonto(m.monto, m.simbolo)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Desglose por sociedad */}
                <div className="space-y-2">
                  <div className="text-xs text-[#73a9bf] font-medium">
                    Desglose por origen:
                  </div>
                  {cajaVirtual.porSociedad.map((soc) => (
                    <div
                      key={soc.id}
                      className="flex justify-between items-center py-1 px-2 bg-[#f8fbfc] rounded"
                    >
                      <span className="text-sm text-[#40768c]">
                        {soc.nombre}
                      </span>
                      <div className="flex gap-2">
                        {soc.montos.map((m) => (
                          <span
                            key={m.monedaId}
                            className="text-sm font-medium text-[#305969]"
                          >
                            {formatMonto(m.monto, m.simbolo)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Ingresos por Sociedad y Egresos por Tipo */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Ingresos por sociedad */}
        {ingresosPorSociedad.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[#203b46] mb-4">
              👥 Ingresos por Sociedad (Mes)
            </h3>
            <div className="space-y-3">
              {(() => {
                const sorted = [...ingresosPorSociedad].sort((a, b) => {
                  const totalA = a.montos.reduce((sum, m) => sum + m.total, 0);
                  const totalB = b.montos.reduce((sum, m) => sum + m.total, 0);
                  return totalB - totalA;
                });
                const maxTotal =
                  sorted.length > 0
                    ? sorted[0].montos.reduce((sum, m) => sum + m.total, 0)
                    : 0;

                return sorted.slice(0, 5).map((soc) => {
                  const socTotal = soc.montos.reduce(
                    (sum, m) => sum + m.total,
                    0
                  );
                  const porcentaje =
                    maxTotal > 0 ? (socTotal / maxTotal) * 100 : 0;

                  return (
                    <div key={soc.sociedadId}>
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="info">{soc.nombre}</Badge>
                        <div className="flex gap-2">
                          {soc.montos.map((m) => {
                            const moneda = monedas.find(
                              (mon) => mon.id === m.monedaId
                            );
                            if (!moneda) return null;
                            return (
                              <span
                                key={m.monedaId}
                                className="text-sm font-semibold text-[#2ba193]"
                              >
                                {formatMonto(m.total, moneda.simbolo)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="w-full bg-[#eef4f7] rounded-full h-2">
                        <div
                          className="bg-[#2ba193] h-2 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        )}

        {/* Egresos por tipo */}
        {egresosPorTipo.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[#203b46] mb-4">
              📋 Egresos por Tipo (Mes)
            </h3>
            <div className="space-y-3">
              {(() => {
                // Agrupar por tipo de gasto
                const agrupados: Record<
                  string,
                  { nombre: string; montos: Record<string, number> }
                > = {};
                egresosPorTipo.forEach((e) => {
                  const tipo = tiposGasto.find((t) => t.id === e.tipoGastoId);
                  if (!tipo) return;
                  if (!agrupados[e.tipoGastoId]) {
                    agrupados[e.tipoGastoId] = {
                      nombre: tipo.nombre,
                      montos: {},
                    };
                  }
                  agrupados[e.tipoGastoId].montos[e.monedaId] =
                    (agrupados[e.tipoGastoId].montos[e.monedaId] || 0) +
                    e.total;
                });

                const lista = Object.entries(agrupados)
                  .map(([id, data]) => ({
                    id,
                    nombre: data.nombre,
                    montos: Object.entries(data.montos).map(
                      ([monedaId, total]) => ({ monedaId, total })
                    ),
                    totalGeneral: Object.values(data.montos).reduce(
                      (a, b) => a + b,
                      0
                    ),
                  }))
                  .sort((a, b) => b.totalGeneral - a.totalGeneral)
                  .slice(0, 5);

                const maxTotal = lista.length > 0 ? lista[0].totalGeneral : 0;

                return lista.map((tipo) => (
                  <div key={tipo.id}>
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="warning">{tipo.nombre}</Badge>
                      <div className="flex gap-2">
                        {tipo.montos.map((m) => {
                          const moneda = monedas.find(
                            (mon) => mon.id === m.monedaId
                          );
                          if (!moneda) return null;
                          return (
                            <span
                              key={m.monedaId}
                              className="text-sm font-semibold text-[#e0451f]"
                            >
                              {formatMonto(m.total, moneda.simbolo)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="w-full bg-[#eef4f7] rounded-full h-2">
                      <div
                        className="bg-[#e0451f] h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            maxTotal > 0
                              ? (tipo.totalGeneral / maxTotal) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        )}
      </section>

      {/* Últimos movimientos */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Últimos ingresos */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#203b46]">
              📥 Últimos Ingresos
            </h3>
            <Link
              href="/dashboard/ingresos"
              className="text-sm text-[#2ba193] hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          {ultimosIngresos.length > 0 ? (
            <div className="space-y-3">
              {ultimosIngresos.map((ingreso) => (
                <div
                  key={ingreso.id}
                  className="flex items-center justify-between py-2 border-b border-[#eef4f7] last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{ingreso.sociedad.nombre}</Badge>
                      <span className="text-sm text-[#73a9bf]">
                        {ingreso.tipoIngreso.nombre}
                      </span>
                    </div>
                    <div className="text-xs text-[#73a9bf] mt-1">
                      {formatDate(ingreso.fechaRecaudacion)}
                    </div>
                  </div>
                  <div className="text-right">
                    {ingreso.montos.map((m, idx) => (
                      <div key={idx} className="font-semibold text-[#2ba193]">
                        {formatMonto(m.monto, m.moneda.simbolo)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#73a9bf] text-center py-4">
              No hay ingresos recientes
            </p>
          )}
        </Card>

        {/* Últimos egresos */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#203b46]">📤 Últimos Egresos</h3>
            <Link
              href="/dashboard/egresos"
              className="text-sm text-[#e0451f] hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          {ultimosEgresos.length > 0 ? (
            <div className="space-y-3">
              {ultimosEgresos.map((egreso) => (
                <div
                  key={egreso.id}
                  className="flex items-center justify-between py-2 border-b border-[#eef4f7] last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{egreso.tipoGasto.nombre}</Badge>
                      <span className="text-sm text-[#73a9bf]">
                        {egreso.solicitante}
                      </span>
                    </div>
                    <div className="text-xs text-[#73a9bf] mt-1">
                      {formatDate(egreso.fechaSalida)}
                    </div>
                  </div>
                  <div className="font-semibold text-[#e0451f]">
                    {formatMonto(egreso.monto, egreso.moneda.simbolo)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#73a9bf] text-center py-4">
              No hay egresos recientes
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
