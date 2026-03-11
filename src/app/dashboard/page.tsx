import { Suspense } from "react";
import {
  verificarConfiguracionInicial,
  obtenerResumenDashboard,
} from "@/app/actions/sistema";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

// ─── Skeleton inline para la sección de datos financieros ───────────────────
function DashboardDataSkeleton() {
  return (
    <div className="p-4 md:p-5 lg:p-6 space-y-5 animate-pulse">
      {/* Resumen del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 border border-gray-100 h-24"
          />
        ))}
      </div>
      {/* Cajas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-gray-100 h-20"
          />
        ))}
      </div>
      {/* Tablas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100">
            <div className="p-4 border-b border-gray-50 h-12" />
            {[...Array(5)].map((_, j) => (
              <div
                key={j}
                className="flex gap-4 px-4 py-3 border-b border-gray-50"
              >
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 flex-1 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente async que carga los datos pesados (se streamea) ──────────────
async function DashboardContent() {
  const resumen = await obtenerResumenDashboard().catch(() => null);

  if (!resumen) {
    return (
      <DashboardClient
        monedas={[]}
        ingresosMes={[]}
        egresosMes={[]}
        ingresosMesAnterior={[]}
        egresosMesAnterior={[]}
        ingresosAnio={[]}
        egresosAnio={[]}
        ingresosPorSociedad={[]}
        egresosPorTipo={[]}
        tiposGasto={[]}
        cajasConSaldos={[]}
        cajasVirtuales={[]}
        totalIngresos={0}
        totalEgresos={0}
        totalCajas={0}
        ultimosIngresos={[]}
        ultimosEgresos={[]}
        configurado={false}
      />
    );
  }

  // Transformar datos para el cliente (convertir Decimal a number)
  const ingresosMes = resumen.ingresosMes.map((i) => ({
    monedaId: i.monedaId,
    total: Number(i._sum.monto) || 0,
  }));

  const egresosMes = resumen.egresosMes.map((e) => ({
    monedaId: e.monedaId,
    total: Number(e._sum.monto) || 0,
  }));

  const ingresosMesAnterior = resumen.ingresosMesAnterior.map((i) => ({
    monedaId: i.monedaId,
    total: Number(i._sum.monto) || 0,
  }));

  const egresosMesAnterior = resumen.egresosMesAnterior.map((e) => ({
    monedaId: e.monedaId,
    total: Number(e._sum.monto) || 0,
  }));

  const ingresosAnio = resumen.ingresosAnio.map((i) => ({
    monedaId: i.monedaId,
    total: Number(i._sum.monto) || 0,
  }));

  const egresosAnio = resumen.egresosAnio.map((e) => ({
    monedaId: e.monedaId,
    total: Number(e._sum.monto) || 0,
  }));

  const cajasConSaldos = resumen.cajasConSaldos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    esGeneral: c.esGeneral,
    saldos: c.saldos,
  }));

  const ultimosIngresos = resumen.ultimosIngresos.map((ingreso) => ({
    id: ingreso.id,
    fechaRecaudacion: ingreso.fechaRecaudacion,
    sociedad: { nombre: ingreso.sociedad.nombre },
    tipoIngreso: { nombre: ingreso.tipoIngreso.nombre },
    caja: { nombre: ingreso.caja.nombre },
    montos: ingreso.montos.map((m) => ({
      monto: Number(m.monto),
      moneda: { simbolo: m.moneda.simbolo, codigo: m.moneda.codigo },
    })),
  }));

  const ultimosEgresos = resumen.ultimosEgresos.map((egreso) => ({
    id: egreso.id,
    fechaSalida: egreso.fechaSalida,
    solicitante: egreso.solicitante,
    monto: Number(egreso.monto),
    tipoGasto: { nombre: egreso.tipoGasto.nombre },
    caja: { nombre: egreso.caja.nombre },
    moneda: { simbolo: egreso.moneda.simbolo, codigo: egreso.moneda.codigo },
  }));

  const monedas = resumen.monedas.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    simbolo: m.simbolo,
    esPrincipal: m.esPrincipal,
  }));

  return (
    <DashboardClient
      monedas={monedas}
      ingresosMes={ingresosMes}
      egresosMes={egresosMes}
      ingresosMesAnterior={ingresosMesAnterior}
      egresosMesAnterior={egresosMesAnterior}
      ingresosAnio={ingresosAnio}
      egresosAnio={egresosAnio}
      ingresosPorSociedad={[]}
      egresosPorTipo={[]}
      tiposGasto={[]}
      cajasConSaldos={cajasConSaldos}
      cajasVirtuales={[]}
      totalIngresos={resumen.totalIngresos}
      totalEgresos={resumen.totalEgresos}
      totalCajas={resumen.totalCajas}
      ultimosIngresos={ultimosIngresos}
      ultimosEgresos={ultimosEgresos}
      configurado={true}
    />
  );
}

// ─── Página principal del dashboard ─────────────────────────────────────────
export default async function DashboardPage() {
  // Verificación de configuración: query ligera (~10ms).
  // Resuelve antes que obtenerResumenDashboard() → permite iniciar streaming.
  const config = await verificarConfiguracionInicial();

  if (!config.configurado) {
    return (
      <DashboardClient
        monedas={[]}
        ingresosMes={[]}
        egresosMes={[]}
        ingresosMesAnterior={[]}
        egresosMesAnterior={[]}
        ingresosAnio={[]}
        egresosAnio={[]}
        ingresosPorSociedad={[]}
        egresosPorTipo={[]}
        tiposGasto={[]}
        cajasConSaldos={[]}
        cajasVirtuales={[]}
        totalIngresos={0}
        totalEgresos={0}
        totalCajas={0}
        ultimosIngresos={[]}
        ultimosEgresos={[]}
        configurado={false}
      />
    );
  }

  // Streaming: DashboardContent se streamea al cliente mientras sus datos cargan.
  // El servidor envía el HTML del shell (layout + acciones rápidas) de inmediato,
  // y rellena el contenido financiero cuando obtenerResumenDashboard() resuelve.
  return (
    <Suspense fallback={<DashboardDataSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
