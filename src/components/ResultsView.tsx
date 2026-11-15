import { useState, useCallback } from 'react';
import type { AnalysisResult, ClauseType, CtcBreakdown as CtcBreakdownType } from '../engine/types';
import { ClauseCard } from './ClauseCard';
import { CtcBreakdown } from './CtcBreakdown';

const CLAUSE_LABELS: Record<ClauseType, string> = {
  bond: 'Service Bond',
  noticePeriod: 'Notice Period',
  clawback: 'Joining Bonus / Clawback',
  variablePay: 'Variable Pay',
  trainingCost: 'Training Cost Recovery',
  nonCompete: 'Non-Compete / Exclusivity',
};

const RISK_BANNER: Record<
  string,
  { bg: string; border: string; text: string; emoji: string; label: string }
> = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    emoji: '🚨',
    label: 'High Risk Terms Detected — Scrutinize Before Signing',
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    emoji: '⚠️',
    label: 'Medium Risk Terms Detected — Notable Commitments Found',
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800',
    emoji: '✅',
    label: 'No Major Predatory Clauses Detected by Current Rules',
  },
};

interface ResultsViewProps {
  result: AnalysisResult;
  onAddToCompare: (name: string, result: AnalysisResult) => void;
  compareCount: number;
}

export function ResultsView({
  result,
  onAddToCompare,
  compareCount,
}: ResultsViewProps) {
  const [companyName, setCompanyName] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentBreakdown, setCurrentBreakdown] = useState<CtcBreakdownType | null>(
    result.ctcBreakdown,
  );

  const banner = RISK_BANNER[result.overallRisk];

  const handleCopySummary = useCallback(() => {
    const activeCtc = currentBreakdown ?? result.ctcBreakdown;
    const lines = [
      `OfferLens Analysis Summary`,
      `Overall Risk: ${result.overallRisk.toUpperCase()}`,
      `Findings: ${result.findings.length} (${result.summaryCounts.high} high, ${result.summaryCounts.medium} medium, ${result.summaryCounts.low} low)`,
      '',
      ...result.findings.map(
        (f) => `[${f.severity.toUpperCase()}] ${f.title}: ${f.explanation}`,
      ),
    ];
    if (activeCtc) {
      lines.push(
        '',
        `CTC: ₹${activeCtc.totalCtc.toLocaleString('en-IN')}`,
        `Fixed Pay: ${activeCtc.fixedPercent}% | Variable Pay: ${activeCtc.variablePercent}% | Conditional: ${activeCtc.conditionalPercent}%`,
        `Estimated Monthly Take-Home: ₹${activeCtc.estimatedMonthlyInHand.toLocaleString('en-IN')}`,
        `Worst-Case Exit Liability: ₹${activeCtc.worstCaseExitCost.toLocaleString('en-IN')}`,
      );
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, currentBreakdown]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleAddToCompare = useCallback(() => {
    const name = companyName.trim() || `Offer ${compareCount + 1}`;
    // Pass updated breakdown if user edited CTC values
    const offerToSave: AnalysisResult = {
      ...result,
      ctcBreakdown: currentBreakdown ?? result.ctcBreakdown,
    };
    onAddToCompare(name, offerToSave);
    setCompanyName('');
  }, [companyName, compareCount, onAddToCompare, result, currentBreakdown]);

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((warning, i) => (
            <div
              key={i}
              className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700"
              role="alert"
            >
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Overall risk banner */}
      <div
        className={`${banner.bg} ${banner.border} border rounded-lg p-4 flex items-center gap-3`}
        role="status"
        aria-label={`Overall risk: ${result.overallRisk}`}
      >
        <span className="text-2xl">{banner.emoji}</span>
        <div>
          <h2 className={`text-lg font-bold ${banner.text}`}>
            {banner.label}
          </h2>
          <p className="text-sm text-gray-600">
            Detected {result.findings.length} flagged clause
            {result.findings.length !== 1 ? 's' : ''} across{' '}
            {6 - result.clausesNotFound.length} of 6 monitored categories.
          </p>
        </div>
      </div>

      {/* Summary counts */}
      <div className="flex gap-3 flex-wrap">
        {result.summaryCounts.high > 0 && (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {result.summaryCounts.high} High Severity
          </span>
        )}
        {result.summaryCounts.medium > 0 && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {result.summaryCounts.medium} Medium Severity
          </span>
        )}
        {result.summaryCounts.low > 0 && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {result.summaryCounts.low} Low Severity
          </span>
        )}
        {result.summaryCounts.info > 0 && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {result.summaryCounts.info} Informational
          </span>
        )}
      </div>

      {/* Findings */}
      {result.findings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Flagged Clauses &amp; Questions to Ask HR
          </h3>
          {result.findings.map((finding) => (
            <ClauseCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      {/* Clauses NOT found */}
      {result.clausesNotFound.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Clauses not detected by current rules:
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.clausesNotFound.map((type) => (
              <span
                key={type}
                className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-gray-500"
              >
                {CLAUSE_LABELS[type]}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Note: Non-detection means these specific patterns were not matched. Review your full document manually for non-standard phrasing.
          </p>
        </div>
      )}

      {/* CTC Breakdown */}
      <CtcBreakdown
        initialBreakdown={result.ctcBreakdown}
        extractedCtc={result.ctcExtracted}
        findings={result.findings}
        onBreakdownChange={setCurrentBreakdown}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 no-print items-center">
        <button
          onClick={handleCopySummary}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {copied ? '✓ Summary Copied!' : '📋 Copy Summary'}
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          🖨️ Print / Save as PDF
        </button>
        {compareCount < 3 && (
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Infosys, TCS, Startup"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 sm:w-48"
              aria-label="Company name for comparison"
            />
            <button
              onClick={handleAddToCompare}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              + Add to Compare
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
