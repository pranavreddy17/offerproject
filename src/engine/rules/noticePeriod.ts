/**
 * Rule: Notice Period
 *
 * Detects notice period clauses and flags long or asymmetric notice periods.
 */
import type { Finding } from '../types';
import { splitSentences } from '../normalize';

const NOTICE_PATTERNS = [
  /notice\s+period\s+of\s+(\d+)\s*(days?|months?|weeks?)/i,
  /(\d+)\s*(days?|months?|weeks?)[''']?\s*(?:prior\s+)?notice/i,
  /(?:give|serve|provide)\s+(?:a\s+)?(\d+)\s*(days?|months?|weeks?)\s*(?:prior\s+)?notice/i,
  /notice\s+period\s*(?:is|shall\s+be|will\s+be)\s*(\d+)\s*(days?|months?|weeks?)/i,
];

/** Pattern to detect asymmetric notice (company can terminate with shorter notice) */
const ASYMMETRY_PATTERNS = [
  /company\s+(?:may|can|shall|reserves?\s+the\s+right\s+to)\s+terminat/i,
  /terminat(?:e|ion)\s+(?:by|from)\s+(?:the\s+)?company\s+(?:with|by\s+giving)\s+(\d+)\s*(days?|months?)/i,
  /(?:without\s+(?:any\s+)?notice|immediate(?:ly)?)\s+(?:by\s+(?:the\s+)?company|terminat)/i,
];

/** Convert a number+unit to days for comparison */
function toDays(value: number, unit: string): number {
  const u = unit.toLowerCase().replace(/s$/, '');
  if (u === 'month') return value * 30;
  if (u === 'week') return value * 7;
  return value; // days
}

export function detectNoticePeriod(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  for (const sentence of sentences) {
    // Try each pattern
    for (const pattern of NOTICE_PATTERNS) {
      const match = sentence.match(pattern);
      if (!match) continue;
      if (matchedSentences.has(sentence)) break;
      matchedSentences.add(sentence);

      // Find the captured number and unit
      const num = parseInt(match[1], 10);
      const unit = match[2] || 'days';
      const days = toDays(num, unit);
      const durationMonths = Math.round(days / 30);

      // Determine severity based on days
      let severity: Finding['severity'] = 'low';
      if (days > 90) {
        severity = 'high';
      } else if (days >= 60) {
        severity = 'medium';
      }

      counter++;
      findings.push({
        id: `noticePeriod-${counter}`,
        type: 'noticePeriod',
        severity,
        title:
          severity === 'high'
            ? `Very Long Notice Period (${num} ${unit})`
            : severity === 'medium'
              ? `Moderate Notice Period (${num} ${unit})`
              : `Notice Period (${num} ${unit})`,
        matchedText: sentence,
        explanation:
          severity === 'high'
            ? `A ${num}-${unit} notice period is unusually long. This means if you get a better offer, you may have to wait ${durationMonths}+ months before you can join the new company. Many companies won't wait that long.`
            : severity === 'medium'
              ? `A ${num}-${unit} notice period is on the longer side. Factor this into any future job switch plans.`
              : `A ${num}-${unit} notice period is standard for freshers in India.`,
        questionForHR:
          days > 30
            ? 'Can the notice period be negotiated down? Is there a buyout option?'
            : 'Is the notice period the same for the company if they want to let me go?',
        extracted: {
          durationMonths,
        },
      });
      break; // Only one finding per sentence
    }
  }

  // Check for asymmetric notice
  for (const sentence of sentences) {
    const isAsymmetric = ASYMMETRY_PATTERNS.some((p) => p.test(sentence));
    if (!isAsymmetric) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    counter++;
    findings.push({
      id: `noticePeriod-${counter}`,
      type: 'noticePeriod',
      severity: 'medium',
      title: 'Asymmetric Termination Notice',
      matchedText: sentence,
      explanation:
        'The company can terminate you with shorter notice (or no notice) than you must give them. This is an unfair imbalance.',
      questionForHR:
        'Is the notice period the same for both sides? Can the company terminate without notice?',
    });
  }

  return findings;
}
