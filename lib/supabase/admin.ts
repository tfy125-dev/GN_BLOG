import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env["SUPABASE_URL"];
  const secretKey = process.env["SUPABASE_SECRET_KEY"];
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = secretKey || publishableKey;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or API key");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
