"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePost } from "@/app/blog/actions";
import { slugify } from "@/lib/blog/content";
import type { Json } from "@/lib/supabase/database.types";

type PostEditorProps = {
  postId?: number;
  initialTitle?: string;
  initialSlug?: string;
  initialContent?: Json;
  initialStatus?: string;
};

export function PostEditor({
  postId,
  initialTitle = "",
  initialSlug = "",
  initialContent,
  initialStatus = "draft",
}: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "본문을 입력하세요" }),
    ],
    content: (initialContent as JSONContent | undefined) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: { class: "rich-text min-h-64 px-4 py-3 focus:outline-none" },
    },
  });

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("링크 주소", previous || "https://");
    if (next === null) return;
    if (next.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: next.trim() }).run();
  }

  function save(publish: boolean) {
    if (!editor) return;
    setError(null);
    startTransition(async () => {
      const result = await savePost({
        id: postId,
        title,
        slug,
        content: editor.getJSON() as Json,
        publish,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.path);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        제목
        <input
          value={title}
          onChange={(event) => updateTitle(event.target.value)}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base dark:border-zinc-700"
          maxLength={200}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        주소
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          placeholder="영어 소문자와 하이픈"
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>
      <div className="overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
          <ToolbarButton label="굵게" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
          <ToolbarButton label="기울임" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
          <ToolbarButton label="제목" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolbarButton label="소제목" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
          <ToolbarButton label="목록" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="번호" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton label="인용" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
          <ToolbarButton label="코드" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
          <ToolbarButton label="링크" active={editor?.isActive("link")} onClick={setLink} />
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => save(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
        >
          임시 저장
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => save(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {initialStatus === "published" ? "수정 발행" : "발행하기"}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${active ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
    >
      {label}
    </button>
  );
}
