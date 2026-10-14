import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { CommentForm, DeleteCommentButton } from "@/app/blog/comment-box";
import { FollowButton } from "@/app/blog/follow-button";
import { LikeButton } from "@/app/blog/like-button";
import { formatDate, renderPostHtml } from "@/lib/blog/content";
import { recordPublishedView } from "@/lib/blog/views";
import { createClient } from "@/lib/supabase/server";

async function PostPageBody({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  await connection();
  const { username, slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (!profile) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const viewerId = userData.user?.id ?? null;
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, slug, status, content_json, published_at, view_count, author_id, reading_time_minutes")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!post) notFound();
  if (post.status !== "published" && viewerId !== post.author_id) notFound();

  const countedView =
    post.status === "published" && viewerId !== post.author_id
      ? await recordPublishedView(post.id)
      : post.view_count;

  const { count } = await supabase
    .from("post_likes")
    .select("user_id", { count: "exact", head: true })
    .eq("post_id", post.id);
  const { data: mine } = viewerId
    ? await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", post.id)
        .eq("user_id", viewerId)
        .maybeSingle()
    : { data: null };
  const { data: following } =
    viewerId && viewerId !== profile.id
      ? await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", profile.id)
          .maybeSingle()
      : { data: null };
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, author:profiles!comments_author_id_fkey(username, display_name)")
    .eq("post_id", post.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const html = renderPostHtml(post.content_json);

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={`/blog/${profile.username}`} className="underline">
            {profile.display_name}
          </Link>
          <span>@{profile.username}</span>
          <span>{formatDate(post.published_at)}</span>
          <span>조회 {countedView ?? post.view_count}</span>
          {post.reading_time_minutes ? <span>{post.reading_time_minutes}분</span> : null}
          {post.status !== "published" ? <span>임시 저장</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {viewerId === post.author_id ? (
            <Link href={`/blog/${profile.username}/${post.slug}/edit`} className="text-sm underline">
              수정
            </Link>
          ) : (
            <FollowButton
              username={profile.username}
              initialFollowing={Boolean(following)}
              loggedIn={Boolean(viewerId)}
            />
          )}
          {post.status === "published" ? (
            <LikeButton
              postId={post.id}
              initialLiked={Boolean(mine)}
              initialCount={count ?? 0}
              loggedIn={Boolean(viewerId)}
            />
          ) : null}
        </div>
      </header>
      <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">댓글 {comments?.length ?? 0}</h2>
        <ul className="flex flex-col gap-4">
          {(comments ?? []).map((comment) => {
            const author = Array.isArray(comment.author) ? comment.author[0] : comment.author;
            return (
              <li key={comment.id} className="flex flex-col gap-1">
                <p className="text-sm">
                  <span className="font-medium">{author?.display_name ?? "회원"}</span>
                  <span className="text-zinc-500"> · {formatDate(comment.created_at)}</span>
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
                {viewerId === comment.author_id ? <DeleteCommentButton commentId={comment.id} /> : null}
              </li>
            );
          })}
        </ul>
        {post.status === "published" ? <CommentForm postId={post.id} loggedIn={Boolean(viewerId)} /> : null}
      </section>
    </article>
  );
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">글을 불러오는 중...</p>}>
        <PostPageBody params={params} />
      </Suspense>
    </main>
  );
}
