import Link from "next/link";
import { Suspense } from "react";
import { LandingAccount } from "@/app/landing-account";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; error?: string; code?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 px-6 py-20">
      <header className="flex max-w-xl flex-col gap-3">
        <p className="text-sm font-medium text-zinc-500">블로그</p>
        <h1 className="text-4xl font-semibold tracking-tight">구글 계정으로 시작하세요</h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          처음 로그인하면 회원가입이 되고, 이름과 프로필 사진으로 프로필이 만들어집니다. 이미
          계정이 있으면 같은 버튼으로 로그인됩니다.
        </p>
        <Link href="/blog" className="text-sm underline">
          블로그 글 보기
        </Link>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">계정 상태를 확인하는 중...</p>}>
        <LandingAccount searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
