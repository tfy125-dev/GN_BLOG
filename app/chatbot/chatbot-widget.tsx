"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const welcome: ChatMessage = {
  role: "assistant",
  text: "동네 공공서비스를 연결하는 블로그입니다. 글쓰기, 로그인, 팔로우, 댓글, 좋아요 이용 방법을 물어보세요.",
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setPending(true);
    try {
      const history = nextMessages
        .slice(1, -1)
        .filter((item) => item.text.trim().length > 0)
        .map((item) => ({ role: item.role, text: item.text }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: data.error ?? "답변을 받지 못했습니다." },
        ]);
        return;
      }
      setMessages((current) => [...current, { role: "assistant", text: data.reply ?? "" }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "연결에 실패했습니다. 다시 질문해 주세요." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3">
      {open ? (
        <section className="flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">이용 안내</h2>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 underline">
              닫기
            </button>
          </header>
          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "self-start bg-zinc-100 dark:bg-zinc-900"
                }`}
              >
                {message.text}
              </p>
            ))}
            {pending ? <p className="text-xs text-zinc-500">답변을 작성하는 중...</p> : null}
          </div>
          <form
            className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="chatbot-input">
              질문
            </label>
            <input
              id="chatbot-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="이용 방법을 질문하세요"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              보내기
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="h-14 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
      >
        {open ? "닫기" : "도움말"}
      </button>
    </div>
  );
}
