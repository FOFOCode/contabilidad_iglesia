-- CreateTable
CREATE TABLE "cierres_diezmo_mensual" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monedaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "totalOfrendas" DECIMAL(12,2) NOT NULL,
    "totalEgresos" DECIMAL(12,2) NOT NULL,
    "baseLiquida" DECIMAL(12,2) NOT NULL,
    "porcentaje" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "montoDiezmo" DECIMAL(12,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NO_REALIZADO',
    "cajaOrigenId" TEXT NOT NULL,
    "cajaDestinoId" TEXT,
    "transferenciaEgresoId" TEXT,
    "transferenciaIngresoId" TEXT,
    "nota" TEXT,
    "realizadoEn" TIMESTAMP(3),
    "creadoPorId" TEXT NOT NULL,
    "realizadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cierres_diezmo_mensual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cierres_diezmo_mensual_anio_mes_monedaId_key" ON "cierres_diezmo_mensual"("anio", "mes", "monedaId");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_estado_idx" ON "cierres_diezmo_mensual"("estado");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_cajaOrigenId_idx" ON "cierres_diezmo_mensual"("cajaOrigenId");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_cajaDestinoId_idx" ON "cierres_diezmo_mensual"("cajaDestinoId");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_monedaId_idx" ON "cierres_diezmo_mensual"("monedaId");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_creadoPorId_idx" ON "cierres_diezmo_mensual"("creadoPorId");

-- CreateIndex
CREATE INDEX "cierres_diezmo_mensual_realizadoPorId_idx" ON "cierres_diezmo_mensual"("realizadoPorId");

-- AddForeignKey
ALTER TABLE "cierres_diezmo_mensual" ADD CONSTRAINT "cierres_diezmo_mensual_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_diezmo_mensual" ADD CONSTRAINT "cierres_diezmo_mensual_cajaOrigenId_fkey" FOREIGN KEY ("cajaOrigenId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_diezmo_mensual" ADD CONSTRAINT "cierres_diezmo_mensual_cajaDestinoId_fkey" FOREIGN KEY ("cajaDestinoId") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_diezmo_mensual" ADD CONSTRAINT "cierres_diezmo_mensual_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_diezmo_mensual" ADD CONSTRAINT "cierres_diezmo_mensual_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
