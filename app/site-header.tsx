import Link from "next/link";
import { connection } from "next/server";
import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { siteName } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/blog" className="font-semibold tracking-tight">
          {siteName}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/blog/new" className="underline">
            글쓰기
          </Link>
          {user ? (
            <>
              {profile ? (
                <Link href={`/blog/${profile.username}`} className="underline">
                  {profile.display_name}
                </Link>
              ) : null}
              <form action={signOut}>
                <button type="submit" className="underline">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <form action={signInWithGoogle}>
              <button type="submit" className="underline">
                로그인
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
