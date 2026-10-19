import { GoogleGenAI } from "@google/genai";
import { chatbotSystemInstruction } from "@/lib/chatbot/prompt";
import { safeError, searchIndex } from "@/lib/rag/store";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 8;

function chatModel() {
  return process.env["CHAT_MODEL"]?.trim() ?? "";
}

type ChatTurn = { role: "user" | "assistant"; text: string };

function geminiKey() {
  return process.env["GEMINI_API_KEY"]?.trim() ?? "";
}

function asTurns(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is ChatTurn =>
        Boolean(item) &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.text === "string" &&
        item.text.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((item) => ({ role: item.role, text: item.text.trim().slice(0, MAX_MESSAGE_LENGTH) }));
}

export async function POST(request: Request) {
  const apiKey = geminiKey();
  const model = chatModel();
  if (!apiKey || !model) {
    return Response.json({ error: "챗봇을 아직 사용할 수 없습니다." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "질문을 보내지 못했습니다." }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const history =
    typeof body === "object" && body !== null && "history" in body ? asTurns(body.history) : [];

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "질문은 1자 이상 1000자 이하로 입력하세요." }, { status: 400 });
  }

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  let systemInstruction = chatbotSystemInstruction;
  try {
    const hits = await searchIndex(message);
    if (hits.length > 0) {
      const block = hits
        .map((hit, index) => {
          const place = hit.page ? `${hit.path} ${hit.page}쪽` : hit.path;
          return `${index + 1}. ${hit.title} (${place})\n${hit.text}`;
        })
        .join("\n\n");
      systemInstruction = `${chatbotSystemInstruction}\n\n검색된 자료:\n${block}`;
    }
  } catch (error) {
    console.error("rag", safeError(error));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 400,
      },
    });
    const reply = response.text?.trim();
    if (!reply) {
      return Response.json({ error: "답변을 만들지 못했습니다. 다시 질문해 주세요." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (error) {
    console.error("chatbot", error instanceof Error ? error.message : error);
    return Response.json({ error: "잠시 후 다시 질문해 주세요." }, { status: 502 });
  }
}
