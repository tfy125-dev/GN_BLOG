import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { signInWithGoogle } from "@/app/auth/actions";
import { PostEditor } from "@/app/blog/post-editor";
import { createClient } from "@/lib/supabase/server";

async function EditPost({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  await connection();
  const { username, slug } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">수정하려면 로그인해 주세요.</p>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Google로 시작하기
          </button>
        </form>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, slug, content_json, status")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!post) notFound();

  return (
    <PostEditor
      postId={post.id}
      initialTitle={post.title}
      initialSlug={post.slug}
      initialContent={post.content_json}
      initialStatus={post.status}
    />
  );
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">글 수정</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">글을 불러오는 중...</p>}>
        <EditPost params={params} />
      </Suspense>
    </main>
  );
}
