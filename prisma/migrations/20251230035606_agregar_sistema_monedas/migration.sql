/*
  Warnings:

  - You are about to drop the column `moneda` on the `egresos` table. All the data in the column will be lost.
  - You are about to drop the column `montoGTQ` on the `ingresos` table. All the data in the column will be lost.
  - You are about to drop the column `montoUSD` on the `ingresos` table. All the data in the column will be lost.
  - Added the required column `monedaId` to the `egresos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "egresos" DROP COLUMN "moneda",
ADD COLUMN     "monedaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingresos" DROP COLUMN "montoGTQ",
DROP COLUMN "montoUSD";

-- DropEnum
DROP TYPE "Moneda";

-- CreateTable
CREATE TABLE "monedas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "tasaCambio" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingreso_montos" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "ingresoId" TEXT NOT NULL,
    "monedaId" TEXT NOT NULL,

    CONSTRAINT "ingreso_montos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monedas_codigo_key" ON "monedas"("codigo");

-- CreateIndex
CREATE INDEX "ingreso_montos_ingresoId_idx" ON "ingreso_montos"("ingresoId");

-- CreateIndex
CREATE INDEX "ingreso_montos_monedaId_idx" ON "ingreso_montos"("monedaId");

-- CreateIndex
CREATE UNIQUE INDEX "ingreso_montos_ingresoId_monedaId_key" ON "ingreso_montos"("ingresoId", "monedaId");

-- CreateIndex
CREATE INDEX "egresos_monedaId_idx" ON "egresos"("monedaId");

-- AddForeignKey
ALTER TABLE "ingreso_montos" ADD CONSTRAINT "ingreso_montos_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "ingresos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_montos" ADD CONSTRAINT "ingreso_montos_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
