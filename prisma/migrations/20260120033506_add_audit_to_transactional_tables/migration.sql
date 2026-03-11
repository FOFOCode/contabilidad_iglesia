/*
  Warnings:

  - Added the required column `creadoPorId` to the `diezmos_filiales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creadoPorId` to the `donaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creadoPorId` to the `egresos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creadoPorId` to the `egresos_filiales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creadoPorId` to the `ingresos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diezmos_filiales" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "egresos" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "egresos_filiales" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingresos" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "diezmos_filiales_creadoPorId_idx" ON "diezmos_filiales"("creadoPorId");

-- CreateIndex
CREATE INDEX "diezmos_filiales_actualizadoPorId_idx" ON "diezmos_filiales"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "donaciones_creadoPorId_idx" ON "donaciones"("creadoPorId");

-- CreateIndex
CREATE INDEX "donaciones_actualizadoPorId_idx" ON "donaciones"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "egresos_creadoPorId_idx" ON "egresos"("creadoPorId");

-- CreateIndex
CREATE INDEX "egresos_actualizadoPorId_idx" ON "egresos"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "egresos_filiales_creadoPorId_idx" ON "egresos_filiales"("creadoPorId");

-- CreateIndex
CREATE INDEX "egresos_filiales_actualizadoPorId_idx" ON "egresos_filiales"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "ingresos_creadoPorId_idx" ON "ingresos"("creadoPorId");

-- CreateIndex
CREATE INDEX "ingresos_actualizadoPorId_idx" ON "ingresos"("actualizadoPorId");

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
