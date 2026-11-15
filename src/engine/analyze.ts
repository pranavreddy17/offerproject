/**
 * Analyze Orchestrator
 *
 * Runs all rules against the normalized text and assembles the final
 * AnalysisResult. This is the single entry point for the engine.
 */
import type {
  AnalysisResult,
  ClauseType,
  Finding,
  OverallRisk,
  Severity,
} from './types';
import { normalizeText } from './normalize';
import { detectBond } from './rules/bond';
import { detectNoticePeriod } from './rules/noticePeriod';
import { detectClawback } from './rules/clawback';
import { detectVariablePay } from './rules/variablePay';
import { detectTrainingCost } from './rules/trainingCost';
import { detectNonCompete } from './rules/nonCompete';
import { extractCtcFromText, calculateCtcBreakdown } from './ctc';

/** All rules in order */
const RULES: Array<{ type: ClauseType; detect: (text: string) => Finding[] }> =
  [
    { type: 'bond', detect: detectBond },
    { type: 'noticePeriod', detect: detectNoticePeriod },
    { type: 'clawback', detect: detectClawback },
    { type: 'variablePay', detect: detectVariablePay },
    { type: 'trainingCost', detect: detectTrainingCost },
    { type: 'nonCompete', detect: detectNonCompete },
  ];

/** Severity sort order: high > medium > low > info */
const SEVERITY_ORDER: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

/**
 * Determine overall risk from findings.
 * Consistency rule:
 * - ANY high-severity finding triggers 'high' overall risk (a high-risk bond or penalty is never downplayed).
 * - 2+ medium-severity findings triggers 'high' overall risk.
 * - 1 medium-severity finding triggers 'medium' overall risk.
 * - Only low/info findings (or no findings) produces 'low' overall risk.
 */
function computeOverallRisk(findings: Finding[]): OverallRisk {
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;

  if (highCount >= 1 || mediumCount >= 2) return 'high';
  if (mediumCount === 1) return 'medium';
  return 'low';
}

/** Generate warnings about input quality */
function computeWarnings(text: string): string[] {
  const warnings: string[] = [];

  if (text.length < 200) {
    warnings.push(
      'The text seems very short. It may be incomplete or missing standard sections.',
    );
  }

  if (text.length < 50) {
    warnings.push(
      'Very little text was extracted. If you uploaded a scanned PDF, note that image-based PDFs without selectable text are not supported.',
    );
  }

  // Check for garbled text (lots of special characters)
  const nonAlphaRatio =
    (text.replace(/[a-zA-Z0-9\s.,;:'"()/-]/g, '').length) / Math.max(text.length, 1);
  if (nonAlphaRatio > 0.3) {
    warnings.push(
      'The text contains many unusual characters. It may have been extracted from a scanned or corrupted file.',
    );
  }

  return warnings;
}

/**
 * Analyze an offer letter text and return structured results.
 *
 * This is the main entry point for the engine. It:
 * 1. Normalizes the input text
 * 2. Runs all 6 rules
 * 3. Extracts CTC information
 * 4. Computes overall risk and warnings
 */
export function analyze(rawText: string): AnalysisResult {
  const text = normalizeText(rawText);

  // Run all rules and collect findings
  const allFindings: Finding[] = [];
  const foundTypes = new Set<ClauseType>();

  for (const rule of RULES) {
    const findings = rule.detect(text);
    if (findings.length > 0) {
      foundTypes.add(rule.type);
    }
    allFindings.push(...findings);
  }

  // Sort by severity (high first)
  allFindings.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  // Compute summary counts
  const summaryCounts: Record<Severity, number> = {
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of allFindings) {
    summaryCounts[f.severity]++;
  }

  // Find clause types NOT detected
  const allTypes: ClauseType[] = [
    'bond',
    'noticePeriod',
    'clawback',
    'variablePay',
    'trainingCost',
    'nonCompete',
  ];
  const clausesNotFound = allTypes.filter((t) => !foundTypes.has(t));

  // Extract CTC
  const ctcExtracted = extractCtcFromText(text);

  // Calculate CTC breakdown if we have extracted total or fixed
  let ctcBreakdown: AnalysisResult['ctcBreakdown'] = null;
  if (ctcExtracted.totalCtc !== null || ctcExtracted.fixed !== null) {
    ctcBreakdown = calculateCtcBreakdown(
      ctcExtracted.totalCtc ?? 0,
      ctcExtracted.fixed ?? 0,
      ctcExtracted.variable ?? 0,
      ctcExtracted.joiningBonus ?? 0,
      0,
      allFindings,
    );
  }

  return {
    findings: allFindings,
    overallRisk: computeOverallRisk(allFindings),
    summaryCounts,
    ctcBreakdown,
    ctcExtracted,
    warnings: computeWarnings(text),
    clausesNotFound,
  };
}
