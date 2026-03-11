import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("session");

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);

  // Evitar que el logout sea cacheado por el navegador o CDN
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");

  return response;
}
