"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type Member = Tables<"members">;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateMember(input: { email?: string; name?: string }, partial = false) {
  const email = input.email?.trim();
  const name = input.name?.trim();

  if (!partial || input.email !== undefined) {
    if (!email) return "이메일을 입력하세요.";
    if (!EMAIL_PATTERN.test(email)) return "이메일 형식이 올바르지 않습니다.";
  }

  if (!partial || input.name !== undefined) {
    if (!name) return "이름을 입력하세요.";
  }

  return null;
}

export async function getMembers(): Promise<ActionResult<Member[]>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, email, name, created_at")
      .order("id", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "조회에 실패했습니다." };
  }
}

export async function getMember(id: number): Promise<ActionResult<Member>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, email, name, created_at")
      .eq("id", id)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "조회에 실패했습니다." };
  }
}

export async function createMember(input: {
  email: string;
  name: string;
}): Promise<ActionResult<Member>> {
  const invalid = validateMember(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .insert({ email: input.email.trim(), name: input.name.trim() })
      .select("id, email, name, created_at")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "추가에 실패했습니다." };
  }
}

export async function updateMember(
  id: number,
  input: { email?: string; name?: string },
): Promise<ActionResult<Member>> {
  const invalid = validateMember(input, true);
  if (invalid) return { ok: false, error: invalid };

  const payload: { email?: string; name?: string } = {};
  if (input.email !== undefined) payload.email = input.email.trim();
  if (input.name !== undefined) payload.name = input.name.trim();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .update(payload)
      .eq("id", id)
      .select("id, email, name, created_at")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "수정에 실패했습니다." };
  }
}

export async function deleteMember(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "삭제에 실패했습니다." };
  }
}
