/*
  Warnings:

  - Added the required column `numeroDocumento` to the `donaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "numeroDocumento" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "donaciones_numeroDocumento_idx" ON "donaciones"("numeroDocumento");
