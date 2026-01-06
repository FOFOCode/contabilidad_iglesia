/**
 * Script para crear roles y permisos iniciales del sistema
 * Ejecutar con: npx tsx scripts/seed-roles-permisos.ts
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import pg from "pg";

// Cargar variables de entorno
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL no está configurado");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedRolesYPermisos() {
  console.log("🌱 Creando roles y permisos iniciales...\n");

  try {
    // 1. Crear permisos (módulos del sistema)
    console.log("📋 Creando permisos de módulos...");
    const permisos = await prisma.$transaction([
      prisma.permiso.upsert({
        where: { modulo: "dashboard" },
        update: {},
        create: {
          modulo: "dashboard",
          nombre: "Dashboard",
          descripcion: "Acceso al panel principal con resumen de cajas",
          orden: 1,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "ingresos" },
        update: {},
        create: {
          modulo: "ingresos",
          nombre: "Ingresos",
          descripcion: "Gestión de ingresos (ofrendas, diezmos, etc.)",
          orden: 2,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "egresos" },
        update: {},
        create: {
          modulo: "egresos",
          nombre: "Egresos",
          descripcion: "Gestión de gastos y salidas de dinero",
          orden: 3,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "cajas" },
        update: {},
        create: {
          modulo: "cajas",
          nombre: "Cajas",
          descripcion: "Visualización y detalle de cajas contables",
          orden: 4,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "reportes" },
        update: {},
        create: {
          modulo: "reportes",
          nombre: "Reportes",
          descripcion: "Generación de reportes financieros",
          orden: 5,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "filiales" },
        update: {},
        create: {
          modulo: "filiales",
          nombre: "Filiales",
          descripcion: "Gestión de iglesias filiales y sus diezmos",
          orden: 6,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "donaciones" },
        update: {},
        create: {
          modulo: "donaciones",
          nombre: "Donaciones",
          descripcion: "Registro de donaciones especiales",
          orden: 7,
        },
      }),
      prisma.permiso.upsert({
        where: { modulo: "configuracion" },
        update: {},
        create: {
          modulo: "configuracion",
          nombre: "Configuración",
          descripcion:
            "Configuración del sistema (usuarios, cajas, tipos, etc.)",
          orden: 8,
        },
      }),
    ]);
    console.log(`✓ ${permisos.length} permisos creados`);

    // 2. Crear rol de Administrador con todos los permisos
    console.log("\n👤 Creando rol de Administrador...");
    const rolAdmin = await prisma.rol.upsert({
      where: { nombre: "Administrador" },
      update: {},
      create: {
        nombre: "Administrador",
        descripcion: "Acceso completo a todos los módulos del sistema",
        esAdmin: true,
      },
    });
    console.log(`✓ Rol "${rolAdmin.nombre}" creado`);

    // 3. Asignar todos los permisos al rol de administrador
    console.log("\n🔐 Asignando permisos al rol Administrador...");
    let permisosAsignados = 0;
    for (const permiso of permisos) {
      await prisma.rolPermiso.upsert({
        where: {
          rolId_permisoId: {
            rolId: rolAdmin.id,
            permisoId: permiso.id,
          },
        },
        update: {},
        create: {
          rolId: rolAdmin.id,
          permisoId: permiso.id,
          puedeVer: true,
          puedeCrear: true,
          puedeEditar: true,
          puedeEliminar: true,
        },
      });
      permisosAsignados++;
    }
    console.log(`✓ ${permisosAsignados} permisos asignados al Administrador`);

    // 4. Crear rol de Tesorero (puede ver y crear ingresos/egresos, ver reportes)
    console.log("\n👤 Creando rol de Tesorero...");
    const rolTesorero = await prisma.rol.upsert({
      where: { nombre: "Tesorero" },
      update: {},
      create: {
        nombre: "Tesorero",
        descripcion:
          "Puede registrar ingresos, egresos y ver reportes financieros",
        esAdmin: false,
      },
    });
    console.log(`✓ Rol "${rolTesorero.nombre}" creado`);

    // Permisos del tesorero
    const modulosTesorero = [
      "dashboard",
      "ingresos",
      "egresos",
      "cajas",
      "reportes",
    ];
    permisosAsignados = 0;
    for (const permiso of permisos) {
      if (modulosTesorero.includes(permiso.modulo)) {
        await prisma.rolPermiso.upsert({
          where: {
            rolId_permisoId: {
              rolId: rolTesorero.id,
              permisoId: permiso.id,
            },
          },
          update: {},
          create: {
            rolId: rolTesorero.id,
            permisoId: permiso.id,
            puedeVer: true,
            puedeCrear: ["ingresos", "egresos"].includes(permiso.modulo),
            puedeEditar: false,
            puedeEliminar: false,
          },
        });
        permisosAsignados++;
      }
    }
    console.log(`✓ ${permisosAsignados} permisos asignados al Tesorero`);

    // 5. Crear rol de Contador (solo lectura de todo excepto configuración)
    console.log("\n👤 Creando rol de Contador...");
    const rolContador = await prisma.rol.upsert({
      where: { nombre: "Contador" },
      update: {},
      create: {
        nombre: "Contador",
        descripcion: "Solo lectura de movimientos financieros y reportes",
        esAdmin: false,
      },
    });
    console.log(`✓ Rol "${rolContador.nombre}" creado`);

    // Permisos del contador (solo lectura)
    const modulosContador = [
      "dashboard",
      "ingresos",
      "egresos",
      "cajas",
      "reportes",
      "filiales",
      "donaciones",
    ];
    permisosAsignados = 0;
    for (const permiso of permisos) {
      if (modulosContador.includes(permiso.modulo)) {
        await prisma.rolPermiso.upsert({
          where: {
            rolId_permisoId: {
              rolId: rolContador.id,
              permisoId: permiso.id,
            },
          },
          update: {},
          create: {
            rolId: rolContador.id,
            permisoId: permiso.id,
            puedeVer: true,
            puedeCrear: false,
            puedeEditar: false,
            puedeEliminar: false,
          },
        });
        permisosAsignados++;
      }
    }
    console.log(`✓ ${permisosAsignados} permisos asignados al Contador`);

    // 6. Asignar rol de Administrador al usuario existente
    console.log("\n👤 Asignando rol Administrador al usuario existente...");
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { activo: true },
    });

    if (usuarioExistente) {
      await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: { rolId: rolAdmin.id },
      });
      console.log(
        `✓ Usuario "${usuarioExistente.nombre} ${usuarioExistente.apellido}" ahora es Administrador`
      );
    } else {
      console.log("⚠️  No se encontró ningún usuario activo");
    }

    console.log("\n✅ Seed de roles y permisos completado exitosamente!");
    console.log("📝 Ahora puedes gestionar roles desde Configuración > Roles");
  } catch (error) {
    console.error("\n❌ Error durante el seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedRolesYPermisos();
