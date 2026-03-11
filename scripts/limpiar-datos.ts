/**
 * Script para limpiar todos los datos de la base de datos
 * EXCEPTO los usuarios del sistema.
 *
 * Ejecutar con: npm run db:reset (ejecuta sin confirmación)
 *               npm run db:reset:confirm (muestra advertencia)
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import pg from "pg";

// Cargar variables de entorno desde .env
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL no está configurado");
  console.error("   Asegúrese de tener un archivo .env con DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function limpiarDatos() {
  console.log("🧹 Iniciando limpieza de datos...\n");

  try {
    // El orden es importante por las restricciones de claves foráneas
    // Primero eliminamos los registros dependientes

    // 1. Eliminar montos de ingresos (depende de ingresos y monedas)
    const ingresosMontos = await prisma.ingresoMonto.deleteMany({});
    console.log(`✓ ${ingresosMontos.count} montos de ingresos eliminados`);

    // 2. Eliminar ingresos
    const ingresos = await prisma.ingreso.deleteMany({});
    console.log(`✓ ${ingresos.count} ingresos eliminados`);

    // 3. Eliminar egresos
    const egresos = await prisma.egreso.deleteMany({});
    console.log(`✓ ${egresos.count} egresos eliminados`);

    // 4. Eliminar egresos de filiales
    const egresosFiliales = await prisma.egresoFilial.deleteMany({});
    console.log(`✓ ${egresosFiliales.count} egresos de filiales eliminados`);

    // 5. Eliminar diezmos de filiales
    const diezmosFiliales = await prisma.diezmoFilial.deleteMany({});
    console.log(`✓ ${diezmosFiliales.count} diezmos de filiales eliminados`);

    // 6. Eliminar donaciones (depende de cajas)
    const donaciones = await prisma.donacion.deleteMany({});
    console.log(`✓ ${donaciones.count} donaciones eliminadas`);

    // 7. Eliminar filiales
    const filiales = await prisma.filial.deleteMany({});
    console.log(`✓ ${filiales.count} filiales eliminadas`);

    // 8. Eliminar países
    const paises = await prisma.pais.deleteMany({});
    console.log(`✓ ${paises.count} países eliminados`);

    // 9. Eliminar cajas (depende de sociedades y tipos de ingreso)
    const cajas = await prisma.caja.deleteMany({});
    console.log(`✓ ${cajas.count} cajas eliminadas`);

    // 10. Eliminar sociedades
    const sociedades = await prisma.sociedad.deleteMany({});
    console.log(`✓ ${sociedades.count} sociedades eliminadas`);

    // 11. Eliminar tipos de servicio
    const tiposServicio = await prisma.tipoServicio.deleteMany({});
    console.log(`✓ ${tiposServicio.count} tipos de servicio eliminados`);

    // 12. Eliminar tipos de ingreso
    const tiposIngreso = await prisma.tipoIngreso.deleteMany({});
    console.log(`✓ ${tiposIngreso.count} tipos de ingreso eliminados`);

    // 13. Eliminar tipos de gasto
    const tiposGasto = await prisma.tipoGasto.deleteMany({});
    console.log(`✓ ${tiposGasto.count} tipos de gasto eliminados`);

    // 14. Eliminar monedas
    const monedas = await prisma.moneda.deleteMany({});
    console.log(`✓ ${monedas.count} monedas eliminadas`);

    // NO eliminamos usuarios
    const usuariosCount = await prisma.usuario.count();
    console.log(`\n👤 ${usuariosCount} usuario(s) conservado(s)`);

    console.log("\n✅ Limpieza completada exitosamente!");
    console.log("📝 El sistema está listo para empezar desde cero.");
    console.log(
      "   Ejecuta el asistente de configuración inicial para recrear los datos base."
    );
  } catch (error) {
    console.error("\n❌ Error durante la limpieza:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Confirmación antes de ejecutar
const args = process.argv.slice(2);
if (args.includes("--force") || args.includes("-f")) {
  limpiarDatos();
} else {
  console.log(
    "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos excepto usuarios."
  );
  console.log("   - Ingresos y egresos");
  console.log("   - Diezmos y egresos de filiales");
  console.log("   - Filiales y países");
  console.log("   - Cajas");
  console.log(
    "   - Sociedades, tipos de servicio, tipos de ingreso, tipos de gasto"
  );
  console.log("   - Monedas");
  console.log("\n   Los usuarios del sistema se conservarán.\n");
  console.log("   Para ejecutar, use: npm run db:reset\n");
}
