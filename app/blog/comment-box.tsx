"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment, removeComment } from "@/app/blog/actions";

export function CommentForm({ postId, loggedIn }: { postId: number; loggedIn: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return <p className="text-sm text-zinc-500">댓글은 로그인 후 작성할 수 있습니다.</p>;
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addComment(postId, body);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setBody("");
          router.refresh();
        });
      }}
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={4000}
        placeholder="댓글을 입력하세요"
        className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
      />
      {error ? <p className="text-sm text-red-700 dark:text-red-200">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        댓글 등록
      </button>
    </form>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await removeComment(commentId);
          if (result.ok) router.refresh();
        });
      }}
      className="text-xs text-zinc-500 underline"
    >
      삭제
    </button>
  );
}
