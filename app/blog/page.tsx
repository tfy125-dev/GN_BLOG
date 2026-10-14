import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { formatDate, postPath } from "@/lib/blog/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "글",
  description: "회원들이 발행한 글을 모았습니다.",
};

type Author = {
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function authorOf(value: Author | Author[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function Feed() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, published_at, view_count, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const posts = data ?? [];
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 dark:border-zinc-700">
        <p className="text-base font-medium">아직 발행된 글이 없습니다.</p>
        <Link
          href="/blog/new"
          className="mt-5 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          글 쓰기
        </Link>
      </div>
    );
  }

  const ids = posts.map((post) => post.id);
  const { data: likes } = await supabase.from("post_likes").select("post_id").in("post_id", ids);
  const likeCount = new Map<number, number>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
  }

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => {
        const author = authorOf(post.author as Author | Author[] | null);
        if (!author) return null;
        return (
          <li key={post.id} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <Link href={postPath(author.username, post.slug)} className="text-xl font-semibold tracking-tight">
              {post.title}
            </Link>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href={`/blog/${author.username}`} className="underline">
                {author.display_name}
              </Link>
              {" · "}
              {formatDate(post.published_at)}
              {" · 조회 "}
              {post.view_count}
              {" · 좋아요 "}
              {likeCount.get(post.id) ?? 0}
            </p>
            {post.excerpt ? <p className="mt-3 text-sm leading-6">{post.excerpt}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function BlogPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">글</h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          회원별 글을 읽고, 팔로우하고, 댓글과 좋아요를 남길 수 있습니다.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">글을 불러오는 중...</p>}>
        <Feed />
      </Suspense>
    </main>
  );
}
