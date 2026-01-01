"use server";

import { prisma, withRetry } from "@/lib/prisma";

// Verificar si el sistema tiene configuración inicial
export async function verificarConfiguracionInicial() {
  return withRetry(async () => {
    const [
      monedas,
      sociedades,
      tiposServicio,
      tiposIngreso,
      tiposGasto,
      cajas,
    ] = await Promise.all([
      prisma.moneda.count(),
      prisma.sociedad.count(),
      prisma.tipoServicio.count(),
      prisma.tipoIngreso.count(),
      prisma.tipoGasto.count(),
      prisma.caja.count(),
    ]);

    return {
      monedas,
      sociedades,
      tiposServicio,
      tiposIngreso,
      tiposGasto,
      cajas,
      configurado:
        monedas > 0 &&
        sociedades > 0 &&
        tiposServicio > 0 &&
        tiposIngreso > 0 &&
        tiposGasto > 0 &&
        cajas > 0,
    };
  });
}

// Sembrar datos iniciales por defecto
export async function sembrarDatosIniciales() {
  // 1. Monedas
  const monedasExistentes = await prisma.moneda.count();
  if (monedasExistentes === 0) {
    await prisma.moneda.createMany({
      data: [
        {
          codigo: "USD",
          nombre: "Dólar estadounidense",
          simbolo: "$",
          esPrincipal: true,
          tasaCambio: 1,
          orden: 0,
        },
        {
          codigo: "GTQ",
          nombre: "Quetzal guatemalteco",
          simbolo: "Q",
          esPrincipal: false,
          tasaCambio: 7.75,
          orden: 1,
        },
      ],
    });
  }

  // 2. Sociedades
  const sociedadesExistentes = await prisma.sociedad.count();
  if (sociedadesExistentes === 0) {
    await prisma.sociedad.createMany({
      data: [
        { nombre: "Hombres", descripcion: "Sociedad de varones", orden: 0 },
        { nombre: "Mujeres", descripcion: "Sociedad de damas", orden: 1 },
        {
          nombre: "Culto General",
          descripcion: "Congregación general",
          orden: 2,
        },
      ],
    });
  }

  // 3. Tipos de Servicio
  const tiposServicioExistentes = await prisma.tipoServicio.count();
  if (tiposServicioExistentes === 0) {
    await prisma.tipoServicio.createMany({
      data: [
        {
          nombre: "Culto",
          descripcion: "Servicio dominical regular",
          orden: 0,
        },
        { nombre: "Oración", descripcion: "Servicio de oración", orden: 1 },
        {
          nombre: "Vigilia",
          descripcion: "Servicio nocturno de vigilia",
          orden: 2,
        },
        { nombre: "Matutino", descripcion: "Servicio de la mañana", orden: 3 },
        {
          nombre: "Enseñanza",
          descripcion: "Estudio bíblico y enseñanza",
          orden: 4,
        },
      ],
    });
  }

  // 4. Tipos de Ingreso
  const tiposIngresoExistentes = await prisma.tipoIngreso.count();
  if (tiposIngresoExistentes === 0) {
    await prisma.tipoIngreso.createMany({
      data: [
        {
          nombre: "Ofrenda",
          descripcion: "Ofrendas generales del culto",
          orden: 0,
        },
        {
          nombre: "Talentos",
          descripcion: "Recaudación de talentos por sociedad",
          orden: 1,
        },
        {
          nombre: "Promesas",
          descripcion: "Promesas (solo mujeres)",
          orden: 2,
        },
        { nombre: "Diezmo", descripcion: "Diezmos de los miembros", orden: 3 },
        { nombre: "Donación", descripcion: "Donaciones especiales", orden: 4 },
        {
          nombre: "Hermano en Ayuda",
          descripcion: "Fondos para ayuda fraternal",
          orden: 5,
        },
      ],
    });
  }

  // 5. Tipos de Gasto
  const tiposGastoExistentes = await prisma.tipoGasto.count();
  if (tiposGastoExistentes === 0) {
    await prisma.tipoGasto.createMany({
      data: [
        {
          nombre: "Combustible",
          descripcion: "Gastos de combustible",
          orden: 0,
        },
        { nombre: "Agua / Pipa", descripcion: "Servicio de agua", orden: 1 },
        { nombre: "Funeraria", descripcion: "Gastos funerarios", orden: 2 },
        {
          nombre: "Luz Eléctrica",
          descripcion: "Servicio de electricidad",
          orden: 3,
        },
        { nombre: "Otros", descripcion: "Otros gastos varios", orden: 4 },
      ],
    });
  }

  // 6. Cajas (requiere IDs de sociedades y tipos de ingreso)
  const cajasExistentes = await prisma.caja.count();
  if (cajasExistentes === 0) {
    const sociedades = await prisma.sociedad.findMany();
    const tiposIngreso = await prisma.tipoIngreso.findMany();

    const hombres = sociedades.find((s) => s.nombre === "Hombres");
    const mujeres = sociedades.find((s) => s.nombre === "Mujeres");
    const cultoGeneral = sociedades.find((s) => s.nombre === "Culto General");

    const ofrenda = tiposIngreso.find((t) => t.nombre === "Ofrenda");
    const talentos = tiposIngreso.find((t) => t.nombre === "Talentos");
    const promesas = tiposIngreso.find((t) => t.nombre === "Promesas");
    const diezmo = tiposIngreso.find((t) => t.nombre === "Diezmo");
    const donacion = tiposIngreso.find((t) => t.nombre === "Donación");
    const hnoAyuda = tiposIngreso.find((t) => t.nombre === "Hermano en Ayuda");

    await prisma.caja.createMany({
      data: [
        {
          nombre: "Caja General",
          descripcion: "Ofrendas del culto general",
          sociedadId: cultoGeneral?.id,
          tipoIngresoId: ofrenda?.id,
          orden: 0,
        },
        {
          nombre: "Caja Talentos - Hombres",
          descripcion: "Talentos de la sociedad de hombres",
          sociedadId: hombres?.id,
          tipoIngresoId: talentos?.id,
          orden: 1,
        },
        {
          nombre: "Caja Talentos - Mujeres",
          descripcion: "Talentos de la sociedad de mujeres",
          sociedadId: mujeres?.id,
          tipoIngresoId: talentos?.id,
          orden: 2,
        },
        {
          nombre: "Caja de Promesas",
          descripcion: "Promesas de la sociedad de mujeres",
          sociedadId: mujeres?.id,
          tipoIngresoId: promesas?.id,
          orden: 3,
        },
        {
          nombre: "Caja de Diezmos",
          descripcion: "Diezmos de todos los miembros",
          sociedadId: null,
          tipoIngresoId: diezmo?.id,
          orden: 4,
        },
        {
          nombre: "Caja de Donaciones",
          descripcion: "Donaciones especiales",
          sociedadId: null,
          tipoIngresoId: donacion?.id,
          orden: 5,
        },
        {
          nombre: "Caja Hermano en Ayuda",
          descripcion: "Fondos para ayuda a hermanos",
          sociedadId: null,
          tipoIngresoId: hnoAyuda?.id,
          orden: 6,
        },
      ],
    });
  }

  // 7. Usuario administrador por defecto
  const usuariosExistentes = await prisma.usuario.count();
  if (usuariosExistentes === 0) {
    // Contraseña: admin123 (en base64 para simplificar)
    const contrasenaHash = Buffer.from("admin123").toString("base64");
    await prisma.usuario.create({
      data: {
        nombre: "Administrador",
        apellido: "Sistema",
        correo: "admin@iglesia.com",
        contrasena: contrasenaHash,
        activo: true,
      },
    });
  }

  return { success: true };
}

