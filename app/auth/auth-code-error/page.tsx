import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">로그인에 실패했습니다</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Google에서 돌아온 인증 코드를 세션으로 바꾸지 못했습니다. Supabase의 Redirect URL에
        이 앱의 콜백 주소가 들어 있는지 확인해 주세요.
      </p>
      <Link href="/" className="text-sm underline">
        처음 화면으로 돌아가기
      </Link>
    </main>
  );
}
