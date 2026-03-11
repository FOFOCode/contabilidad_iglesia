/**
 * db-functions.ts
 *
 * Adaptadores TypeScript para las funciones PL/pgSQL definidas en
 * prisma/functions.sql.  Cada wrapper llama a la función de base de
 * datos y devuelve datos ya tipados, eliminando la necesidad de hacer
 * múltiples round-trips desde Node.js.
 *
 * Antes de usar, asegúrate de haber aplicado las funciones:
 *   node scripts/apply-db-functions.mjs
 */

import { prisma } from "./prisma";

// ─── Tipos compartidos ────────────────────────────────────────────────────────

export interface SaldoMoneda {
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

// ─── 1. fn_saldo_caja ─────────────────────────────────────────────────────────
/**
 * Devuelve el saldo de una caja desglosado por moneda.
 * Reemplaza obtenerSaldoCaja() — de 4 queries a 1.
 */
export async function dbSaldoCaja(
  cajaId: string,
  monedaId?: string,
): Promise<SaldoMoneda[]> {
  if (monedaId) {
    return prisma.$queryRaw<SaldoMoneda[]>`
      SELECT * FROM fn_saldo_caja(${cajaId}::text, ${monedaId}::text)
    `;
  }
  return prisma.$queryRaw<SaldoMoneda[]>`
    SELECT * FROM fn_saldo_caja(${cajaId}::text)
  `;
}

// ─── 2. fn_saldo_filiales ─────────────────────────────────────────────────────
/**
 * Devuelve el saldo de la caja de filiales desglosado por moneda.
 * Reemplaza obtenerSaldoFiliales() — de 3 queries a 1.
 */
export async function dbSaldoFiliales(): Promise<SaldoMoneda[]> {
  return prisma.$queryRaw<SaldoMoneda[]>`
    SELECT * FROM fn_saldo_filiales()
  `;
}

// ─── 3. fn_resumen_dashboard ──────────────────────────────────────────────────

interface MonedaBasica {
  id: string;
  codigo: string;
  simbolo: string;
  esPrincipal: boolean;
  activa: boolean;
  orden: number;
}

interface TotalPorMoneda {
  monedaId: string;
  total: number;
}

interface SaldoCajaSimple {
  monedaId: string;
  saldo: number;
}

interface CajaDashboard {
  id: string;
  nombre: string;
  esGeneral: boolean;
  saldos: SaldoCajaSimple[];
}

interface UltimoIngresoDash {
  id: string;
  fechaRecaudacion: string;
  sociedad: { nombre: string };
  tipoIngreso: { nombre: string };
  caja: { nombre: string };
  montos: { monto: number; moneda: { simbolo: string; codigo: string } }[];
}

interface UltimoEgresoDash {
  id: string;
  fechaSalida: string;
  solicitante: string;
  monto: number;
  tipoGasto: { nombre: string };
  caja: { nombre: string };
  moneda: { simbolo: string; codigo: string };
}

export interface ResumenDashboardDB {
  monedas: MonedaBasica[];
  ingresosMes: TotalPorMoneda[];
  egresosMes: TotalPorMoneda[];
  ingresosMesAnterior: TotalPorMoneda[];
  egresosMesAnterior: TotalPorMoneda[];
  ingresosAnio: TotalPorMoneda[];
  egresosAnio: TotalPorMoneda[];
  cajasConSaldos: CajaDashboard[];
  ultimosIngresos: UltimoIngresoDash[];
  ultimosEgresos: UltimoEgresoDash[];
  contadores: {
    totalIngresos: number;
    totalEgresos: number;
    totalCajas: number;
  };
}

/**
 * Obtiene todos los datos del dashboard en una sola llamada a la DB.
 * Reemplaza obtenerResumenDashboard() — de ~20 queries a 1.
 */
export async function dbResumenDashboard(): Promise<ResumenDashboardDB> {
  const rows = await prisma.$queryRaw<[{ data: ResumenDashboardDB }]>`
    SELECT fn_resumen_dashboard() AS data
  `;
  return rows[0].data;
}

// ─── 4. fn_cajas_con_saldos ───────────────────────────────────────────────────

interface SaldoCajaCompleto {
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

interface CajaConSaldoCompleto {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  esGeneral: boolean;
  sociedadId: string | null;
  tipoIngresoId: string | null;
  orden: number;
  esVirtual: boolean;
  sociedad: { nombre: string } | null;
  tipoIngreso: { nombre: string } | null;
  saldos: SaldoCajaCompleto[];
}

interface MonedaSerializada {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activa: boolean;
  esPrincipal: boolean;
  tasaCambio: number;
  orden: number;
}

export interface CajasConSaldosDB {
  cajas: CajaConSaldoCompleto[];
  monedas: MonedaSerializada[];
}

/**
 * Devuelve todas las cajas activas con sus saldos calculados,
 * incluyendo cajas virtuales (Donaciones, Filiales).
 * Reemplaza obtenerCajasConSaldos() — de 8+ queries a 1.
 */
export async function dbCajasConSaldos(): Promise<CajasConSaldosDB> {
  const rows = await prisma.$queryRaw<[{ data: CajasConSaldosDB }]>`
    SELECT fn_cajas_con_saldos() AS data
  `;
  return rows[0].data;
}

// ─── 5. fn_resumen_filiales ───────────────────────────────────────────────────

interface FilialConSaldos {
  id: string;
  nombre: string;
  pastor: string;
  activa: boolean;
  orden: number;
  pais: { id: string; nombre: string };
  saldos: {
    monedaId: string;
    monedaCodigo: string;
    monedaSimbolo: string;
    total: number;
  }[];
}

interface TotalFilialMoneda {
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  totalIngresos: number;
  totalEgresos: number;
  saldo: number;
}

export interface ResumenFilialesDB {
  filiales: FilialConSaldos[];
  totalesGenerales: TotalFilialMoneda[];
  monedas: MonedaSerializada[];
  tiposGasto: { id: string; nombre: string }[];
}

/**
 * Devuelve el resumen completo del módulo de filiales.
 * Reemplaza obtenerResumenFiliales() — de 4 queries + JS aggregation a 1.
 */
export async function dbResumenFiliales(): Promise<ResumenFilialesDB> {
  const rows = await prisma.$queryRaw<[{ data: ResumenFilialesDB }]>`
    SELECT fn_resumen_filiales() AS data
  `;
  return rows[0].data;
}