// Obtener resumen del dashboard
export async function obtenerResumenDashboard() {
  return withRetry(async () => {
    // Calcular fechas en zona horaria de El Salvador (UTC-6)
    // Obtenemos la hora actual en UTC y le restamos 6 horas para obtener la hora de El Salvador
    const ahoraUTC = new Date();
    const horaElSalvador = new Date(ahoraUTC.getTime() - 6 * 60 * 60 * 1000);

    // Extraer año y mes según la hora de El Salvador
    const anio = horaElSalvador.getUTCFullYear();
    const mes = horaElSalvador.getUTCMonth(); // 0-11

    // Inicio del mes actual: día 1 a las 00:00:00 de El Salvador = 06:00:00 UTC
    const inicioMes = new Date(Date.UTC(anio, mes, 1, 6, 0, 0, 0));

    // Calcular mes y año anterior de forma explícita para mayor claridad
    // (JavaScript maneja mes=-1 automáticamente, pero esto es más legible)
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const anioMesAnterior = mes === 0 ? anio - 1 : anio;

    // Inicio del mes anterior
    const inicioMesAnterior = new Date(
      Date.UTC(anioMesAnterior, mesAnterior, 1, 6, 0, 0, 0)
    );

    // Fin del mes anterior: día 1 del mes actual a las 05:59:59 UTC (23:59:59 El Salvador del día anterior)
    const finMesAnterior = new Date(Date.UTC(anio, mes, 1, 5, 59, 59, 999));

    // Inicio del año actual (siempre 1 de enero del año actual según El Salvador)
    const inicioAnio = new Date(Date.UTC(anio, 0, 1, 6, 0, 0, 0));

    // Obtener moneda principal
    const monedaPrincipal = await prisma.moneda.findFirst({
      where: { esPrincipal: true },
    });

    // Ingresos del mes (agrupados por moneda)
    const ingresosMes = await prisma.ingresoMonto.groupBy({
      by: ["monedaId"],
      where: {
        ingreso: {
          fechaRecaudacion: { gte: inicioMes },
        },
      },
      _sum: { monto: true },
    });

    // Egresos del mes
    const egresosMes = await prisma.egreso.groupBy({
      by: ["monedaId"],
      where: {
        fechaSalida: { gte: inicioMes },
      },
      _sum: { monto: true },
    });

    // Ingresos mes anterior (para comparativa)
    const ingresosMesAnterior = await prisma.ingresoMonto.groupBy({
      by: ["monedaId"],
      where: {
        ingreso: {
          fechaRecaudacion: { gte: inicioMesAnterior, lte: finMesAnterior },
        },
      },
      _sum: { monto: true },
    });

    // Egresos mes anterior
    const egresosMesAnterior = await prisma.egreso.groupBy({
      by: ["monedaId"],
      where: {
        fechaSalida: { gte: inicioMesAnterior, lte: finMesAnterior },
      },
      _sum: { monto: true },
    });

    // Ingresos del año (acumulado)
    const ingresosAnio = await prisma.ingresoMonto.groupBy({
      by: ["monedaId"],
      where: {
        ingreso: {
          fechaRecaudacion: { gte: inicioAnio },
        },
      },
      _sum: { monto: true },
    });

    // Egresos del año
    const egresosAnio = await prisma.egreso.groupBy({
      by: ["monedaId"],
      where: {
        fechaSalida: { gte: inicioAnio },
      },
      _sum: { monto: true },
    });

    // Ingresos por sociedad del mes
    const ingresosPorSociedad = await prisma.ingreso.findMany({
      where: { fechaRecaudacion: { gte: inicioMes } },
      select: {
        sociedad: { select: { id: true, nombre: true } },
        montos: {
          select: {
            monto: true,
            moneda: { select: { id: true, simbolo: true, codigo: true } },
          },
        },
      },
    });

    // Egresos por tipo de gasto del mes
    const egresosPorTipo = await prisma.egreso.groupBy({
      by: ["tipoGastoId", "monedaId"],
      where: { fechaSalida: { gte: inicioMes } },
      _sum: { monto: true },
    });

    // Obtener nombres de tipos de gasto
    const tiposGasto = await prisma.tipoGasto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
    });

    // Top 5 cajas por movimiento (con saldos calculados)
    const cajasActivas = await prisma.caja.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, esGeneral: true },
      orderBy: { orden: "asc" },
      take: 6,
    });

    // Obtener IDs de cajas para filtrar
    const cajaIds = cajasActivas.map((c) => c.id);

    // Consultas optimizadas: una sola consulta para todos los ingresos y egresos
    const [ingresosAgrupados, egresosAgrupados] = await Promise.all([
      prisma.$queryRaw<{ cajaId: string; monedaId: string; total: number }[]>`
        SELECT i."cajaId", im."monedaId", SUM(im.monto)::float as total
        FROM ingreso_montos im
        INNER JOIN ingresos i ON im."ingresoId" = i.id
        WHERE i."cajaId" = ANY(${cajaIds}::text[])
        GROUP BY i."cajaId", im."monedaId"
      `,
      prisma.egreso.groupBy({
        by: ["cajaId", "monedaId"],
        where: { cajaId: { in: cajaIds } },
        _sum: { monto: true },
      }),
    ]);

    // Mapas para acceso rápido
    const ingresosMap = new Map<string, number>();
    ingresosAgrupados.forEach((ing) => {
      ingresosMap.set(`${ing.cajaId}-${ing.monedaId}`, ing.total);
    });

    const egresosMap = new Map<string, number>();
    egresosAgrupados.forEach((egr) => {
      egresosMap.set(
        `${egr.cajaId}-${egr.monedaId}`,
        Number(egr._sum.monto || 0)
      );
    });

    // Monedas para referencia (necesitamos esto antes de construir cajasConSaldos)
    const monedas = await prisma.moneda.findMany({ where: { activa: true } });

    // Construir cajas con saldos
    const cajasConSaldos = cajasActivas.map((caja) => ({
      ...caja,
      saldos: monedas.map((moneda) => {
        const key = `${caja.id}-${moneda.id}`;
        const ingresos = ingresosMap.get(key) || 0;
        const egresos = egresosMap.get(key) || 0;
        return {
          monedaId: moneda.id,
          saldo: ingresos - egresos,
        };
      }),
    }));

    // Contadores y últimos movimientos en paralelo
    const [
      totalIngresos,
      totalEgresos,
      totalCajas,
      ultimosIngresos,
      ultimosEgresos,
      sociedades,
    ] = await Promise.all([
      prisma.ingreso.count({ where: { fechaRecaudacion: { gte: inicioMes } } }),
      prisma.egreso.count({ where: { fechaSalida: { gte: inicioMes } } }),
      prisma.caja.count({ where: { activa: true } }),
      prisma.ingreso.findMany({
        take: 5,
        orderBy: { creadoEn: "desc" },
        include: {
          sociedad: true,
          tipoIngreso: true,
          caja: true,
          montos: { include: { moneda: true } },
        },
      }),
      prisma.egreso.findMany({
        take: 5,
        orderBy: { creadoEn: "desc" },
        include: {
          tipoGasto: true,
          caja: true,
          moneda: true,
        },
      }),
      prisma.sociedad.findMany({ where: { activa: true } }),
    ]);

    return {
      monedaPrincipal,
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
      totalIngresos,
      totalEgresos,
      totalCajas,
      ultimosIngresos,
      ultimosEgresos,
      monedas,
      sociedades,
    };
  });
}
