"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Función para verificar credenciales
export async function login(correo: string, contrasena: string) {
  try {
    // Buscar usuario por correo
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!usuario) {
      return { success: false, error: "Credenciales inválidas" };
    }

    if (!usuario.activo) {
      return { success: false, error: "Usuario desactivado" };
    }

    // Verificar contraseña (base64 simple, en producción usar bcrypt)
    const contrasenaHash = Buffer.from(contrasena).toString("base64");
    if (usuario.contrasena !== contrasenaHash) {
      return { success: false, error: "Credenciales inválidas" };
    }

    // Crear sesión simple con cookie
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
    });

    cookieStore.set("session", Buffer.from(sessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return {
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
      },
    };
  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, error: "Error al iniciar sesión" };
  }
}

// Función para cerrar sesión
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { success: true };
}

// Función para obtener el usuario actual
export async function getUsuarioActual() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      console.log("[Auth] No hay cookie de sesión");
      return null;
    }

    let sessionData;
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, "base64").toString()
      );
    } catch (parseError) {
      console.error("[Auth] Error al parsear cookie de sesión:", parseError);
      // No podemos borrar la cookie aquí porque podría ser llamado desde un Server Component
      return null;
    }

    // Verificar que el usuario sigue existiendo y activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: sessionData.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        activo: true,
      },
    });

    if (!usuario) {
      console.log("[Auth] Usuario no encontrado en BD, id:", sessionData.id);
      // No podemos borrar la cookie aquí porque podría ser llamado desde un Server Component
      return null;
    }

    if (!usuario.activo) {
      console.log("[Auth] Usuario desactivado, id:", sessionData.id);
      return null;
    }

    return usuario;
  } catch (error) {
    console.error("[Auth] Error en getUsuarioActual:", error);
    return null;
  }
}

// Función para verificar si hay sesión activa
export async function verificarSesion() {
  const usuario = await getUsuarioActual();
  return { autenticado: !!usuario, usuario };
}

// Función para verificar si hay usuarios registrados
export async function hayUsuariosRegistrados() {
  try {
    const count = await prisma.usuario.count();
    return count > 0;
  } catch {
    return false;
  }
}

// Función para crear el primer usuario administrador
export async function crearPrimerAdmin(datos: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
}) {
  try {
    // Verificar que no haya usuarios existentes
    const count = await prisma.usuario.count();
    if (count > 0) {
      return { success: false, error: "Ya existe un usuario administrador" };
    }

    // Crear el usuario
    const contrasenaHash = Buffer.from(datos.contrasena).toString("base64");
    const usuario = await prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        contrasena: contrasenaHash,
        activo: true,
      },
    });

    // Iniciar sesión automáticamente
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
    });

    cookieStore.set("session", Buffer.from(sessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Error al crear primer admin:", error);
    return { success: false, error: "Error al crear el usuario" };
  }
}
