import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { FollowButton } from "@/app/blog/follow-button";
import { formatDate, postPath } from "@/lib/blog/content";
import { createClient } from "@/lib/supabase/server";

async function AuthorBlog({ params }: { params: Promise<{ username: string }> }) {
  await connection();
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .maybeSingle();
  if (!profile) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const viewerId = userData.user?.id ?? null;
  const isOwner = viewerId === profile.id;

  let postsQuery = supabase
    .from("posts")
    .select("id, title, slug, excerpt, status, published_at, view_count, updated_at")
    .eq("author_id", profile.id)
    .order("updated_at", { ascending: false });
  if (!isOwner) postsQuery = postsQuery.eq("status", "published");
  const { data: posts } = await postsQuery;
  const postIds = (posts ?? []).map((post) => post.id);
  const { data: likes } = postIds.length
    ? await supabase.from("post_likes").select("post_id").in("post_id", postIds)
    : { data: [] };
  const likeCount = new Map<number, number>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
  }

  const { count } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", profile.id);
  const { data: following } = viewerId
    ? await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("following_id", profile.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            // Google profile photos are remote URLs that are not configured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full" />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{profile.display_name}</h1>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
          </div>
        </div>
        {profile.bio ? <p className="text-sm leading-6">{profile.bio}</p> : null}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">팔로워 {count ?? 0}</p>
        {isOwner ? (
          <Link href="/blog/new" className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
            글 쓰기
          </Link>
        ) : (
          <FollowButton username={profile.username} initialFollowing={Boolean(following)} loggedIn={Boolean(viewerId)} />
        )}
      </header>
      <ul className="flex flex-col gap-4">
        {(posts ?? []).length === 0 ? <li className="text-sm text-zinc-500">아직 글이 없습니다.</li> : null}
        {(posts ?? []).map((post) => (
          <li key={post.id} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <Link href={postPath(profile.username, post.slug)} className="text-xl font-semibold">
                {post.title}
              </Link>
              {post.status !== "published" ? (
                <span className="text-xs text-zinc-500">임시 저장</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(post.published_at ?? post.updated_at)} · 조회 {post.view_count} · 좋아요{" "}
              {likeCount.get(post.id) ?? 0}
            </p>
            {post.excerpt ? <p className="mt-3 text-sm leading-6">{post.excerpt}</p> : null}
            {isOwner ? (
              <Link href={`${postPath(profile.username, post.slug)}/edit`} className="mt-3 inline-block text-sm underline">
                수정
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">블로그를 불러오는 중...</p>}>
        <AuthorBlog params={params} />
      </Suspense>
    </main>
  );
}
