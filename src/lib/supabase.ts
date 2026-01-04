import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

// Singleton para el cliente browser (evita múltiples instancias en el cliente)
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export class SupabaseService {
  private static supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  private static supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Client-side Supabase client con patrón Singleton
  static createClient() {
    if (typeof window === "undefined") {
      // En el servidor, siempre crear nueva instancia
      return createBrowserClient(this.supabaseUrl, this.supabaseKey);
    }

    // En el navegador, reutilizar instancia existente
    if (!browserClient) {
      browserClient = createBrowserClient(this.supabaseUrl, this.supabaseKey);
    }
    return browserClient;
  }

  // Server-side Supabase client (siempre crea nueva instancia con cookies)
  static async createServerClient() {
    const cookieStore = await cookies();

    return createServerClient(this.supabaseUrl, this.supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    });
  }

  // Example method: Get current user
  static async getUser() {
    const supabase = await this.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  // Example method: Sign in with email and password
  static async signIn(email: string, password: string) {
    const supabase = this.createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  // Example method: Sign out
  static async signOut() {
    const supabase = this.createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  }
}
