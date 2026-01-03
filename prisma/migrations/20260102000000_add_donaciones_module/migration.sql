-- CreateTable: Donaciones
CREATE TABLE "donaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(12,2) NOT NULL,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "tipoOfrendaId" TEXT NOT NULL,
    "monedaId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: donaciones by cajaId
CREATE INDEX "donaciones_cajaId_idx" ON "donaciones"("cajaId");

-- CreateIndex: donaciones by usuarioId
CREATE INDEX "donaciones_usuarioId_idx" ON "donaciones"("usuarioId");

-- CreateIndex: donaciones by tipoOfrendaId
CREATE INDEX "donaciones_tipoOfrendaId_idx" ON "donaciones"("tipoOfrendaId");

-- CreateIndex: donaciones by monedaId
CREATE INDEX "donaciones_monedaId_idx" ON "donaciones"("monedaId");

-- CreateIndex: donaciones by fecha
CREATE INDEX "donaciones_fecha_idx" ON "donaciones"("fecha");

-- CreateIndex: donaciones by nombre
CREATE INDEX "donaciones_nombre_idx" ON "donaciones"("nombre");

-- CreateIndex: donaciones by creadoEn
CREATE INDEX "donaciones_creadoEn_idx" ON "donaciones"("creadoEn");

-- AddForeignKey: donaciones -> tipos_ingreso (tipoOfrenda)
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_tipoOfrendaId_fkey" FOREIGN KEY ("tipoOfrendaId") REFERENCES "tipos_ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: donaciones -> monedas
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: donaciones -> cajas
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: donaciones -> usuarios
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
