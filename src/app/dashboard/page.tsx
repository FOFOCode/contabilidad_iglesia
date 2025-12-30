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
        ingresosMesAnterior={[]}
        egresosMesAnterior={[]}
        ingresosAnio={[]}
        egresosAnio={[]}
        ingresosPorSociedad={[]}
        egresosPorTipo={[]}
        tiposGasto={[]}
        cajasConSaldos={[]}
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

  // Agrupar ingresos por sociedad
  const ingresosPorSociedadAgrupados: Record<
    string,
    { nombre: string; montos: Record<string, number> }
  > = {};
  resumen.ingresosPorSociedad.forEach((ing) => {
    const socId = ing.sociedad.id;
    if (!ingresosPorSociedadAgrupados[socId]) {
      ingresosPorSociedadAgrupados[socId] = {
        nombre: ing.sociedad.nombre,
        montos: {},
      };
    }
    ing.montos.forEach((m) => {
      const monedaId = m.moneda.id;
      if (!ingresosPorSociedadAgrupados[socId].montos[monedaId]) {
        ingresosPorSociedadAgrupados[socId].montos[monedaId] = 0;
      }
      ingresosPorSociedadAgrupados[socId].montos[monedaId] += Number(m.monto);
    });
  });

  const ingresosPorSociedad = Object.entries(ingresosPorSociedadAgrupados).map(
    ([id, data]) => ({
      sociedadId: id,
      nombre: data.nombre,
      montos: Object.entries(data.montos).map(([monedaId, total]) => ({
        monedaId,
        total,
      })),
    })
  );

  // Egresos por tipo
  const egresosPorTipo = resumen.egresosPorTipo.map((e) => ({
    tipoGastoId: e.tipoGastoId,
    monedaId: e.monedaId,
    total: Number(e._sum.monto) || 0,
  }));

  // Cajas con saldos
  const cajasConSaldos = resumen.cajasConSaldos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    esGeneral: c.esGeneral,
    saldos: c.saldos,
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

  // Tipos de gasto
  const tiposGasto = resumen.tiposGasto.map((t) => ({
    id: t.id,
    nombre: t.nombre,
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
      ingresosPorSociedad={ingresosPorSociedad}
      egresosPorTipo={egresosPorTipo}
      tiposGasto={tiposGasto}
      cajasConSaldos={cajasConSaldos}
      totalIngresos={resumen.totalIngresos}
      totalEgresos={resumen.totalEgresos}
      totalCajas={resumen.totalCajas}
      ultimosIngresos={ultimosIngresos}
      ultimosEgresos={ultimosEgresos}
      configurado={true}
    />
  );
}
