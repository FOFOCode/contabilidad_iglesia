-- CreateTable
CREATE TABLE "donaciones_tracking" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "telefono" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(12,2) NOT NULL,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donacionId" TEXT NOT NULL,
    "tipoOfrendaId" TEXT NOT NULL,
    "monedaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "donaciones_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donaciones_tracking_donacionId_key" ON "donaciones_tracking"("donacionId");

-- CreateIndex
CREATE INDEX "donaciones_tracking_fecha_idx" ON "donaciones_tracking"("fecha");

-- CreateIndex
CREATE INDEX "donaciones_tracking_tipoOfrendaId_idx" ON "donaciones_tracking"("tipoOfrendaId");

-- CreateIndex
CREATE INDEX "donaciones_tracking_monedaId_idx" ON "donaciones_tracking"("monedaId");

-- CreateIndex
CREATE INDEX "donaciones_tracking_nombre_idx" ON "donaciones_tracking"("nombre");

-- AddForeignKey
ALTER TABLE "donaciones_tracking" ADD CONSTRAINT "donaciones_tracking_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "donaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones_tracking" ADD CONSTRAINT "donaciones_tracking_tipoOfrendaId_fkey" FOREIGN KEY ("tipoOfrendaId") REFERENCES "tipos_ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones_tracking" ADD CONSTRAINT "donaciones_tracking_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones_tracking" ADD CONSTRAINT "donaciones_tracking_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
