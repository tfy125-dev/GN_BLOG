"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/blog/actions";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  loggedIn,
}: {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  loggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending || !loggedIn}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleLike(postId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setLiked(result.data.liked);
            setCount((current) => current + (result.data.liked ? 1 : -1));
          });
        }}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
      >
        {liked ? "좋아요 취소" : "좋아요"} {count}
      </button>
      {!loggedIn ? <p className="text-xs text-zinc-500">좋아요는 로그인 후 누를 수 있습니다.</p> : null}
      {error ? <p className="text-sm text-red-700 dark:text-red-200">{error}</p> : null}
    </div>
  );
}
