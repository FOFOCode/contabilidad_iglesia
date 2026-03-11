import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware corre en Edge Runtime por defecto en Next.js — no se necesita declarar runtime explícitamente.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas (dashboard)
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // Obtener cookie de sesión
  const sessionCookie = request.cookies.get("session");

  // Si intenta acceder al dashboard sin sesión, redirigir a login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión e intenta ir al login, redirigir al dashboard
  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
