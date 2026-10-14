"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/blog/actions";

export function FollowButton({
  username,
  initialFollowing,
  loggedIn,
}: {
  username: string;
  initialFollowing: boolean;
  loggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return <p className="text-sm text-zinc-500">팔로우는 로그인 후 사용할 수 있습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleFollow(username);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setFollowing(result.data.following);
          });
        }}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
      >
        {following ? "팔로잉" : "팔로우"}
      </button>
      {error ? <p className="text-sm text-red-700 dark:text-red-200">{error}</p> : null}
    </div>
  );
}
