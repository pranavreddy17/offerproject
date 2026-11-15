/**
 * Rule: Joining Bonus / Relocation Clawback
 *
 * Detects clauses where joining bonuses or relocation allowances must be
 * repaid if the employee leaves within a certain window.
 * IMPORTANT: A mere bonus mention without repayment terms is classified as informational/check-conditions,
 * and only active repayment/refund conditions trigger a clawback risk finding.
 */
import type { Finding } from '../types';
import { findMoneyAmounts, parseDurationMonths } from '../money';
import { splitSentences } from '../normalize';

const CLAWBACK_PATTERNS = [
  /joining\s+bonus/i,
  /sign[- ]?on\s+bonus/i,
  /relocation\s+(?:allowance|bonus|assistance|benefit)/i,
  /(?:repay|refund|return|recover|clawback|claw\s+back|reimburse)\s+(?:the\s+)?(?:joining|sign[- ]?on|relocation|bonus)/i,
  /(?:joining|sign[- ]?on|relocation|bonus)\s+(?:shall|will|must|has\s+to)\s+be\s+(?:repaid|refunded|returned|recovered)/i,
  /(?:pro[- ]?rat(?:a|ed)|proportionate)\s+(?:recovery|refund|repayment)/i,
];

const REPAYMENT_PATTERNS = [
  /repay|repaid|refund|refunded|return|returned|recover|recovered|clawback|claw\s+back|reimburse|reimbursed|pro[- ]?rat/i,
  /subject\s+to\s+recovery/i,
  /payable\s+back/i,
];

const DURATION_PATTERN = /(\d+(?:\.\d+)?)\s*(years?|months?|days?)/gi;

export function detectClawback(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  for (const sentence of sentences) {
    const isMatch = CLAWBACK_PATTERNS.some((p) => p.test(sentence));
    if (!isMatch) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    // Extract amount
    const amounts = findMoneyAmounts(sentence);
    const amount = amounts.length > 0 ? amounts[0].value : undefined;

    // Extract window
    let durationMonths: number | null = null;
    const durationMatches = sentence.match(DURATION_PATTERN);
    if (durationMatches) {
      durationMonths = parseDurationMonths(durationMatches[0]);
    }

    // Check if this sentence establishes a genuine repayment obligation
    const isRepayment = REPAYMENT_PATTERNS.some((p) => p.test(sentence));

    // Severity: high if large amount (>=2L) or long window (>=24m) WITH repayment;
    // medium if repayment required; low if just an informative bonus mention without repayment
    let severity: Finding['severity'] = 'low';
    if (isRepayment) {
      if (
        (amount !== undefined && amount >= 200000) ||
        (durationMonths !== null && durationMonths >= 24)
      ) {
        severity = 'high';
      } else {
        severity = 'medium';
      }
    }

    counter++;
    findings.push({
      id: `clawback-${counter}`,
      type: 'clawback',
      severity,
      title: isRepayment
        ? 'Bonus/Relocation Clawback'
        : 'Joining Bonus (No Repayment Condition Mentioned)',
      matchedText: sentence,
      explanation: isRepayment
        ? `If you leave within ${durationMonths ? durationMonths + ' months' : 'the specified window'}, you must repay ${amount ? '₹' + amount.toLocaleString('en-IN') : 'the bonus/relocation amount'}. This creates a financial liability upon early departure.`
        : `A joining bonus or relocation assistance is mentioned without an explicit repayment penalty in this sentence. Check other sections or ask HR to confirm whether any retention period or repayment applies.`,
      questionForHR: isRepayment
        ? 'Is the clawback amount pro-rated based on months served, or is the full amount recovered on exit?'
        : 'Are there any clawback or repayment conditions attached to this joining bonus if I resign early?',
      extracted: {
        // Only associate the amount as an exit liability if repayment is required
        amount: isRepayment ? amount : undefined,
        durationMonths: durationMonths ?? undefined,
      },
    });
  }

  return findings;
}
