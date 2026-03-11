/*
  Warnings:

  - You are about to drop the column `tipoGasto` on the `egresos` table. All the data in the column will be lost.
  - You are about to drop the column `servicio` on the `ingresos` table. All the data in the column will be lost.
  - You are about to drop the column `sociedad` on the `ingresos` table. All the data in the column will be lost.
  - You are about to drop the column `tipoIngreso` on the `ingresos` table. All the data in the column will be lost.
  - Added the required column `tipoGastoId` to the `egresos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `servicioId` to the `ingresos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sociedadId` to the `ingresos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoIngresoId` to the `ingresos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "egresos_tipoGasto_idx";

-- DropIndex
DROP INDEX "ingresos_sociedad_servicio_tipoIngreso_idx";

-- AlterTable
ALTER TABLE "cajas" ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sociedadId" TEXT,
ADD COLUMN     "tipoIngresoId" TEXT;

-- AlterTable
ALTER TABLE "egresos" DROP COLUMN "tipoGasto",
ADD COLUMN     "tipoGastoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingresos" DROP COLUMN "servicio",
DROP COLUMN "sociedad",
DROP COLUMN "tipoIngreso",
ADD COLUMN     "servicioId" TEXT NOT NULL,
ADD COLUMN     "sociedadId" TEXT NOT NULL,
ADD COLUMN     "tipoIngresoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "monedas" ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "Sociedad";

-- DropEnum
DROP TYPE "TipoGasto";

-- DropEnum
DROP TYPE "TipoIngreso";

-- DropEnum
DROP TYPE "TipoServicio";

-- CreateTable
CREATE TABLE "sociedades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sociedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_servicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_ingreso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sociedades_nombre_key" ON "sociedades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_servicio_nombre_key" ON "tipos_servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_ingreso_nombre_key" ON "tipos_ingreso"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_gasto_nombre_key" ON "tipos_gasto"("nombre");

-- CreateIndex
CREATE INDEX "cajas_sociedadId_idx" ON "cajas"("sociedadId");

-- CreateIndex
CREATE INDEX "cajas_tipoIngresoId_idx" ON "cajas"("tipoIngresoId");

-- CreateIndex
CREATE INDEX "egresos_tipoGastoId_idx" ON "egresos"("tipoGastoId");

-- CreateIndex
CREATE INDEX "ingresos_sociedadId_idx" ON "ingresos"("sociedadId");

-- CreateIndex
CREATE INDEX "ingresos_servicioId_idx" ON "ingresos"("servicioId");

-- CreateIndex
CREATE INDEX "ingresos_tipoIngresoId_idx" ON "ingresos"("tipoIngresoId");

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_tipoIngresoId_fkey" FOREIGN KEY ("tipoIngresoId") REFERENCES "tipos_ingreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "tipos_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_tipoIngresoId_fkey" FOREIGN KEY ("tipoIngresoId") REFERENCES "tipos_ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_tipoGastoId_fkey" FOREIGN KEY ("tipoGastoId") REFERENCES "tipos_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
