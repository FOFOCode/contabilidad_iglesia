const { PrismaClient } = require('../../src/generated/prisma/index.js');

const prisma = new PrismaClient();

async function crearAdmin() {
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
          orden: 1,
        }
      });
      console.log('✅ Rol Admin creado:', rolAdmin.id);
    } else {
      console.log('✅ Rol Admin ya existe:', rolAdmin.id);
    }

    // Crear todos los permisos si no existen
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
        await prisma.permiso.create({
          data: permiso
        });
        console.log(`✅ Permiso creado: ${permiso.nombre}`);
      }
    }

    // Asignar todos los permisos al rol Admin
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
            crear: true,
            editar: true,
            eliminar: true,
            ver: true
          }
        });
      }
    }

    // Crear usuario admin
    const email = 'admin@admin.com';
    const password = 'admin123'; // En producción, deberías cambiar esto

    let usuario = await prisma.usuario.findFirst({
      where: { email }
    });

    if (!usuario) {
      // En un caso real, deberías hashear la contraseña con bcrypt
      // Para este caso de emergencia, la guardaremos como texto plano
      usuario = await prisma.usuario.create({
        data: {
          email,
          password, // NOTA: En producción usar hash
          nombre: 'Administrador',
          apellido: 'Sistema',
          activo: true,
          rolId: rolAdmin.id,
        }
      });
      console.log('✅ Usuario admin creado:', usuario.email);
      console.log('🔑 Email:', email);
      console.log('🔑 Contraseña:', password);
    } else {
      console.log('✅ Usuario admin ya existe:', usuario.email);
    }

    // Crear datos básicos si no existen
    // Monedas
    const monedas = [
      { nombre: 'Dólar Americano', codigo: 'USD', simbolo: '$', esPrincipal: true, orden: 1 },
      { nombre: 'Quetzal Guatemalteco', codigo: 'GTQ', simbolo: 'Q', esPrincipal: false, orden: 2 },
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
            tasaCambio: moneda.codigo === 'USD' ? 1 : 7.8, // Aproximado
          }
        });
        console.log(`✅ Moneda creada: ${moneda.nombre}`);
      }
    }

    // Caja General
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
      console.log('✅ Caja General creada');
    }

    // Tipos de Ingreso
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
        console.log(`✅ Tipo de ingreso creado: ${tipo.nombre}`);
      }
    }

    // Tipos de Gasto
    const tiposGasto = [
      { nombre: 'Gastos Administrativos', orden: 1 },
      { nombre: 'Mantenimiento', orden: 2 },
      { nombre: 'Servicios Básicos', orden: 3 },
      { nombre: 'Material de Oficina', orden: 4 },
    ];

    for (const tipo of tiposGasto) {
      const existe = await prisma.tipoGasto.findFirst({
        where: { nombre: tipo.nombre }
      });

      if (!existe) {
        await prisma.tipoGasto.create({
          data: {
            ...tipo,
            activo: true,
          }
        });
        console.log(`✅ Tipo de gasto creado: ${tipo.nombre}`);
      }
    }

    console.log('🎉 ¡Configuración básica completada!');
    console.log('📱 Puedes iniciar sesión con:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log('⚠️  Cambia la contraseña en producción');

  } catch (error) {
    console.error('❌ Error al crear admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearAdmin();