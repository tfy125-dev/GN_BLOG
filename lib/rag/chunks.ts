const CHUNK_SIZE = 420;

function startsSection(sentence: string) {
  return /^[a-d]\)\s/.test(sentence) || /^\d+\.\s/.test(sentence);
}

function hardSplit(value: string) {
  const parts: string[] = [];
  for (let start = 0; start < value.length; start += CHUNK_SIZE) {
    parts.push(value.slice(start, start + CHUNK_SIZE));
  }
  return parts;
}

export function splitText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean
    .split(/(?<=다\.)\s+|(?<=요\.)\s+|(?=•)|(?=\s[a-d]\)\s)/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentences.length === 0) return [];

  const parts: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > CHUNK_SIZE) {
      if (current) parts.push(current);
      parts.push(...hardSplit(sentence));
      current = "";
      continue;
    }
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && (startsSection(sentence) || next.length > CHUNK_SIZE)) {
      parts.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}
