import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    // Configuración optimizada para Vercel Serverless + Supabase Pooler
    max: 1, // CRÍTICO: Una conexión por instancia serverless
    min: 0, // Sin conexiones mínimas (serverless debe ser stateless)
    idleTimeoutMillis: 10000, // Cerrar conexiones inactivas rápido (10s)
    connectionTimeoutMillis: 5000, // Timeout más agresivo (5s)
    allowExitOnIdle: true, // Permitir que el proceso termine si está idle

    // Configuración adicional para resiliencia en móviles
    statement_timeout: 20000, // 20s timeout para queries largas
    query_timeout: 20000, // 20s timeout general

    // Habilitar keep-alive para conexiones más estables
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? createPool();
  globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// =====================
// UTILIDAD DE REINTENTOS
// =====================

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 500, // 500ms
  maxDelay: 5000, // 5s máximo
  backoffMultiplier: 2,
};

// Errores que se consideran transitorios y se pueden reintentar
const RETRYABLE_ERRORS = [
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ENOTFOUND",
  "ENETUNREACH",
  "EAI_AGAIN",
  "ConnectionError",
  "connection",
  "timeout",
  "Too many connections",
  "Connection terminated",
  "Client has encountered a connection error",
  "prepared statement",
  "FATAL",
];

function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorString = String(error);
  const errorMessage = error instanceof Error ? error.message : errorString;
  const errorCode = (error as { code?: string })?.code;

  return RETRYABLE_ERRORS.some(
    (retryable) =>
      errorMessage.toLowerCase().includes(retryable.toLowerCase()) ||
      errorCode === retryable
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta una operación de base de datos con reintentos automáticos
 * para manejar errores transitorios de conexión (común en Supabase/serverless)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Si no es un error reintentable o es el último intento, lanzar
      if (!isRetryableError(error) || attempt > opts.maxRetries) {
        throw error;
      }

      console.warn(
        `[Prisma Retry] Intento ${attempt}/${opts.maxRetries + 1} falló. ` +
          `Reintentando en ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Wrapper para transacciones con reintentos
 */
export async function withRetryTransaction<T>(
  transaction: Parameters<typeof prisma.$transaction>[0],
  options?: RetryOptions
): Promise<T> {
  return withRetry(
    () =>
      prisma.$transaction(
        transaction as Parameters<typeof prisma.$transaction>[0]
      ) as Promise<T>,
    options
  );
}
