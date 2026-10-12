import { Suspense } from "react";
import { LoginPanel } from "@/app/login/login-panel";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Google 로그인</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          처음 로그인하면 계정이 만들어지고 프로필이 함께 생성됩니다.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">로그인 상태를 확인하는 중...</p>}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
