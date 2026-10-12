import Link from "next/link";
import { MembersPanel } from "@/app/members-panel";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">회원 관리</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Server Actions로 members 테이블을 조회·추가·수정·삭제합니다.
        </p>
        <Link href="/login" className="text-sm underline">
          Google 로그인 테스트
        </Link>
      </header>
      <MembersPanel />
    </main>
  );
}
