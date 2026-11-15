/**
 * Rule: Non-Compete / Exclusivity
 *
 * Detects non-compete clauses, moonlighting restrictions, and exclusive
 * service requirements.
 * Note: Clearly distinguishes contractual phrasing from legal enforceability,
 * explaining practical implications without presenting definitive legal conclusions.
 */
import type { Finding } from '../types';
import { parseDurationMonths } from '../money';
import { splitSentences } from '../normalize';

const NON_COMPETE_PATTERNS = [
  /non[- ]?compete/i,
  /(?:shall|will|must)\s+not\s+(?:join|work\s+(?:for|with)|engage\s+with)\s+(?:a\s+)?competitor/i,
  /(?:shall|will|must)\s+not\s+(?:join|work\s+(?:for|with)|engage\s+with)\s+(?:any\s+)?(?:competing|rival)/i,
  /exclusive\s+(?:service|employment|engagement)/i,
  /(?:refrain|abstain)\s+from\s+(?:joining|working)/i,
  /(?:restrict(?:ion|ed)?|prohibit(?:ed)?)\s+(?:from\s+)?(?:joining|working|employment)/i,
];

const MOONLIGHT_PATTERNS = [
  /moonlight(?:ing)?/i,
  /(?:shall|will|must)\s+not\s+(?:engage|participate|involve)\s+(?:in\s+)?(?:any\s+)?(?:other|outside|external)\s+(?:employment|work|business|activity)/i,
  /(?:full[- ]?time|exclusive)\s+(?:basis|commitment|dedication)/i,
  /(?:outside|external|secondary)\s+(?:employment|work|engagement|business)/i,
  /(?:prior\s+written\s+)?(?:approval|consent|permission)\s+(?:for|to)\s+(?:any\s+)?(?:other|outside|external)\s+(?:work|employment)/i,
];

const DURATION_PATTERN = /(\d+(?:\.\d+)?)\s*(years?|months?)/gi;

export function detectNonCompete(text: string): Finding[] {
  const sentences = splitSentences(text);
  const findings: Finding[] = [];
  const matchedSentences = new Set<string>();
  let counter = 0;

  // Check non-compete patterns
  for (const sentence of sentences) {
    const isNonCompete = NON_COMPETE_PATTERNS.some((p) => p.test(sentence));
    if (!isNonCompete) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    let durationMonths: number | null = null;
    const durationMatches = sentence.match(DURATION_PATTERN);
    if (durationMatches) {
      durationMonths = parseDurationMonths(durationMatches[0]);
    }

    // Severity: high if duration >= 12 months, medium otherwise
    let severity: Finding['severity'] = 'medium';
    if (durationMonths !== null && durationMonths >= 12) {
      severity = 'high';
    } else if (durationMonths !== null && durationMonths < 6) {
      severity = 'low';
    }

    counter++;
    findings.push({
      id: `nonCompete-${counter}`,
      type: 'nonCompete',
      severity,
      title:
        severity === 'high'
          ? 'Restrictive Non-Compete Clause'
          : 'Non-Compete Clause',
      matchedText: sentence,
      explanation:
        severity === 'high'
          ? `This clause restricts you from joining competing companies for ${durationMonths ? durationMonths + ' months' : 'an extended period'} post-separation. Note: Under Section 27 of the Indian Contract Act, post-employment non-compete restrictions are generally viewed critically by courts, but employers may still invoke them in dispute proceedings.`
          : `A non-compete restriction is stated in the contract. While employers enforce these during employment, legal enforceability after exit varies. Clarify the exact scope of competitor definitions with HR.`,
      questionForHR:
        'Which specific companies or industries are considered competitors? Does this restriction apply only during employment or also post-exit?',
      extracted: {
        durationMonths: durationMonths ?? undefined,
      },
    });
  }

  // Check moonlighting patterns (separate from non-compete)
  for (const sentence of sentences) {
    const isMoonlight = MOONLIGHT_PATTERNS.some((p) => p.test(sentence));
    if (!isMoonlight) continue;
    if (matchedSentences.has(sentence)) continue;
    matchedSentences.add(sentence);

    counter++;
    findings.push({
      id: `nonCompete-${counter}`,
      type: 'nonCompete',
      severity: 'info',
      title: 'Moonlighting / Exclusivity Restriction',
      matchedText: sentence,
      explanation:
        'The offer specifies full-time commitment and restricts outside employment or freelancing during your tenure. Check company policies if you contribute to open source or pursue freelance projects.',
      questionForHR:
        'Does the exclusivity clause permit personal open-source contributions or tech writing outside working hours?',
    });
  }

  return findings;
}
