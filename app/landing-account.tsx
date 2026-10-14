import { connection } from "next/server";
import { redirect } from "next/navigation";
import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function LandingAccount({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; error?: string; code?: string }>;
}) {
  await connection();
  const { joined, error, code } = await searchParams;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }
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
  const profile = profileResult?.data;

  return (
    <section className="flex w-full max-w-md flex-col gap-4">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {user ? (
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              // Google profile photos are remote URLs that are not configured for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full" />
            ) : null}
            <div>
              <p className="font-medium">{profile?.display_name ?? user.email}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                @{profile?.username ?? "profile-missing"}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {joined === "1"
              ? "구글 계정으로 가입되었습니다. 프로필이 만들어졌습니다."
              : "이미 가입된 계정으로 로그인되어 있습니다."}
          </p>
          {!profile ? (
            <p className="text-sm text-red-700 dark:text-red-200">
              구글 계정은 연결되었지만 프로필을 만들지 못했습니다.
            </p>
          ) : null}
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
            Google로 시작하기
          </button>
        </form>
      )}
    </section>
  );
}
