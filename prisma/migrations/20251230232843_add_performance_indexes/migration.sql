-- CreateIndex
CREATE INDEX "cajas_activa_orden_idx" ON "cajas"("activa", "orden");

-- CreateIndex
CREATE INDEX "cajas_activa_esGeneral_idx" ON "cajas"("activa", "esGeneral");

-- CreateIndex
CREATE INDEX "egresos_cajaId_fechaSalida_idx" ON "egresos"("cajaId", "fechaSalida");

-- CreateIndex
CREATE INDEX "egresos_cajaId_monedaId_idx" ON "egresos"("cajaId", "monedaId");

-- CreateIndex
CREATE INDEX "egresos_fechaSalida_cajaId_idx" ON "egresos"("fechaSalida", "cajaId");

-- CreateIndex
CREATE INDEX "egresos_tipoGastoId_monedaId_idx" ON "egresos"("tipoGastoId", "monedaId");

-- CreateIndex
CREATE INDEX "egresos_creadoEn_idx" ON "egresos"("creadoEn");

-- CreateIndex
CREATE INDEX "ingresos_cajaId_fechaRecaudacion_idx" ON "ingresos"("cajaId", "fechaRecaudacion");

-- CreateIndex
CREATE INDEX "ingresos_sociedadId_fechaRecaudacion_idx" ON "ingresos"("sociedadId", "fechaRecaudacion");

-- CreateIndex
CREATE INDEX "ingresos_fechaRecaudacion_cajaId_sociedadId_idx" ON "ingresos"("fechaRecaudacion", "cajaId", "sociedadId");

-- CreateIndex
CREATE INDEX "ingresos_creadoEn_idx" ON "ingresos"("creadoEn");

-- CreateIndex
CREATE INDEX "monedas_activa_orden_idx" ON "monedas"("activa", "orden");

-- CreateIndex
CREATE INDEX "monedas_activa_esPrincipal_idx" ON "monedas"("activa", "esPrincipal");

-- CreateIndex
CREATE INDEX "sociedades_activa_orden_idx" ON "sociedades"("activa", "orden");

-- CreateIndex
CREATE INDEX "tipos_gasto_activo_orden_idx" ON "tipos_gasto"("activo", "orden");

-- CreateIndex
CREATE INDEX "tipos_ingreso_activo_orden_idx" ON "tipos_ingreso"("activo", "orden");

-- CreateIndex
CREATE INDEX "tipos_servicio_activo_orden_idx" ON "tipos_servicio"("activo", "orden");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE INDEX "usuarios_correo_activo_idx" ON "usuarios"("correo", "activo");
