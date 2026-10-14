import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function recordPublishedView(postId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_post_view", { target_post_id: postId });
  if (error || data == null) return null;
  return data;
}
