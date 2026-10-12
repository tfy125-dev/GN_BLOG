import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function LoginPanel({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const profileResult = user
    ? await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {user ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {profileResult?.data?.avatar_url ? (
              // Google profile photos are remote URLs that are not configured for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileResult.data.avatar_url}
                alt=""
                className="h-12 w-12 rounded-full"
              />
            ) : null}
            <div>
              <p className="font-medium">
                {profileResult?.data?.display_name ?? user.email}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                @{profileResult?.data?.username ?? "profile-missing"}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
            <dt className="text-zinc-500">이메일</dt>
            <dd>{user.email}</dd>
            <dt className="text-zinc-500">사용자 ID</dt>
            <dd className="break-all">{user.id}</dd>
          </dl>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              로그아웃
            </button>
          </form>
        </div>
      ) : (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Google로 계속하기
          </button>
        </form>
      )}
    </section>
  );
}
