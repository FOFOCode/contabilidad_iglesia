-- CreateEnum
CREATE TYPE "Sociedad" AS ENUM ('HOMBRES', 'MUJERES', 'CULTO_GENERAL');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('CULTO', 'ORACION', 'VIGILIA', 'MATUTINO', 'ENSENANZA');

-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('OFRENDA', 'TALENTOS', 'PROMESAS', 'DIEZMO', 'DONACION', 'HNO_AYUDA');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('COMBUSTIBLE', 'AGUA_PIPA', 'FUNERARIA', 'LUZ_ELECTRICA', 'OTROS');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'GTQ');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" TEXT NOT NULL,
    "sociedad" "Sociedad" NOT NULL,
    "servicio" "TipoServicio" NOT NULL,
    "tipoIngreso" "TipoIngreso" NOT NULL,
    "montoUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montoGTQ" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fechaRecaudacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "cajaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egresos" (
    "id" TEXT NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitante" TEXT NOT NULL,
    "tipoGasto" "TipoGasto" NOT NULL,
    "descripcionGasto" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "cajaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "egresos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_nombre_key" ON "cajas"("nombre");

-- CreateIndex
CREATE INDEX "ingresos_cajaId_idx" ON "ingresos"("cajaId");

-- CreateIndex
CREATE INDEX "ingresos_usuarioId_idx" ON "ingresos"("usuarioId");

-- CreateIndex
CREATE INDEX "ingresos_fechaRecaudacion_idx" ON "ingresos"("fechaRecaudacion");

-- CreateIndex
CREATE INDEX "ingresos_sociedad_servicio_tipoIngreso_idx" ON "ingresos"("sociedad", "servicio", "tipoIngreso");

-- CreateIndex
CREATE INDEX "egresos_cajaId_idx" ON "egresos"("cajaId");

-- CreateIndex
CREATE INDEX "egresos_usuarioId_idx" ON "egresos"("usuarioId");

-- CreateIndex
CREATE INDEX "egresos_fechaSalida_idx" ON "egresos"("fechaSalida");

-- CreateIndex
CREATE INDEX "egresos_tipoGasto_idx" ON "egresos"("tipoGasto");

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
