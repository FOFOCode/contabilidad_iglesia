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

  // Calcular resúmenes por moneda - memoizado con Maps para lookups O(1)
  const resumenPorMoneda = useMemo(() => {
    const mapIngresosMes = new Map(
      ingresosMes.map((i) => [i.monedaId, i.total]),
    );
    const mapEgresosMes = new Map(egresosMes.map((e) => [e.monedaId, e.total]));
    const mapIngresosAnt = new Map(
      ingresosMesAnterior.map((i) => [i.monedaId, i.total]),
    );
    const mapEgresosAnt = new Map(
      egresosMesAnterior.map((e) => [e.monedaId, e.total]),
    );
    const mapIngresosAnio = new Map(
      ingresosAnio.map((i) => [i.monedaId, i.total]),
    );
    const mapEgresosAnio = new Map(
      egresosAnio.map((e) => [e.monedaId, e.total]),
    );

    return monedas
      .map((moneda) => {
        const ingresos = mapIngresosMes.get(moneda.id) ?? 0;
        const egresos = mapEgresosMes.get(moneda.id) ?? 0;
        const ingresosAnt = mapIngresosAnt.get(moneda.id) ?? 0;
        const egresosAnt = mapEgresosAnt.get(moneda.id) ?? 0;
        const ingresosAnual = mapIngresosAnio.get(moneda.id) ?? 0;
        const egresosAnual = mapEgresosAnio.get(moneda.id) ?? 0;
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
          r.egresosAnual > 0,
      );
  }, [
    monedas,
    ingresosMes,
    egresosMes,
    ingresosMesAnterior,
    egresosMesAnterior,
    ingresosAnio,
    egresosAnio,
  ]);

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

      {/* Resumen del mes */}
      {resumenPorMoneda.length > 0 ? (
        resumenPorMoneda.map(
          ({
            moneda,
            ingresos,
            egresos,
            balance,
            ingresosAnt,
            egresosAnt,
            balanceAnt,
          }) => {
            const cambioBalance = calcularCambio(balance, balanceAnt);
            return (
              <section key={moneda.id}>
                <h2 className="text-base md:text-lg font-semibold text-[#203b46] mb-2 md:mb-3">
                  📅 Resumen del Mes
                  {monedas.length > 1 ? ` — ${moneda.codigo}` : ""}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <Card className="bg-[#ebfaf8] border-[#aeeae3]">
                    <div className="text-xs text-[#20796f] mb-1 font-medium">
                      Ingresos
                    </div>
                    <div className="text-2xl font-bold text-[#15514a]">
                      {formatMonto(ingresos, moneda.simbolo)}
                    </div>
                    {ingresosAnt > 0 && (
                      <div className="text-xs text-[#40768c] mt-2">
                        Mes anterior: {formatMonto(ingresosAnt, moneda.simbolo)}
                      </div>
                    )}
                  </Card>
                  <Card className="bg-[#fcece9] border-[#f3b5a5]">
                    <div className="text-xs text-[#b43718] mb-1 font-medium">
                      Egresos
                    </div>
                    <div className="text-2xl font-bold text-[#e0451f]">
                      {formatMonto(egresos, moneda.simbolo)}
                    </div>
                    {egresosAnt > 0 && (
                      <div className="text-xs text-[#b43718]/70 mt-2">
                        Mes anterior: {formatMonto(egresosAnt, moneda.simbolo)}
                      </div>
                    )}
                  </Card>
                  <Card
                    className={`border-2 ${
                      balance >= 0
                        ? "bg-gradient-to-br from-[#203b46] to-[#305969] border-[#2ba193]/30"
                        : "bg-gradient-to-br from-[#4a1a10] to-[#7a2f1f] border-[#e0451f]/30"
                    }`}
                  >
                    <div className="text-xs text-white/70 mb-1 font-medium">
                      Balance Neto
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        balance >= 0 ? "text-[#aeeae3]" : "text-[#f3b5a5]"
                      }`}
                    >
                      {formatMonto(balance, moneda.simbolo)}
                    </div>
                    {balanceAnt !== 0 && (
                      <div className="text-xs text-white/60 mt-2">
                        {cambioBalance >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(cambioBalance).toFixed(0)}% vs mes anterior
                      </div>
                    )}
                  </Card>
                </div>
              </section>
            );
          },
        )
      ) : (
        <Card className="bg-[#fcf6e9] border-[#f2dca6]">
          <p className="text-[#856514] text-center py-2">
            📊 No hay movimientos este mes. ¡Registra tu primer ingreso!
          </p>
        </Card>
      )}

      {/* Estado de Cajas */}
      {cajasConSaldos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h2 className="text-base md:text-lg font-semibold text-[#203b46]">
              🏦 Estado de Cajas
            </h2>
            <Link
              href="/dashboard/cajas"
              className="text-sm text-[#2ba193] hover:underline font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {cajasConSaldos.map((caja) => (
              <Link key={caja.id} href={`/dashboard/cajas/${caja.id}`}>
                <Card
                  className={`hover:shadow-md transition-all cursor-pointer h-full ${
                    caja.esGeneral
                      ? "border-2 border-[#2ba193]/40 bg-gradient-to-br from-[#f0f9f7] to-white"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">
                      {caja.esGeneral ? "🏦" : "📦"}
                    </span>
                    <div>
                      <div className="font-semibold text-[#203b46] text-sm">
                        {caja.nombre}
                      </div>
                      {caja.esGeneral && (
                        <div className="text-xs text-[#2ba193]">Principal</div>
                      )}
                    </div>
                  </div>
                  {caja.saldos.filter((s) => s.saldo !== 0).length > 0 ? (
                    caja.saldos
                      .filter((s) => s.saldo !== 0)
                      .map((saldo) => {
                        const moneda = monedas.find(
                          (m) => m.id === saldo.monedaId,
                        );
                        if (!moneda) return null;
                        return (
                          <div
                            key={saldo.monedaId}
                            className={`text-xl font-bold ${
                              saldo.saldo >= 0
                                ? "text-[#2ba193]"
                                : "text-[#e0451f]"
                            }`}
                          >
                            {formatMonto(saldo.saldo, moneda.simbolo)}
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-sm text-[#b9d4df]">
                      Sin movimientos
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

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
