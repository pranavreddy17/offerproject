/**
 * CTC Breakdown Module
 *
 * Extracts CTC components from offer letter text and calculates:
 * - Fixed vs variable vs conditional percentages
 * - Guaranteed annual amount (fixed only)
 * - Rough monthly in-hand estimate (simplified)
 * - Worst-case exit cost without double-counting overlapping obligations
 */
import type { CtcBreakdown, Finding } from './types';
import { findMoneyAmounts } from './money';

/** Patterns to extract CTC components from text */
const CTC_PATTERNS = {
  totalCtc: [
    /(?:total\s+)?(?:ctc|cost\s+to\s+company|annual\s+(?:ctc|compensation|package))(?:\s*\([^)]*\))?\s*(?:of|is|shall\s+be|will\s+be|:|-|–)?\s*(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr|lpa|per\s+annum)?\s*(?:\([^)]*\))?\s*(?:\/-)?/gi,
    /(?:₹|Rs\.?\s*|INR\s*)[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr|lpa|per\s+annum)\s*(?:ctc|cost\s+to\s+company|per\s+annum)/gi,
    /(?:ctc|cost\s+to\s+company)(?:\s*\([^)]*\))?\s+(?:of|is|shall\s+be|will\s+be)\s+(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|crore|crores|cr|lpa|per\s+annum)?\s*(?:\([^)]*\))?\s*(?:\/-)?/gi,
  ],
  fixed: [
    /(?:fixed\s+(?:pay|salary|component|compensation)|basic\s+(?:pay|salary))(?:\s*\([^)]*\))?\s*(?:of|is|:|-|–)?\s*(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|lpa)?/gi,
  ],
  variable: [
    /(?:variable\s+(?:pay|component|compensation)|performance\s+(?:bonus|incentive))(?:\s*\([^)]*\))?\s*(?:of|is|:|-|–)?\s*(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|lpa)?/gi,
  ],
  joiningBonus: [
    /(?:joining\s+bonus|sign[- ]?on\s+bonus)(?:\s*\([^)]*\))?\s*(?:of|is|:|-|–)?\s*(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs|lpa)?/gi,
  ],
};

/** Try to extract a money amount from text using given patterns */
function extractAmount(
  text: string,
  patterns: RegExp[],
): number | null {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const amounts = findMoneyAmounts(match[0]);
      if (amounts.length > 0) {
        return amounts[0].value;
      }
    }
  }
  return null;
}

/** Extract CTC components from raw text */
export function extractCtcFromText(text: string): {
  totalCtc: number | null;
  fixed: number | null;
  variable: number | null;
  joiningBonus: number | null;
} {
  return {
    totalCtc: extractAmount(text, CTC_PATTERNS.totalCtc),
    fixed: extractAmount(text, CTC_PATTERNS.fixed),
    variable: extractAmount(text, CTC_PATTERNS.variable),
    joiningBonus: extractAmount(text, CTC_PATTERNS.joiningBonus),
  };
}

/**
 * Calculate the CTC breakdown from user-provided or extracted values.
 *
 * SIMPLIFIED TAX ASSUMPTION:
 * For rough monthly take-home, we assume ~25% total deductions (PF, standard tax, professional tax)
 * for typical Indian entry-level engineering packages.
 *
 * DEDUPLICATION FOR EXIT LIABILITIES:
 * When training cost recovery and service bond share the same amount or sentence,
 * we deduplicate to avoid overstating the exit financial exposure.
 */
export function calculateCtcBreakdown(
  rawTotalCtc: number,
  rawFixed: number,
  rawVariable: number,
  rawJoiningBonus: number,
  rawOtherConditional: number,
  findings: Finding[],
): CtcBreakdown {
  // Sanitize numerical inputs (guard against negative or NaN inputs)
  const totalCtc = Math.max(0, isNaN(rawTotalCtc) ? 0 : rawTotalCtc);
  const fixed = Math.max(0, isNaN(rawFixed) ? 0 : rawFixed);
  const variable = Math.max(0, isNaN(rawVariable) ? 0 : rawVariable);
  const joiningBonus = Math.max(0, isNaN(rawJoiningBonus) ? 0 : rawJoiningBonus);
  const otherConditional = Math.max(0, isNaN(rawOtherConditional) ? 0 : rawOtherConditional);

  // Guaranteed annual compensation is strictly fixed pay
  const guaranteedAnnual = fixed;

  // Simplified monthly in-hand: fixed / 12 * 0.75 (approx 25% statutory deductions)
  const estimatedMonthlyInHand = fixed > 0 ? Math.round((fixed / 12) * 0.75) : 0;

  // Worst-case exit cost: sum bond, clawback, and training cost liabilities
  // Deduplicate overlapping obligations on the exact same sentence or identical amounts
  const exitFindings = findings.filter(
    (f) =>
      (f.type === 'bond' || f.type === 'clawback' || f.type === 'trainingCost') &&
      f.extracted?.amount &&
      f.extracted.amount > 0,
  );

  let worstCaseExitCost = 0;
  const processedKeys = new Set<string>();

  for (const f of exitFindings) {
    const amt = f.extracted?.amount ?? 0;
    // Key by sentence to prevent double counting if two rules match the same sentence
    const sentenceKey = f.matchedText.trim().toLowerCase();
    if (processedKeys.has(sentenceKey)) {
      continue;
    }
    processedKeys.add(sentenceKey);
    worstCaseExitCost += amt;
  }

  // Calculate percentages based on effective components
  const componentSum = fixed + variable + joiningBonus + otherConditional;
  const denominator = totalCtc > 0 ? totalCtc : componentSum;

  const fixedPercent = denominator > 0 ? Math.round((fixed / denominator) * 100) : 0;
  const variablePercent = denominator > 0 ? Math.round((variable / denominator) * 100) : 0;
  const conditionalPercent =
    denominator > 0 ? Math.round(((joiningBonus + otherConditional) / denominator) * 100) : 0;

  return {
    totalCtc,
    fixed,
    variable,
    joiningBonus,
    otherConditional,
    guaranteedAnnual,
    estimatedMonthlyInHand,
    worstCaseExitCost,
    fixedPercent,
    variablePercent,
    conditionalPercent,
  };
}
