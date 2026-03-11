import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Crear rol Admin si no existe
    let rolAdmin = await prisma.rol.findFirst({
      where: { nombre: 'Admin' }
    });

    if (!rolAdmin) {
      rolAdmin = await prisma.rol.create({
        data: {
          nombre: 'Admin',
          descripcion: 'Rol con acceso total al sistema',
          esAdmin: true,
          activo: true,
        }
      });
    }

    // Crear permisos si no existen
    const permisos = [
      { modulo: 'dashboard', nombre: 'Dashboard', orden: 1 },
      { modulo: 'ingresos', nombre: 'Ingresos', orden: 2 },
      { modulo: 'egresos', nombre: 'Egresos', orden: 3 },
      { modulo: 'cajas', nombre: 'Cajas', orden: 4 },
      { modulo: 'donaciones', nombre: 'Donaciones', orden: 5 },
      { modulo: 'filiales', nombre: 'Filiales', orden: 6 },
      { modulo: 'reportes', nombre: 'Reportes', orden: 7 },
      { modulo: 'configuracion', nombre: 'Configuración', orden: 8 },
    ];

    for (const permiso of permisos) {
      const existe = await prisma.permiso.findFirst({
        where: { modulo: permiso.modulo }
      });

      if (!existe) {
        await prisma.permiso.create({ data: permiso });
      }
    }

    // Asignar permisos al rol Admin
    const todosPermisos = await prisma.permiso.findMany();
    
    for (const permiso of todosPermisos) {
      const existe = await prisma.rolPermiso.findFirst({
        where: {
          rolId: rolAdmin.id,
          permisoId: permiso.id
        }
      });

      if (!existe) {
        await prisma.rolPermiso.create({
          data: {
            rolId: rolAdmin.id,
            permisoId: permiso.id,
            puedeCrear: true,
            puedeEditar: true,
            puedeEliminar: true,
            puedeVer: true
          }
        });
      }
    }

    // Crear usuario admin
    const email = 'admin@admin.com';
    const password = 'admin123';

    let usuario = await prisma.usuario.findFirst({
      where: { correo: email }
    });

    if (!usuario) {
      // Hashear la contraseña como lo espera el sistema
      const hashedPassword = await bcrypt.hash(password, 10);
      
      usuario = await prisma.usuario.create({
        data: {
          correo: email,
          contrasena: hashedPassword,
          nombre: 'Administrador',
          apellido: 'Sistema',
          activo: true,
          rolId: rolAdmin.id,
        }
      });
    }

    // Crear monedas
    const monedas = [
      { nombre: 'Dólar Americano', codigo: 'USD', simbolo: '$', esPrincipal: true, orden: 1, tasaCambio: 1 },
      { nombre: 'Quetzal Guatemalteco', codigo: 'GTQ', simbolo: 'Q', esPrincipal: false, orden: 2, tasaCambio: 7.8 },
    ];

    for (const moneda of monedas) {
      const existe = await prisma.moneda.findFirst({
        where: { codigo: moneda.codigo }
      });

      if (!existe) {
        await prisma.moneda.create({
          data: {
            ...moneda,
            activa: true,
          }
        });
      }
    }

    // Crear caja General
    const existeCajaGeneral = await prisma.caja.findFirst({
      where: { esGeneral: true }
    });

    if (!existeCajaGeneral) {
      await prisma.caja.create({
        data: {
          nombre: 'General',
          descripcion: 'Caja principal donde se reciben todos los fondos reales',
          activa: true,
          esGeneral: true,
          orden: 1,
          creadoPorId: usuario.id,
        }
      });
    }

    // Crear tipos de ingreso
    const tiposIngreso = [
      { nombre: 'Ofrenda General', orden: 1 },
      { nombre: 'Diezmo', orden: 2 },
      { nombre: 'Donación Especial', orden: 3 },
    ];

    for (const tipo of tiposIngreso) {
      const existe = await prisma.tipoIngreso.findFirst({
        where: { nombre: tipo.nombre }
      });

      if (!existe) {
        await prisma.tipoIngreso.create({
          data: {
            ...tipo,
            activo: true,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario admin y datos básicos creados',
      email,
      password
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear admin' },
      { status: 500 }
    );
  }
}