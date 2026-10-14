import { Suspense } from "react";
import { connection } from "next/server";
import { signInWithGoogle } from "@/app/auth/actions";
import { PostEditor } from "@/app/blog/post-editor";
import { createClient } from "@/lib/supabase/server";

async function NewPost() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">글을 쓰려면 구글 로그인이 필요합니다.</p>
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

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    return <p className="text-sm text-red-700">프로필이 없어 글을 저장할 수 없습니다. 다시 로그인해 주세요.</p>;
  }

  return <PostEditor />;
}

export default function NewPostPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">새 글</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">에디터를 준비하는 중...</p>}>
        <NewPost />
      </Suspense>
    </main>
  );
}
