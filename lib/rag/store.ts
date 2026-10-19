import { Pinecone, type Index, type IndexModel, type RecordMetadata } from "@pinecone-database/pinecone";

const EMBED_MODEL = "multilingual-e5-large";
const TEXT_FIELD = "chunk_text";
const NAMESPACE = "rules";
const UPSERT_BATCH = 20;

export type RagRecord = RecordMetadata & {
  chunk_text: string;
  title: string;
  path: string;
  source: string;
  page: string;
};

export type RagHit = {
  title: string;
  path: string;
  text: string;
  page: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) throw new Error(`${name}가 없습니다.`);
  return value;
}

export function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "요청에 실패했습니다.";
  return message.replace(/pcsk_[A-Za-z0-9_-]+/g, "[redacted]");
}

function pinecone() {
  return new Pinecone({ apiKey: requiredEnv("PINECONE_API_KEY") });
}

function indexName() {
  return requiredEnv("PINECONE_INDEX");
}

function missingIndex(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "PineconeNotFoundError" || /not found/i.test(error.message);
}

function assertTextField(model: IndexModel) {
  const field = model.schema?.fields?.[TEXT_FIELD];
  if (!field || !("type" in field) || field.type !== "semantic_text") {
    throw new Error(`${model.name} 인덱스의 통합 임베딩 필드가 ${TEXT_FIELD}가 아닙니다.`);
  }
}

export async function ensureIndex(): Promise<Index<RagRecord>> {
  const pc = pinecone();
  const name = indexName();
  let existing: IndexModel | null = null;
  try {
    existing = await pc.indexes.describe(name);
  } catch (error) {
    if (!missingIndex(error)) throw error;
  }
  if (!existing) {
    await pc.indexes.createForModel({
      name,
      cloud: requiredEnv("PINECONE_CLOUD"),
      region: requiredEnv("PINECONE_REGION"),
      embed: {
        model: EMBED_MODEL,
        fieldMap: { text: TEXT_FIELD },
      },
      waitUntilReady: true,
    });
    existing = await pc.indexes.describe(name);
  }
  assertTextField(existing);
  if (!existing.status.ready) {
    throw new Error(`${name} 인덱스가 아직 준비되지 않았습니다.`);
  }
  return pc.index<RagRecord>({ name, namespace: NAMESPACE });
}

export async function searchIndex(query: string): Promise<RagHit[]> {
  if (!process.env["PINECONE_API_KEY"]?.trim() || !process.env["PINECONE_INDEX"]?.trim()) return [];
  const index = pinecone().index<RagRecord>({ name: indexName(), namespace: NAMESPACE });
  const result = await index.searchRecords({
    query: { topK: 4, inputs: { text: query.slice(0, 500) } },
    fields: ["chunk_text", "title", "path", "page"],
  });
  return (result.result.hits ?? []).flatMap((hit) => {
    const fields = hit.fields as Partial<RagRecord>;
    if (typeof fields.chunk_text !== "string" || typeof fields.title !== "string" || typeof fields.path !== "string") {
      return [];
    }
    return [{
      title: fields.title,
      path: fields.path,
      text: fields.chunk_text,
      page: typeof fields.page === "string" ? fields.page : "",
    }];
  });
}

export async function upsertRecords(index: Index<RagRecord>, records: Array<{ _id: string } & RagRecord>) {
  for (let start = 0; start < records.length; start += UPSERT_BATCH) {
    await index.upsertRecords({ records: records.slice(start, start + UPSERT_BATCH) });
  }
}

export async function clearNamespace(index: Index<RagRecord>) {
  let token: string | undefined;
  do {
    const page = await index.listPaginated({ limit: 100, paginationToken: token }).catch(() => null);
    if (!page) return;
    const ids = (page.vectors ?? []).flatMap((vector) => (vector.id ? [vector.id] : []));
    if (ids.length > 0) await index.deleteMany({ ids });
    token = page.pagination?.next;
  } while (token);
}
