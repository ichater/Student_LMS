import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

export function isAdmin(user: User): boolean {
  return user.app_metadata?.role === "admin";
}
