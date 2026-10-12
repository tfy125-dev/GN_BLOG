import Link from "next/link";
import { signInWithGoogle } from "@/app/auth/actions";
import { MembersPanel } from "@/app/members-panel";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">회원 관리</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Server Actions로 members 테이블을 조회·추가·수정·삭제합니다.
        </p>
        <form action={signInWithGoogle} className="pt-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Google로 로그인
          </button>
        </form>
        <Link href="/login" className="text-sm underline">
          로그인 상태 보기
        </Link>
      </header>
      <MembersPanel />
    </main>
  );
}
