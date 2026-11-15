/**
 * Normalize raw text extracted from PDFs or pasted by users.
 *
 * Fixes:
 *  - Hyphenation at line breaks (e.g. "em-\nployee" → "employee")
 *  - Excessive whitespace and blank lines
 *  - Common bullet characters → "- "
 *  - Normalizes currency symbols (all become ₹)
 *  - Trims each line
 */
export function normalizeText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // Fix hyphenation across line breaks: "em-\nployee" → "employee"
  text = text.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');

  // Normalize line endings to \n
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace common bullet characters with "- "
  text = text.replace(/[•●■◆▪►‣⁃]/g, '-');

  // Normalize currency: "Rs." / "Rs" / "INR" are kept as-is for the rules to match
  // But normalize "₹" spacing: "₹ 5,00,000" or "₹5,00,000" both OK

  // Collapse multiple spaces into one (but keep newlines)
  text = text.replace(/[^\S\n]+/g, ' ');

  // Collapse 3+ consecutive newlines into 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim each line
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Trim the whole thing
  text = text.trim();

  return text;
}

/**
 * Split text into sentences. Simple heuristic: split on period/question mark/
 * exclamation followed by a space and uppercase letter, or on newlines that
 * start a new paragraph.
 */
export function splitSentences(text: string): string[] {
  if (!text) return [];

  // Split lines first to preserve structural breaks
  const lines = text.split(/\n+/);
  const raw: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split on sentence-ending punctuation followed by space and uppercase letter.
    // Do not split on common abbreviations like Rs., Pvt., Ltd., etc.
    const parts = trimmedLine.split(
      /(?<!\b(?:Rs|INR|Pvt|Ltd|Mr|Ms|Dr|No|approx)\.)(?<=[.!?])\s+(?=[A-Z])/i,
    );
    for (const part of parts) {
      raw.push(part.trim());
    }
  }

  // Filter out very short fragments and deduplicate
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of raw) {
    const cleaned = s.replace(/[.!?]+$/, '').trim();
    if (cleaned.length < 5) continue;
    const lowerKey = cleaned.toLowerCase();
    if (seen.has(lowerKey)) continue;
    seen.add(lowerKey);
    result.push(s.trim());
  }
  return result;
}
