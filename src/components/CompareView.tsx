import type { SavedOffer } from '../App';

interface CompareViewProps {
  offers: SavedOffer[];
  onRemove: (index: number) => void;
  onAnalyzeAnother: () => void;
}

/** Format currency amount or display specific status strings */
function fmtINR(amount: number | null | undefined): string {
  if (amount === undefined || amount === null) return 'Not extracted';
  if (amount === 0) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

/** Get max bond amount from findings, distinguishing 0, detected amounts, and unmentioned */
function getBondAmount(offer: SavedOffer): number | null {
  const bondFindings = offer.result.findings.filter((f) => f.type === 'bond');
  if (bondFindings.length === 0) return null; // None detected
  const amounts = bondFindings
    .map((f) => f.extracted?.amount)
    .filter((a): a is number => typeof a === 'number');
  return amounts.length > 0 ? Math.max(...amounts) : null;
}

/** Get max bond duration from findings */
function getBondDuration(offer: SavedOffer): number | null {
  const bondFindings = offer.result.findings.filter((f) => f.type === 'bond');
  if (bondFindings.length === 0) return null;
  const durations = bondFindings
    .map((f) => f.extracted?.durationMonths)
    .filter((d): d is number => typeof d === 'number');
  return durations.length > 0 ? Math.max(...durations) : null;
}

/** Get notice period from findings (days) */
function getNoticePeriod(offer: SavedOffer): number | null {
  const npFindings = offer.result.findings.filter((f) => f.type === 'noticePeriod');
  if (npFindings.length === 0) return null;
  const days = npFindings
    .map((f) => (f.extracted?.durationMonths ? f.extracted.durationMonths * 30 : null))
    .filter((d): d is number => typeof d === 'number');
  return days.length > 0 ? Math.max(...days) : null;
}

/**
 * Get deduplicated clawback and training recovery amounts.
 * Prevents double-counting if a training recovery clause and clawback share the same sentence.
 */
function getClawbacks(offer: SavedOffer): number | null {
  const exitFindings = offer.result.findings.filter(
    (f) =>
      (f.type === 'clawback' || f.type === 'trainingCost') &&
      typeof f.extracted?.amount === 'number' &&
      f.extracted.amount > 0,
  );
  if (exitFindings.length === 0) {
    const hasMentions = offer.result.findings.some(
      (f) => f.type === 'clawback' || f.type === 'trainingCost',
    );
    return hasMentions ? 0 : null;
  }

  // Deduplicate by sentence to avoid double counting
  const processedKeys = new Set<string>();
  let total = 0;
  for (const f of exitFindings) {
    const key = f.matchedText.trim().toLowerCase();
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);
    total += f.extracted?.amount ?? 0;
  }
  return total;
}

/** Determine which offer is best/worst for comparable values */
function getMinMaxIndices(
  values: (number | null)[],
  lowerIsBetter: boolean,
): { best: number; worst: number } {
  // Only compare defined, non-null numeric values
  const valid = values
    .map((v, i) => ({ val: v, idx: i }))
    .filter((x): x is { val: number; idx: number } => x.val !== null);

  if (valid.length < 2) return { best: -1, worst: -1 };

  const numVals = valid.map((x) => x.val);
  const minVal = Math.min(...numVals);
  const maxVal = Math.max(...numVals);

  if (minVal === maxVal) return { best: -1, worst: -1 };

  const bestVal = lowerIsBetter ? minVal : maxVal;
  const worstVal = lowerIsBetter ? maxVal : minVal;

  return {
    best: valid.find((x) => x.val === bestVal)?.idx ?? -1,
    worst: valid.find((x) => x.val === worstVal)?.idx ?? -1,
  };
}

