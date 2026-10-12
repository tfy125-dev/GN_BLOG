"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createMember,
  deleteMember,
  getMembers,
  updateMember,
  type Member,
} from "@/app/actions/members";

type Draft = { email: string; name: string };

const emptyDraft: Draft = { email: "", name: "" };

function formatJoinedAt(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

export function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMembers() {
    startTransition(async () => {
      const result = await getMembers();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setMembers(result.data);
    });
  }

  useEffect(() => {
    startTransition(async () => {
      const result = await getMembers();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMembers(result.data);
    });
  }, []);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createMember(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(emptyDraft);
      setError(null);
      setMessage(`회원이 추가되었습니다. (id: ${result.data.id})`);
      loadMembers();
    });
  }

  function handleUpdate(id: number) {
    startTransition(async () => {
      const result = await updateMember(id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      setDraft(emptyDraft);
      setError(null);
      setMessage(`회원 ${id}번이 수정되었습니다.`);
      loadMembers();
    });
  }

  function handleDelete(id: number) {
    if (!confirm(`회원 ${id}번을 삭제할까요?`)) return;
    startTransition(async () => {
      const result = await deleteMember(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft);
      }
      setError(null);
      setMessage(`회원 ${id}번이 삭제되었습니다.`);
      loadMembers();
    });
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    setDraft({ email: member.email, name: member.name });
    setMessage(null);
    setError(null);
  }

  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-lg font-semibold">
          {editingId ? `회원 수정 (#${editingId})` : "회원 추가"}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          이메일
          <input
            type="email"
            required
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          이름
          <input
            type="text"
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div className="flex gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleUpdate(editingId)}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                수정 저장
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyDraft);
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                취소
              </button>
            </>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              추가
            </button>
          )}
        </div>
      </form>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">이메일</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">가입날짜</th>
              <th className="px-3 py-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                  {pending ? "불러오는 중..." : "회원이 없습니다."}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2">{member.id}</td>
                  <td className="px-3 py-2">{member.email}</td>
                  <td className="px-3 py-2">{member.name}</td>
                  <td className="px-3 py-2">{formatJoinedAt(member.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startEdit(member)}
                        className="text-sm underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(member.id)}
                        className="text-sm text-red-600 underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
