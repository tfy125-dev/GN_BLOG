"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDoc, isValidSlug, postPath, preparedContent, slugify } from "@/lib/blog/content";
import type { Json } from "@/lib/supabase/database.types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function readableError(error: { message: string; code?: string }) {
  if (error.code === "23505") return "같은 주소의 글이 이미 있습니다.";
  if (error.message.includes("posts_published_requirements")) return "발행하려면 본문을 입력하세요.";
  if (error.message.includes("posts_slug_format") || error.message.includes("posts_title_length")) {
    return "제목 또는 주소 형식을 확인해 주세요.";
  }
  if (error.message.includes("comments_body") || error.message.includes("char_length")) {
    return "댓글은 1자 이상 4000자 이하로 입력하세요.";
  }
  return error.message;
}

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", data.user.id)
    .maybeSingle();
  return { supabase, user: data.user, profile };
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  base: string,
  currentId?: number,
) {
  const root = isValidSlug(base) ? base : "post";
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index + 1}`;
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("author_id", authorId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === currentId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function savePost(input: {
  id?: number;
  title: string;
  slug?: string;
  content: Json;
  publish: boolean;
}): Promise<ActionResult<{ path: string }>> {
  const title = input.title.trim();
  if (!title || title.length > 200) return { ok: false, error: "제목은 1자 이상 200자 이하로 입력하세요." };
  if (!isDoc(input.content)) return { ok: false, error: "본문 형식이 올바르지 않습니다." };

  const prepared = preparedContent(input.content);
  if (input.publish && prepared.content_text.length === 0) {
    return { ok: false, error: "발행하려면 본문을 입력하세요." };
  }

  const { supabase, user, profile } = await requireUser();
  if (!user || !profile) return { ok: false, error: "글을 쓰려면 구글 로그인이 필요합니다." };

  const requested = input.slug?.trim() || slugify(title) || "post";
  if (input.slug?.trim() && !isValidSlug(input.slug.trim())) {
    return { ok: false, error: "주소는 영어 소문자, 숫자, 하이픈만 사용할 수 있습니다." };
  }
  const slug = await uniqueSlug(supabase, user.id, requested, input.id);
  const status = input.publish ? "published" : "draft";
  const payload = {
    title,
    slug,
    status,
    ...prepared,
    seo_title: title.slice(0, 70),
    canonical_path: postPath(profile.username, slug),
    robots: input.publish ? "index,follow" : "noindex,nofollow",
    published_at: input.publish ? new Date().toISOString() : null,
  };

  if (input.id) {
    const { data: existing } = await supabase
      .from("posts")
      .select("published_at, author_id")
      .eq("id", input.id)
      .maybeSingle();
    if (!existing || existing.author_id !== user.id) return { ok: false, error: "수정할 글을 찾지 못했습니다." };
    const { error } = await supabase
      .from("posts")
      .update({
        ...payload,
        published_at: input.publish ? (existing.published_at ?? payload.published_at) : null,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: readableError(error) };
  } else {
    const { error } = await supabase.from("posts").insert({ ...payload, author_id: user.id });
    if (error) return { ok: false, error: readableError(error) };
  }

  const path = postPath(profile.username, slug);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${profile.username}`);
  revalidatePath(path);
  return { ok: true, data: { path } };
}

export async function toggleFollow(username: string): Promise<ActionResult<{ following: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "팔로우하려면 로그인이 필요합니다." };

  const { data: target } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!target) return { ok: false, error: "회원을 찾지 못했습니다." };
  if (target.id === user.id) return { ok: false, error: "내 계정은 팔로우할 수 없습니다." };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", target.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", target.id);
    if (error) return { ok: false, error: readableError(error) };
    revalidatePath(`/blog/${username}`);
    return { ok: true, data: { following: false } };
  }

  const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: target.id });
  if (error) return { ok: false, error: readableError(error) };
  revalidatePath(`/blog/${username}`);
  return { ok: true, data: { following: true } };
}

export async function toggleLike(postId: number): Promise<ActionResult<{ liked: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "좋아요를 누르려면 로그인이 필요합니다." };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    if (error) return { ok: false, error: readableError(error) };
    revalidatePath("/blog");
    return { ok: true, data: { liked: false } };
  }

  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  if (error) return { ok: false, error: readableError(error) };
  revalidatePath("/blog");
  return { ok: true, data: { liked: true } };
}

export async function addComment(postId: number, body: string): Promise<ActionResult<{ id: number }>> {
  const text = body.trim();
  if (!text || text.length > 4000) return { ok: false, error: "댓글은 1자 이상 4000자 이하로 입력하세요." };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "댓글을 쓰려면 로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body: text })
    .select("id")
    .single();
  if (error) return { ok: false, error: readableError(error) };
  revalidatePath("/blog");
  return { ok: true, data };
}

export async function removeComment(commentId: number): Promise<ActionResult<{ id: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "댓글을 지우려면 로그인이 필요합니다." };
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", user.id);
  if (error) return { ok: false, error: readableError(error) };
  revalidatePath("/blog");
  return { ok: true, data: { id: commentId } };
}