export function CompareView({
  offers,
  onRemove,
  onAnalyzeAnother,
}: CompareViewProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⚖️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Compare Offers Side by Side
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Analyze up to 3 offer letters, then click &quot;Add to Compare&quot; on the results page to evaluate salary breakdown, obligations, and exit costs side by side.
        </p>
        <button
          onClick={onAnalyzeAnother}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Analyze an Offer Letter
        </button>
      </div>
    );
  }

  // Extract numerical values for comparison (preserving 0 as valid 0, null as not extracted/detected)
  const ctcValues = offers.map((o) =>
    typeof o.result.ctcBreakdown?.totalCtc === 'number' && o.result.ctcBreakdown.totalCtc > 0
      ? o.result.ctcBreakdown.totalCtc
      : null,
  );
  const fixedPayValues = offers.map((o) =>
    typeof o.result.ctcBreakdown?.fixed === 'number' && o.result.ctcBreakdown.fixed > 0
      ? o.result.ctcBreakdown.fixed
      : null,
  );
  const fixedPctValues = offers.map((o) =>
    typeof o.result.ctcBreakdown?.fixedPercent === 'number'
      ? o.result.ctcBreakdown.fixedPercent
      : null,
  );
  const variableValues = offers.map((o) =>
    typeof o.result.ctcBreakdown?.variable === 'number'
      ? o.result.ctcBreakdown.variable
      : null,
  );
  const bondAmounts = offers.map(getBondAmount);
  const bondDurations = offers.map(getBondDuration);
  const noticePeriods = offers.map(getNoticePeriod);
  const clawbacks = offers.map(getClawbacks);

  // Exit liabilities: if exit cost is computed in ctcBreakdown, use it; otherwise null if unknown
  const exitCosts = offers.map((o) => {
    if (typeof o.result.ctcBreakdown?.worstCaseExitCost === 'number') {
      return o.result.ctcBreakdown.worstCaseExitCost;
    }
    return null;
  });

  const ctcIdx = getMinMaxIndices(ctcValues, false);
  const fixedPayIdx = getMinMaxIndices(fixedPayValues, false);
  const fixedPctIdx = getMinMaxIndices(fixedPctValues, false);
  const bondAmtIdx = getMinMaxIndices(bondAmounts, true);
  const bondDurIdx = getMinMaxIndices(bondDurations, true);
  const noticeIdx = getMinMaxIndices(noticePeriods, true);
  const clawbackIdx = getMinMaxIndices(clawbacks, true);
  const exitIdx = getMinMaxIndices(exitCosts, true);

  const rows: Array<{
    label: string;
    values: string[];
    best: number;
    worst: number;
  }> = [
    {
      label: 'Total CTC',
      values: ctcValues.map((v) => (v !== null ? fmtINR(v) : 'Not extracted')),
      best: ctcIdx.best,
      worst: ctcIdx.worst,
    },
    {
      label: 'Fixed Annual Pay',
      values: fixedPayValues.map((v) => (v !== null ? fmtINR(v) : 'Not extracted')),
      best: fixedPayIdx.best,
      worst: fixedPayIdx.worst,
    },
    {
      label: 'Fixed Pay %',
      values: fixedPctValues.map((v) => (v !== null ? `${v}%` : 'Not extracted')),
      best: fixedPctIdx.best,
      worst: fixedPctIdx.worst,
    },
    {
      label: 'Variable / Incentive Pay',
      values: variableValues.map((v) => (v !== null ? fmtINR(v) : 'None / Not extracted')),
      best: -1,
      worst: -1,
    },
    {
      label: 'Bond Penalty Amount',
      values: bondAmounts.map((v) =>
        v !== null ? fmtINR(v) : 'None detected',
      ),
      best: bondAmtIdx.best,
      worst: bondAmtIdx.worst,
    },
    {
      label: 'Bond Duration',
      values: bondDurations.map((v) => (v !== null ? `${v} months` : 'None detected')),
      best: bondDurIdx.best,
      worst: bondDurIdx.worst,
    },
    {
      label: 'Notice Period',
      values: noticePeriods.map((v) => (v !== null ? `${v} days` : 'Not specified')),
      best: noticeIdx.best,
      worst: noticeIdx.worst,
    },
    {
      label: 'Bonus / Training Clawbacks',
      values: clawbacks.map((v) => (v !== null ? fmtINR(v) : 'None detected')),
      best: clawbackIdx.best,
      worst: clawbackIdx.worst,
    },
    {
      label: 'Overall Risk Rating',
      values: offers.map((o) =>
        o.result.overallRisk === 'high'
          ? 'HIGH'
          : o.result.overallRisk === 'medium'
            ? 'MEDIUM'
            : 'LOW',
      ),
      best: -1,
      worst: -1,
    },
    {
      label: 'Worst-Case Exit Liability',
      values: exitCosts.map((v, i) => {
        if (v !== null && v > 0) return fmtINR(v);
        // If 0, check if bond or clawback findings exist without extracted amounts (i.e. unknown)
        const hasUnquantifiedExitClause = offers[i].result.findings.some(
          (f) =>
            (f.type === 'bond' || f.type === 'clawback' || f.type === 'trainingCost') &&
            (!f.extracted?.amount || f.extracted.amount === 0),
        );
        if (hasUnquantifiedExitClause) {
          return 'Unspecified liability';
        }
        return v !== null ? '₹0' : 'Unknown';
      }),
      best: exitIdx.best,
      worst: exitIdx.worst,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          ⚖️ Compare Offers ({offers.length}/3)
        </h2>
        {offers.length < 3 && (
          <button
            onClick={onAnalyzeAnother}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            + Analyze Another
          </button>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg" role="table">
          <thead>
            <tr>
              <th className="text-left p-3 bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600">
                Metric
              </th>
              {offers.map((offer, i) => (
                <th
                  key={i}
                  className="text-left p-3 bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {offer.name}
                    </span>
                    <button
                      onClick={() => onRemove(i)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
                      aria-label={`Remove ${offer.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 border border-gray-200 text-sm font-medium text-gray-700">
                  {row.label}
                </td>
                {row.values.map((value, i) => {
                  let cellClass = 'p-3 border border-gray-200 text-sm';
                  if (i === row.best && row.best !== row.worst) {
                    cellClass += ' bg-green-50 text-green-800 font-semibold';
                  } else if (i === row.worst && row.best !== row.worst) {
                    cellClass += ' bg-red-50 text-red-800';
                  }
                  return (
                    <td key={i} className={cellClass}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        🟢 Green indicates more favorable terms across compared offers | 🔴 Red indicates higher commitments or lower guaranteed pay.
      </p>
    </div>
  );
}
