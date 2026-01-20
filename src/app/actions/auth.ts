"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Función para verificar credenciales
export async function login(correo: string, contrasena: string) {
  try {
    console.log("[Auth] Intento de login para:", correo);
    // Buscar usuario por correo, incluyendo rol y permisos
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        contrasena: true,
        activo: true,
        rol: {
          select: {
            id: true,
            nombre: true,
            permisos: {
              select: {
                puedeVer: true,
                puedeCrear: true,
                puedeEditar: true,
                puedeEliminar: true,
                permiso: {
                  select: {
                    modulo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      console.log("[Auth] Usuario no encontrado:", correo);
      return { success: false, error: "Credenciales inválidas" };
    }

    console.log(
      "[Auth] Usuario encontrado:",
      usuario.correo,
      "Activo:",
      usuario.activo
    );
    if (!usuario.activo) {
      console.log("[Auth] Usuario desactivado:", correo);
      return { success: false, error: "Usuario desactivado" };
    }

    // Verificar contraseña con bcrypt
    console.log("[Auth] Verificando contraseña para:", usuario.correo);
    const contrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena
    );
    console.log("[Auth] Contraseña válida:", contrasenaValida);
    if (!contrasenaValida) {
      console.log("[Auth] Contraseña inválida para:", usuario.correo);
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

    console.log("[Auth] Login exitoso para:", usuario.correo);
    return {
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  } catch (error) {
    console.error("[Auth] Error en login:", error);
    return { success: false, error: "Error al iniciar sesión" };
  }
}

// Función para cerrar sesión
export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return { success: true };
  } catch (error) {
    console.error("[Auth] Error al cerrar sesión:", error);
    return { success: false };
  }
}

// Función para limpiar cookie corrupta
async function limpiarCookieCorrupta() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch (error) {
    console.error("[Auth] No se pudo limpiar cookie corrupta:", error);
  }
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

    // Validar que la cookie tenga contenido
    if (!sessionCookie.value || sessionCookie.value.trim() === "") {
      console.error("[Auth] Cookie de sesión vacía");
      await limpiarCookieCorrupta();
      return null;
    }

    let sessionData;
    try {
      const decodedValue = Buffer.from(
        sessionCookie.value,
        "base64"
      ).toString();

      // Validar que el contenido decodificado no esté vacío
      if (!decodedValue || decodedValue.trim() === "") {
        console.error(
          "[Auth] Contenido de cookie vacío después de decodificar"
        );
        await limpiarCookieCorrupta();
        return null;
      }

      sessionData = JSON.parse(decodedValue);

      // Validar estructura de sessionData
      if (!sessionData || typeof sessionData !== "object" || !sessionData.id) {
        console.error("[Auth] Estructura de sesión inválida");
        await limpiarCookieCorrupta();
        return null;
      }
    } catch (parseError) {
      console.error("[Auth] Error al parsear cookie de sesión:", parseError);
      await limpiarCookieCorrupta();
      return null;
    }

    // Verificar que el usuario sigue existiendo y activo, incluir rol en misma consulta
    const usuario = await prisma.usuario.findUnique({
      where: { id: sessionData.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        activo: true,
        rol: {
          select: {
            id: true,
            nombre: true,
            permisos: {
              select: {
                puedeVer: true,
                puedeCrear: true,
                puedeEditar: true,
                puedeEliminar: true,
                permiso: {
                  select: {
                    modulo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      console.log("[Auth] Usuario no encontrado en BD, id:", sessionData.id);
      await limpiarCookieCorrupta();
      return null;
    }

    if (!usuario.activo) {
      console.log("[Auth] Usuario desactivado, id:", sessionData.id);
      await limpiarCookieCorrupta();
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
