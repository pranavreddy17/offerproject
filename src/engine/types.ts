/**
 * Core types for the OfferLens rule engine.
 * Every analysis result flows through these types.
 */

/** How serious a flagged clause is */
export type Severity = 'low' | 'medium' | 'high' | 'info';

/** The six clause types the engine looks for */
export type ClauseType =
  | 'bond'
  | 'noticePeriod'
  | 'clawback'
  | 'variablePay'
  | 'trainingCost'
  | 'nonCompete';

/** A single flagged clause found in the offer letter */
export interface Finding {
  /** Unique id within one analysis run (e.g. "bond-1") */
  id: string;
  /** Which clause type this belongs to */
  type: ClauseType;
  /** How risky this clause is */
  severity: Severity;
  /** Short human-readable title */
  title: string;
  /** The exact sentence from the offer letter that triggered this flag */
  matchedText: string;
  /** Plain-English explanation of why this matters */
  explanation: string;
  /** A question the student should ask their HR */
  questionForHR: string;
  /** Extracted structured data (when the rule can parse amounts or durations) */
  extracted?: {
    amount?: number;
    durationMonths?: number;
  };
}

/** CTC breakdown: what you actually take home vs what's conditional */
export interface CtcBreakdown {
  /** Total CTC as stated in the letter */
  totalCtc: number;
  /** Fixed component (basic + DA + HRA etc.) */
  fixed: number;
  /** Variable / performance-linked pay */
  variable: number;
  /** Joining bonus or other one-time conditional pay */
  joiningBonus: number;
  /** Any other conditional components */
  otherConditional: number;
  /** Guaranteed annual = fixed only */
  guaranteedAnnual: number;
  /** Rough monthly in-hand (simplified) */
  estimatedMonthlyInHand: number;
  /** Worst case exit cost: sum of bond + clawbacks + training recovery */
  worstCaseExitCost: number;
  /** What percentage of CTC is fixed */
  fixedPercent: number;
  /** What percentage of CTC is variable */
  variablePercent: number;
  /** What percentage of CTC is conditional */
  conditionalPercent: number;
}

/** Overall risk level for the offer */
export type OverallRisk = 'low' | 'medium' | 'high';

/** The complete result of analyzing one offer letter */
export interface AnalysisResult {
  /** All findings sorted by severity (high first) */
  findings: Finding[];
  /** Overall risk assessment */
  overallRisk: OverallRisk;
  /** Count of findings by severity */
  summaryCounts: Record<Severity, number>;
  /** CTC breakdown (may be partial if extraction failed) */
  ctcBreakdown: CtcBreakdown | null;
  /** Raw extracted CTC values from the text */
  ctcExtracted: {
    totalCtc: number | null;
    fixed: number | null;
    variable: number | null;
    joiningBonus: number | null;
  };
  /** Warnings about the input quality */
  warnings: string[];
  /** Which clause types were NOT found (so users know coverage) */
  clausesNotFound: ClauseType[];
}

/** A rule function: takes normalized text, returns zero or more findings */
export type RuleFunction = (text: string) => Finding[];
