"use server";

import { prisma } from "@/lib/prisma";

// Verificar si el sistema tiene configuración inicial
export async function verificarConfiguracionInicial() {
  const [monedas, sociedades, tiposServicio, tiposIngreso, tiposGasto, cajas] =
    await Promise.all([
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
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioAnio = new Date(hoy.getFullYear(), 0, 1);

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

  // Contadores
  const [totalIngresos, totalEgresos, totalCajas] = await Promise.all([
    prisma.ingreso.count({ where: { fechaRecaudacion: { gte: inicioMes } } }),
    prisma.egreso.count({ where: { fechaSalida: { gte: inicioMes } } }),
    prisma.caja.count({ where: { activa: true } }),
  ]);

  // Últimos movimientos
  const ultimosIngresos = await prisma.ingreso.findMany({
    take: 5,
    orderBy: { creadoEn: "desc" },
    include: {
      sociedad: true,
      tipoIngreso: true,
      caja: true,
      montos: { include: { moneda: true } },
    },
  });

  const ultimosEgresos = await prisma.egreso.findMany({
    take: 5,
    orderBy: { creadoEn: "desc" },
    include: {
      tipoGasto: true,
      caja: true,
      moneda: true,
    },
  });

  // Monedas para referencia
  const monedas = await prisma.moneda.findMany({ where: { activa: true } });

  return {
    monedaPrincipal,
    ingresosMes,
    egresosMes,
    totalIngresos,
    totalEgresos,
    totalCajas,
    ultimosIngresos,
    ultimosEgresos,
    monedas,
  };
}
