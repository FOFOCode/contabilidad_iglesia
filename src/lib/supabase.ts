import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

export class SupabaseService {
  private static supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  private static supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Client-side Supabase client
  static createClient() {
    return createBrowserClient(this.supabaseUrl, this.supabaseKey);
  }

  // Server-side Supabase client
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
