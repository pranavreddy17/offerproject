/**
 * Rule: Training Cost Recovery
 *
 * Detects clauses where the employer can recover training costs
 * if the employee leaves within a certain period.
 */
import type { Finding } from '../types';
import { findMoneyAmounts, parseDurationMonths } from '../money';
import { splitSentences } from '../normalize';

const TRAINING_PATTERNS = [
  /training\s+cost/i,
  /training\s+expense/i,
  /(?:recover|reimburse|repay|refund)\s+(?:the\s+)?training/i,
  /training\s+(?:shall|will|must)\s+be\s+(?:recovered|reimbursed|repaid|refunded)/i,
  /cost\s+of\s+training/i,
  /training\s+(?:fee|investment|expenditure)/i,
  /(?:certif(?:ication|icate)|course)\s+(?:cost|fee|expense).*(?:recover|reimburse|repay)/i,
];

const DURATION_PATTERN = /(\d+(?:\.\d+)?)\s*(years?|months?|days?)/gi;

export function detectTrainingCost(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  for (const sentence of sentences) {
    const isMatch = TRAINING_PATTERNS.some((p) => p.test(sentence));
    if (!isMatch) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    const amounts = findMoneyAmounts(sentence);
    const amount = amounts.length > 0 ? amounts[0].value : undefined;

    let durationMonths: number | null = null;
    const durationMatch = sentence.match(DURATION_PATTERN);
    if (durationMatch) {
      durationMonths = parseDurationMonths(durationMatch[0]);
    }

    // Severity by amount and duration
    let severity: Finding['severity'] = 'low';
    if (
      (amount !== undefined && amount >= 200000) ||
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
      id: `trainingCost-${counter}`,
      type: 'trainingCost',
      severity,
      title:
        severity === 'high'
          ? 'Significant Training Cost Recovery'
          : 'Training Cost Recovery Clause',
      matchedText: sentence,
      explanation:
        severity === 'high'
          ? `The company can recover ${amount ? '₹' + amount.toLocaleString('en-IN') : 'a significant amount'} in training costs if you leave within ${durationMonths ? durationMonths + ' months' : 'the specified period'}. This can be a major financial trap — even if the "training" is just onboarding.`
          : `Training cost recovery is mentioned. If you leave early, you may have to reimburse the company for training expenses. Clarify what counts as "training" and the exact amount.`,
      questionForHR:
        'What exactly counts as training costs? Is this capped at a specific amount? Does it decrease over time (pro-rated)?',
      extracted: {
        amount,
        durationMonths: durationMonths ?? undefined,
      },
    });
  }

  return findings;
}
