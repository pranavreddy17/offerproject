/**
 * Rule: Service Bond / Minimum Service Agreement
 *
 * Detects clauses requiring the employee to serve a minimum period
 * or pay liquidated damages if they leave early.
 * Distinguishes between genuine financial/contractual bonds vs negated clauses ("no bond applies").
 */
import type { Finding } from '../types';
import { parseDurationMonths, findMoneyAmounts } from '../money';
import { splitSentences } from '../normalize';

const BOND_PATTERNS = [
  /service\s+(?:agreement|bond)/i,
  /minimum\s+service\s+(?:period|commitment|tenure)/i,
  /(?:serve|stay|remain|continue)\s+(?:for|with)\s+(?:a\s+(?:minimum|period)\s+of\s+)?(\d+)\s*(months?|years?)/i,
  /bond\s+(?:period|amount|of)/i,
  /liquidated\s+damages/i,
  /(?:pay|reimburse|refund).*(?:if\s+you\s+leave|before\s+completion|early\s+exit|prior\s+to)/i,
  /(?:obligated|required)\s+to\s+(?:serve|work)\s+for/i,
  /employment\s+bond/i,
  /lock[- ]?in\s+period/i,
];

/** Negation patterns to prevent false positives when text says "no bond" */
const BOND_NEGATION_PATTERNS = [
  /no\s+(?:service\s+)?(?:bond|agreement|lock[- ]?in)/i,
  /(?:not|never|neither)\s+(?:required|subject|obligated)\s+to\s+(?:sign|serve|pay)\s+(?:any\s+)?(?:bond|service)/i,
  /without\s+(?:any\s+)?(?:bond|lock[- ]?in|minimum\s+service)/i,
  /no\s+minimum\s+service\s+(?:period|commitment)/i,
];

/** Duration pattern inside a sentence */
const DURATION_PATTERN =
  /(\d+(?:\.\d+)?)\s*(years?|months?|days?)/gi;

export function detectBond(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  for (const sentence of sentences) {
    // Check if this sentence negates any bond
    const isNegated = BOND_NEGATION_PATTERNS.some((neg) => neg.test(sentence));
    if (isNegated) continue;

    // Check if any bond pattern matches this sentence
    const isMatch = BOND_PATTERNS.some((pattern) => pattern.test(sentence));
    if (!isMatch) continue;

    // Prevent duplicate findings for the same sentence
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    // Extract amount
    const amounts = findMoneyAmounts(sentence);
    const amount = amounts.length > 0 ? amounts[0].value : undefined;

    // Extract duration
    let durationMonths: number | null = null;
    const durationMatches = sentence.match(DURATION_PATTERN);
    if (durationMatches) {
      durationMonths = parseDurationMonths(durationMatches[0]);
    }

    // Determine severity
    let severity: Finding['severity'] = 'low';
    if (
      (amount !== undefined && amount >= 100000) ||
      (durationMonths !== null && durationMonths >= 24)
    ) {
      severity = 'high';
    } else if (
      (amount !== undefined && amount > 0) ||
      (durationMonths !== null && durationMonths > 0)
    ) {
      severity = 'medium';
    }

    counter++;
    findings.push({
      id: `bond-${counter}`,
      type: 'bond',
      severity,
      title:
        severity === 'high'
          ? 'Significant Service Bond'
          : severity === 'medium'
            ? 'Service Bond Clause'
            : 'Service Bond Mention',
      matchedText: sentence,
      explanation:
        severity === 'high'
          ? `This clause requires you to stay for ${durationMonths ? durationMonths + ' months' : 'a set period'} or pay ${amount ? '₹' + amount.toLocaleString('en-IN') : 'a penalty'}. This is a significant financial commitment — if you leave early, you may owe this amount.`
          : severity === 'medium'
            ? `A service commitment or bond is mentioned (${durationMonths ? durationMonths + ' months' : 'specified tenure'}${amount ? ', ₹' + amount.toLocaleString('en-IN') : ''}). Review the terms carefully.`
            : `The letter mentions a service-related commitment. Read the surrounding context to understand if a bond or lock-in applies.`,
      questionForHR:
        'What is the exact bond amount and duration? What happens if I receive higher education admission or another opportunity?',
      extracted: {
        amount,
        durationMonths: durationMonths ?? undefined,
      },
    });
  }

  return findings;
}
