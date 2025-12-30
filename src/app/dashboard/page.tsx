import {
  verificarConfiguracionInicial,
  obtenerResumenDashboard,
} from "@/app/actions/sistema";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Verificar si el sistema está configurado
  const config = await verificarConfiguracionInicial();

  // Si no está configurado, mostrar mensaje de bienvenida
  if (!config.configurado) {
    return (
      <DashboardClient
        monedas={[]}
        ingresosMes={[]}
        egresosMes={[]}
        totalIngresos={0}
        totalEgresos={0}
        totalCajas={0}
        ultimosIngresos={[]}
        ultimosEgresos={[]}
        configurado={false}
      />
    );
  }

  // Obtener datos del dashboard
  const resumen = await obtenerResumenDashboard();

  // Transformar datos para el cliente (convertir Decimal a number)
  const ingresosMes = resumen.ingresosMes.map((i) => ({
    monedaId: i.monedaId,
    total: Number(i._sum.monto) || 0,
  }));

  const egresosMes = resumen.egresosMes.map((e) => ({
    monedaId: e.monedaId,
    total: Number(e._sum.monto) || 0,
  }));

  // Transformar últimos ingresos
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

  // Transformar últimos egresos
  const ultimosEgresos = resumen.ultimosEgresos.map((egreso) => ({
    id: egreso.id,
    fechaSalida: egreso.fechaSalida,
    solicitante: egreso.solicitante,
    monto: Number(egreso.monto),
    tipoGasto: { nombre: egreso.tipoGasto.nombre },
    caja: { nombre: egreso.caja.nombre },
    moneda: { simbolo: egreso.moneda.simbolo, codigo: egreso.moneda.codigo },
  }));

  // Transformar monedas (convertir Decimal a number)
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
      totalIngresos={resumen.totalIngresos}
      totalEgresos={resumen.totalEgresos}
      totalCajas={resumen.totalCajas}
      ultimosIngresos={ultimosIngresos}
      ultimosEgresos={ultimosEgresos}
      configurado={true}
    />
  );
}
