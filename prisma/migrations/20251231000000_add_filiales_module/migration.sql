-- CreateTable
CREATE TABLE "paises" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pastor" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diezmos_filiales" (
    "id" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "monedaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "comentario" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diezmos_filiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egresos_filiales" (
    "id" TEXT NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL,
    "solicitante" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "monedaId" TEXT NOT NULL,
    "tipoGastoId" TEXT NOT NULL,
    "descripcionGasto" TEXT,
    "comentario" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "egresos_filiales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paises_nombre_key" ON "paises"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "paises_codigo_key" ON "paises"("codigo");

-- CreateIndex
CREATE INDEX "paises_activo_orden_idx" ON "paises"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "filiales_nombre_key" ON "filiales"("nombre");

-- CreateIndex
CREATE INDEX "filiales_paisId_idx" ON "filiales"("paisId");

-- CreateIndex
CREATE INDEX "filiales_activa_orden_idx" ON "filiales"("activa", "orden");

-- CreateIndex
CREATE INDEX "diezmos_filiales_filialId_idx" ON "diezmos_filiales"("filialId");

-- CreateIndex
CREATE INDEX "diezmos_filiales_monedaId_idx" ON "diezmos_filiales"("monedaId");

-- CreateIndex
CREATE INDEX "diezmos_filiales_usuarioId_idx" ON "diezmos_filiales"("usuarioId");

-- CreateIndex
CREATE INDEX "diezmos_filiales_anio_mes_idx" ON "diezmos_filiales"("anio", "mes");

-- CreateIndex
CREATE INDEX "diezmos_filiales_filialId_anio_mes_idx" ON "diezmos_filiales"("filialId", "anio", "mes");

-- CreateIndex
CREATE INDEX "egresos_filiales_monedaId_idx" ON "egresos_filiales"("monedaId");

-- CreateIndex
CREATE INDEX "egresos_filiales_tipoGastoId_idx" ON "egresos_filiales"("tipoGastoId");

-- CreateIndex
CREATE INDEX "egresos_filiales_usuarioId_idx" ON "egresos_filiales"("usuarioId");

-- CreateIndex
CREATE INDEX "egresos_filiales_fechaSalida_idx" ON "egresos_filiales"("fechaSalida");

-- CreateIndex
CREATE INDEX "egresos_filiales_creadoEn_idx" ON "egresos_filiales"("creadoEn");

-- AddForeignKey
ALTER TABLE "filiales" ADD CONSTRAINT "filiales_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diezmos_filiales" ADD CONSTRAINT "diezmos_filiales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "monedas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_tipoGastoId_fkey" FOREIGN KEY ("tipoGastoId") REFERENCES "tipos_gastos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos_filiales" ADD CONSTRAINT "egresos_filiales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
