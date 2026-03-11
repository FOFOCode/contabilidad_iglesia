-- AlterTable
ALTER TABLE "egresos" ADD COLUMN     "numeroFactura" TEXT;

-- CreateIndex
CREATE INDEX "egresos_numeroFactura_idx" ON "egresos"("numeroFactura");
