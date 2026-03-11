import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Buscar el usuario admin existente
    const usuario = await prisma.usuario.findFirst({
      where: { correo: 'admin@admin.com' }
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario admin no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la contraseña hasheada
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { contrasena: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña de admin actualizada correctamente',
      email: 'admin@admin.com',
      password: 'admin123'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar contraseña' },
      { status: 500 }
    );
  }
}