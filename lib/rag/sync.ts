import { splitText } from "@/lib/rag/chunks";
import { readRulePages } from "@/lib/rag/pdf";
import { clearNamespace, ensureIndex, upsertRecords, type RagRecord } from "@/lib/rag/store";

const SOURCE_PATH = "/catan-rules.pdf";
const SOURCE_TITLE = "카탄 규칙";

type RagUpsert = { _id: string } & RagRecord;

function pageRecords(page: string, pageNumber: number): RagUpsert[] {
  return splitText(page).map((text, index) => ({
    _id: `catan-${pageNumber}-${index}`,
    chunk_text: text,
    title: SOURCE_TITLE,
    path: SOURCE_PATH,
    source: "pdf",
    page: String(pageNumber),
  }));
}

export async function syncAll() {
  const pages = await readRulePages();
  const records = pages.flatMap((page, index) => pageRecords(page, index + 1));
  if (records.length === 0) throw new Error("PDF에서 읽을 텍스트가 없습니다.");
  const index = await ensureIndex();
  await clearNamespace(index);
  await upsertRecords(index, records);
  return { pages: pages.length, chunks: records.length };
}
