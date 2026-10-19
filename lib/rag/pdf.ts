import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";

const PDF_PATH = path.join(process.cwd(), "public", "catan-rules.pdf");

export async function readRulePages() {
  const bytes = new Uint8Array(await readFile(PDF_PATH));
  const pdf = await getDocumentProxy(bytes);
  const extracted = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(extracted.text) ? extracted.text : [extracted.text];
  return pages.map((page) => page.replace(/\s+/g, " ").trim()).filter((page) => page.length > 0);
}
