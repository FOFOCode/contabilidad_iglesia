-- AlterTable
ALTER TABLE "cajas" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "egresos_filiales" ALTER COLUMN "fechaSalida" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "filiales" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "ingresos" ADD COLUMN     "cajaSecundariaId" TEXT;

-- AlterTable
ALTER TABLE "monedas" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "paises" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "sociedades" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "tipos_gasto" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "tipos_ingreso" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "tipos_servicio" ADD COLUMN     "actualizadoPorId" TEXT,
ADD COLUMN     "creadoPorId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "rolId" TEXT;

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "esAdmin" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "puedeVer" BOOLEAN NOT NULL DEFAULT true,
    "puedeCrear" BOOLEAN NOT NULL DEFAULT false,
    "puedeEditar" BOOLEAN NOT NULL DEFAULT false,
    "puedeEliminar" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "operacion" TEXT NOT NULL,
    "datoAnterior" JSONB,
    "datoNuevo" JSONB,
    "descripcion" TEXT,
    "fechaOperacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE INDEX "roles_activo_idx" ON "roles"("activo");

-- CreateIndex
CREATE INDEX "roles_creadoPorId_idx" ON "roles"("creadoPorId");

-- CreateIndex
CREATE INDEX "roles_actualizadoPorId_idx" ON "roles"("actualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_modulo_key" ON "permisos"("modulo");

-- CreateIndex
CREATE INDEX "permisos_activo_orden_idx" ON "permisos"("activo", "orden");

-- CreateIndex
CREATE INDEX "permisos_creadoPorId_idx" ON "permisos"("creadoPorId");

-- CreateIndex
CREATE INDEX "permisos_actualizadoPorId_idx" ON "permisos"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "roles_permisos_rolId_idx" ON "roles_permisos"("rolId");

-- CreateIndex
CREATE INDEX "roles_permisos_permisoId_idx" ON "roles_permisos"("permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_permisos_rolId_permisoId_key" ON "roles_permisos"("rolId", "permisoId");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_idx" ON "auditoria_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_idx" ON "auditoria_logs"("tabla");

-- CreateIndex
CREATE INDEX "auditoria_logs_registroId_idx" ON "auditoria_logs"("registroId");

-- CreateIndex
CREATE INDEX "auditoria_logs_operacion_idx" ON "auditoria_logs"("operacion");

-- CreateIndex
CREATE INDEX "auditoria_logs_fechaOperacion_idx" ON "auditoria_logs"("fechaOperacion");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_registroId_idx" ON "auditoria_logs"("tabla", "registroId");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_fechaOperacion_idx" ON "auditoria_logs"("usuarioId", "fechaOperacion");

-- CreateIndex
CREATE INDEX "cajas_creadoPorId_idx" ON "cajas"("creadoPorId");

-- CreateIndex
CREATE INDEX "cajas_actualizadoPorId_idx" ON "cajas"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "filiales_creadoPorId_idx" ON "filiales"("creadoPorId");

-- CreateIndex
CREATE INDEX "filiales_actualizadoPorId_idx" ON "filiales"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "ingresos_cajaSecundariaId_idx" ON "ingresos"("cajaSecundariaId");

-- CreateIndex
CREATE INDEX "ingresos_cajaSecundariaId_fechaRecaudacion_idx" ON "ingresos"("cajaSecundariaId", "fechaRecaudacion");

-- CreateIndex
CREATE INDEX "monedas_creadoPorId_idx" ON "monedas"("creadoPorId");

-- CreateIndex
CREATE INDEX "monedas_actualizadoPorId_idx" ON "monedas"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "paises_creadoPorId_idx" ON "paises"("creadoPorId");

-- CreateIndex
CREATE INDEX "paises_actualizadoPorId_idx" ON "paises"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "sociedades_creadoPorId_idx" ON "sociedades"("creadoPorId");

-- CreateIndex
CREATE INDEX "sociedades_actualizadoPorId_idx" ON "sociedades"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "tipos_gasto_creadoPorId_idx" ON "tipos_gasto"("creadoPorId");

-- CreateIndex
CREATE INDEX "tipos_gasto_actualizadoPorId_idx" ON "tipos_gasto"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "tipos_ingreso_creadoPorId_idx" ON "tipos_ingreso"("creadoPorId");

-- CreateIndex
CREATE INDEX "tipos_ingreso_actualizadoPorId_idx" ON "tipos_ingreso"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "tipos_servicio_creadoPorId_idx" ON "tipos_servicio"("creadoPorId");

-- CreateIndex
CREATE INDEX "tipos_servicio_actualizadoPorId_idx" ON "tipos_servicio"("actualizadoPorId");

-- CreateIndex
CREATE INDEX "usuarios_rolId_idx" ON "usuarios"("rolId");

-- AddForeignKey
ALTER TABLE "monedas" ADD CONSTRAINT "monedas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monedas" ADD CONSTRAINT "monedas_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sociedades" ADD CONSTRAINT "sociedades_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sociedades" ADD CONSTRAINT "sociedades_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_servicio" ADD CONSTRAINT "tipos_servicio_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_servicio" ADD CONSTRAINT "tipos_servicio_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_ingreso" ADD CONSTRAINT "tipos_ingreso_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_ingreso" ADD CONSTRAINT "tipos_ingreso_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_gasto" ADD CONSTRAINT "tipos_gasto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_gasto" ADD CONSTRAINT "tipos_gasto_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paises" ADD CONSTRAINT "paises_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paises" ADD CONSTRAINT "paises_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiales" ADD CONSTRAINT "filiales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiales" ADD CONSTRAINT "filiales_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cajaSecundariaId_fkey" FOREIGN KEY ("cajaSecundariaId") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
