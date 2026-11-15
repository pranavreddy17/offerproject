/**
 * Rule: Variable Pay
 *
 * Detects variable/performance-linked pay components and flags when
 * they form a significant share of CTC or are discretionary.
 */
import type { Finding } from '../types';
import { findMoneyAmounts } from '../money';
import { splitSentences } from '../normalize';

const VARIABLE_PAY_PATTERNS = [
  /variable\s+(?:pay|component|compensation)/i,
  /performance\s+(?:bonus|incentive|linked\s+pay)/i,
  /incentive\s+(?:pay|bonus|component)/i,
  /(?:annual|quarterly|monthly)\s+bonus/i,
  /target\s+(?:bonus|incentive)/i,
];

const DISCRETIONARY_PATTERNS = [
  /(?:at\s+the\s+)?discretion\s+of\s+(?:the\s+)?(?:company|management|employer)/i,
  /not\s+guaranteed/i,
  /subject\s+to\s+(?:performance|appraisal|company\s+performance|business\s+results)/i,
  /may\s+(?:or\s+may\s+not|vary|change)/i,
  /(?:no|not\s+a)\s+(?:guarantee|entitlement)/i,
  /discretionary\s+(?:bonus|pay|component)/i,
];

export function detectVariablePay(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  for (const sentence of sentences) {
    const isVariablePay = VARIABLE_PAY_PATTERNS.some((p) => p.test(sentence));
    if (!isVariablePay) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    const amounts = findMoneyAmounts(sentence);
    const amount = amounts.length > 0 ? amounts[0].value : undefined;

    // Check if discretionary language is in this sentence or nearby
    const isDiscretionary = DISCRETIONARY_PATTERNS.some((p) =>
      p.test(sentence),
    );

    // Check the full text for discretionary language near variable pay mentions
    const isDiscretionaryInContext =
      isDiscretionary ||
      DISCRETIONARY_PATTERNS.some((p) => p.test(text));

    let severity: Finding['severity'] = 'low';
    if (isDiscretionary) {
      severity = 'medium';
    } else if (isDiscretionaryInContext && amount && amount >= 100000) {
      severity = 'medium';
    }

    counter++;
    findings.push({
      id: `variablePay-${counter}`,
      type: 'variablePay',
      severity,
      title: isDiscretionary
        ? 'Discretionary Variable Pay'
        : 'Variable Pay Component',
      matchedText: sentence,
      explanation: isDiscretionary
        ? `This variable pay component is at the company's discretion — it's not guaranteed. Your actual in-hand salary may be lower than the CTC headline number. ${amount ? 'The amount ₹' + amount.toLocaleString('en-IN') + ' is NOT guaranteed income.' : 'Calculate your guaranteed fixed pay separately.'}`
        : `Variable pay is performance-linked. While common, remember this portion of your CTC is conditional. ${amount ? '₹' + amount.toLocaleString('en-IN') + ' depends on meeting targets.' : 'Ask what percentage of people actually receive the full variable pay.'}`,
      questionForHR:
        'What percentage of employees receive the full variable pay? What are the conditions? Is any part of it guaranteed for the first year?',
      extracted: {
        amount,
      },
    });
  }

  return findings;
}
