import { syncAll } from "../lib/rag/sync";
import { safeError, searchIndex } from "../lib/rag/store";

async function main() {
  const result = await syncAll();
  console.log(`indexed pages=${result.pages} chunks=${result.chunks}`);
  const hits = await searchIndex("마을을 건설하려면 어떤 자원이 필요한가요?");
  console.log(hits.map((hit) => `${hit.title} ${hit.path} p${hit.page}`).join("\n") || "no hits");
}

main().catch((error) => {
  console.error(safeError(error));
  process.exit(1);
});
