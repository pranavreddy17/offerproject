/**
 * Parse Indian-format money strings into plain numbers.
 *
 * Handles formats like:
 *   "₹2,00,000"      → 200000
 *   "Rs. 2 lakh"     → 200000
 *   "INR 2,00,000/-" → 200000
 *   "2 LPA"          → 200000
 *   "12 LPA"         → 1200000
 *   "1.5 crore"      → 15000000
 *   "Rs 50000"       → 50000
 *   "3,00,000"       → 300000
 *   "₹ 1,00,000/-"   → 100000
 */

/** Remove currency symbols, commas, spaces around numbers, trailing /- */
function cleanMoneyString(raw: string): string {
  return raw
    .replace(/₹|Rs\.?|INR/gi, '') // remove currency prefixes
    .replace(/\/-/g, '')          // remove trailing /-
    .replace(/,/g, '')            // remove commas
    .trim();
}

/**
 * Parse a single money string into a number. Returns null if unparseable.
 *
 * Supports:
 *  - Plain numbers: "200000", "2,00,000"
 *  - Lakh/crore words: "2 lakh", "1.5 crore", "2 lakhs", "2.5 lacs"
 *  - LPA (Lakhs Per Annum): "12 LPA", "3.5 lpa"
 *  - Currency-prefixed: "₹2,00,000", "Rs. 2 lakh", "INR 200000/-"
 */
export function parseMoney(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null;

  const cleaned = cleanMoneyString(raw);
  if (!cleaned) return null;

  // Try "X LPA" pattern first (Lakhs Per Annum)
  const lpaMatch = cleaned.match(/^([\d.]+)\s*lpa$/i);
  if (lpaMatch) {
    const value = parseFloat(lpaMatch[1]);
    return isNaN(value) ? null : Math.round(value * 100000);
  }

  // Try "X lakh(s)" or "X lac(s)" pattern
  const lakhMatch = cleaned.match(/^([\d.]+)\s*(?:lakh|lac|lakhs|lacs)$/i);
  if (lakhMatch) {
    const value = parseFloat(lakhMatch[1]);
    return isNaN(value) ? null : Math.round(value * 100000);
  }

  // Try "X crore(s)" pattern
  const croreMatch = cleaned.match(/^([\d.]+)\s*(?:crore|crores|cr)$/i);
  if (croreMatch) {
    const value = parseFloat(croreMatch[1]);
    return isNaN(value) ? null : Math.round(value * 10000000);
  }

  // Plain number
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Find all genuine money amounts in a block of text.
 * Strictly avoids mistaking duration numbers (e.g. "24 months", "2 years")
 * or bare numbers without currency context or Indian denominations.
 *
 * Returns an array of { raw, value } objects.
 */
export function findMoneyAmounts(
  text: string,
): Array<{ raw: string; value: number }> {
  const results: Array<{ raw: string; value: number }> = [];
  if (!text || typeof text !== 'string') return results;

  // Matches money representations:
  // 1. Explicit currency symbol or code: (₹|Rs.|INR)\s*[\d,]+(?:\.\d+)?...
  // 2. Denomination words: [\d,]+(?:\.\d+)?\s*(?:lakh|lac|lakhs|lacs|crore|crores|cr|lpa)
  // 3. Indian comma format numbers (at least 4 digits, e.g. 50,000 or 1,00,000) optionally followed by /-
  // Crucially, does NOT match bare digits followed by duration words (years/months/days)
  const moneyPattern =
    /(?:(?:₹|Rs\.?\s*|INR\s*)\s*[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr|lpa)?(?:\s*\/-)?)|(?:[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr|lpa))|(?:(?:₹|Rs\.?\s*|INR\s*)?\s*\b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?(?:\s*\/-)?)/gi;

  const matches = text.match(moneyPattern);
  if (!matches) return results;

  for (const raw of matches) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check if this match is immediately followed by a duration unit in the source text
    // E.g. "24 months" should NEVER be parsed as 24 rupees.
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const durationFollowPattern = new RegExp(
      `${escaped}\\s*(?:years?|months?|days?|weeks?|hrs?|hours?)`,
      'i',
    );
    if (durationFollowPattern.test(text)) {
      continue;
    }

    const value = parseMoney(trimmed);
    if (value !== null && value > 0) {
      results.push({ raw: trimmed, value });
    }
  }

  return results;
}

/**
 * Parse a duration string like "2 years", "18 months", "1 year" into months.
 * Returns null if unparseable.
 */
export function parseDurationMonths(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null;

  const cleaned = raw.trim().toLowerCase();

  // "X year(s)" → months
  const yearMatch = cleaned.match(/([\d.]+)\s*years?/);
  if (yearMatch) {
    const years = parseFloat(yearMatch[1]);
    return isNaN(years) ? null : Math.round(years * 12);
  }

  // "X month(s)"
  const monthMatch = cleaned.match(/([\d.]+)\s*months?/);
  if (monthMatch) {
    const months = parseFloat(monthMatch[1]);
    return isNaN(months) ? null : Math.round(months);
  }

  // "X day(s)" → approximate months
  const dayMatch = cleaned.match(/([\d.]+)\s*days?/);
  if (dayMatch) {
    const days = parseFloat(dayMatch[1]);
    return isNaN(days) ? null : Math.round(days / 30);
  }

  return null;
}
