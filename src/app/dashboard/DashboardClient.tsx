"use client";

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

interface DashboardClientProps {
  monedas: Moneda[];
  ingresosMes: MontoAgrupado[];
  egresosMes: MontoAgrupado[];
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
    return `${simbolo} ${monto.toFixed(2)}`;
  };

  // Calcular resúmenes por moneda
  const resumenPorMoneda = monedas
    .map((moneda) => {
      const ingresos =
        ingresosMes.find((i) => i.monedaId === moneda.id)?.total || 0;
      const egresos =
        egresosMes.find((e) => e.monedaId === moneda.id)?.total || 0;
      return {
        moneda,
        ingresos,
        egresos,
        balance: ingresos - egresos,
      };
    })
    .filter((r) => r.ingresos > 0 || r.egresos > 0);

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
    <div className="p-4 md:p-6">
      {/* Acciones rápidas */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#203b46] mb-3">
          ⚡ Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/ingresos/nuevo">
            <Button>💵 Nuevo Ingreso</Button>
          </Link>
          <Link href="/dashboard/egresos/nuevo">
            <Button variant="secondary">💸 Nuevo Egreso</Button>
          </Link>
          <Link href="/dashboard/ingresos/multiple">
            <Button variant="secondary">📋 Ingreso Múltiple</Button>
          </Link>
          <Link href="/dashboard/reportes">
            <Button variant="secondary">📊 Ver Reportes</Button>
          </Link>
        </div>
      </div>

      {/* Resumen del mes por moneda */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {resumenPorMoneda.length > 0 ? (
          resumenPorMoneda.map(({ moneda, ingresos, egresos, balance }) => (
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
              <div className="flex justify-between text-xs opacity-75">
                <span>+ {formatMonto(ingresos, moneda.simbolo)}</span>
                <span>- {formatMonto(egresos, moneda.simbolo)}</span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full bg-[#fcf6e9] border-[#f2dca6]">
            <p className="text-[#856514] text-center">
              📊 No hay movimientos este mes. ¡Registra tu primer ingreso!
            </p>
          </Card>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
      </div>

      {/* Últimos movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}
