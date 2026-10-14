import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

export const postExtensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
    },
  }),
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isDoc(value: unknown): value is JSONContent {
  return Boolean(value) && typeof value === "object" && (value as { type?: unknown }).type === "doc";
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return SLUG_PATTERN.test(slug) ? slug : "";
}

export function isValidSlug(value: string) {
  return SLUG_PATTERN.test(value) && value.length <= 80;
}

function sanitizeNode(node: JSONContent): JSONContent {
  const next: JSONContent = { ...node };
  if (Array.isArray(next.marks)) {
    next.marks = next.marks.flatMap((mark) => {
      if (mark.type !== "link") return [mark];
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      if (!/^https?:\/\//i.test(href)) return [];
      return [{ ...mark, attrs: { ...mark.attrs, href, target: "_blank", rel: "noopener noreferrer" } }];
    });
  }
  if (Array.isArray(next.content)) {
    next.content = next.content.map((child) => sanitizeNode(child));
  }
  return next;
}

export function sanitizeDoc(doc: JSONContent) {
  return sanitizeNode(doc);
}

export function plainText(doc: JSONContent): string {
  if (doc.type === "text" && typeof doc.text === "string") return doc.text;
  const children = Array.isArray(doc.content) ? doc.content.map((child) => plainText(child)).join("") : "";
  if (doc.type === "hardBreak") return "\n";
  if (doc.type === "paragraph" || doc.type === "heading" || doc.type === "blockquote" || doc.type === "listItem") {
    return `${children}\n`;
  }
  return children;
}

export function headingOutline(doc: JSONContent) {
  const outline: { level: number; text: string }[] = [];
  const visit = (node: JSONContent) => {
    if (node.type === "heading") {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const text = plainText(node).trim();
      if (text) outline.push({ level, text });
    }
    node.content?.forEach(visit);
  };
  visit(doc);
  return outline;
}

export function preparedContent(doc: JSONContent) {
  const safe = sanitizeDoc(doc);
  const text = plainText(safe).replace(/\n{3,}/g, "\n\n").trim();
  const compactLength = text.replace(/\s+/g, "").length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 180);
  return {
    content_json: safe,
    content_html: generateHTML(safe, postExtensions),
    content_text: text,
    excerpt: excerpt || null,
    word_count: compactLength === 0 ? 0 : Math.max(words, 1),
    reading_time_minutes: compactLength === 0 ? 0 : Math.max(1, Math.ceil(compactLength / 500)),
    heading_outline: headingOutline(safe),
    meta_description: excerpt.slice(0, 160) || null,
  };
}

export function renderPostHtml(value: unknown) {
  if (!isDoc(value)) return "";
  return generateHTML(sanitizeDoc(value), postExtensions);
}

export function postPath(username: string, slug: string) {
  return `/blog/${username}/${slug}`;
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}
