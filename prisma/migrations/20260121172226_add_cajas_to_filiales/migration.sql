/*
  Warnings:

  - Added the required column `cajaId` to the `diezmos_filiales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cajaId` to the `egresos_filiales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diezmos_filiales" ADD COLUMN     "cajaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "egresos_filiales" ADD COLUMN     "cajaId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "diezmos_filiales_cajaId_idx" ON "diezmos_filiales"("cajaId");

-- CreateIndex
CREATE INDEX "egresos_filiales_cajaId_idx" ON "egresos_filiales"("cajaId");

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
