import { useState, useEffect } from 'react';
import type { CtcBreakdown as CtcBreakdownType, Finding } from '../engine/types';
import { calculateCtcBreakdown } from '../engine/ctc';

interface CtcBreakdownProps {
  initialBreakdown: CtcBreakdownType | null;
  extractedCtc: {
    totalCtc: number | null;
    fixed: number | null;
    variable: number | null;
    joiningBonus: number | null;
  };
  findings: Finding[];
  onBreakdownChange?: (breakdown: CtcBreakdownType) => void;
}

/** Format a number in Indian locale */
function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function CtcBreakdown({
  initialBreakdown,
  extractedCtc,
  findings,
  onBreakdownChange,
}: CtcBreakdownProps) {
  const [totalCtc, setTotalCtc] = useState(
    extractedCtc.totalCtc ?? initialBreakdown?.totalCtc ?? 0,
  );
  const [fixed, setFixed] = useState(
    extractedCtc.fixed ?? initialBreakdown?.fixed ?? 0,
  );
  const [variable, setVariable] = useState(
    extractedCtc.variable ?? initialBreakdown?.variable ?? 0,
  );
  const [joiningBonus, setJoiningBonus] = useState(
    extractedCtc.joiningBonus ?? initialBreakdown?.joiningBonus ?? 0,
  );
  const [otherConditional, setOtherConditional] = useState(
    initialBreakdown?.otherConditional ?? 0,
  );
  const [breakdown, setBreakdown] = useState<CtcBreakdownType | null>(
    initialBreakdown,
  );

  // Recalculate when inputs change
  useEffect(() => {
    if (totalCtc > 0 || fixed > 0 || variable > 0 || joiningBonus > 0 || otherConditional > 0) {
      const newBreakdown = calculateCtcBreakdown(
        totalCtc,
        fixed,
        variable,
        joiningBonus,
        otherConditional,
        findings,
      );
      setBreakdown(newBreakdown);
      if (onBreakdownChange) {
        onBreakdownChange(newBreakdown);
      }
    }
  }, [totalCtc, fixed, variable, joiningBonus, otherConditional, findings, onBreakdownChange]);

  // Check reconciliation: sum of components vs total CTC
  const sumOfComponents = fixed + variable + joiningBonus + otherConditional;
  const isMismatched = totalCtc > 0 && sumOfComponents > 0 && Math.abs(sumOfComponents - totalCtc) > 1000;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        💰 CTC Reality Check &amp; Take-Home Estimate
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Headline CTC often bundles conditional, deferred, or performance pay. Verify your guaranteed fixed salary below.
      </p>

      {/* Editable inputs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <InputField
          label="Total CTC (₹/yr)"
          value={totalCtc}
          onChange={setTotalCtc}
        />
        <InputField
          label="Fixed Base Pay (₹/yr)"
          value={fixed}
          onChange={setFixed}
        />
        <InputField
          label="Variable / Incentive (₹/yr)"
          value={variable}
          onChange={setVariable}
        />
        <InputField
          label="Joining Bonus (₹ one-time)"
          value={joiningBonus}
          onChange={setJoiningBonus}
        />
        <InputField
          label="Other Conditional (₹/yr)"
          value={otherConditional}
          onChange={setOtherConditional}
        />
      </div>

      {/* Reconciliation Warning */}
      {isMismatched && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-2.5 text-xs text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Component sum ({formatINR(sumOfComponents)}) does not match stated Total CTC ({formatINR(totalCtc)}). Check if unlisted deductions (gratuity, insurance, or employer PF) are included in the headline figure.
          </span>
        </div>
      )}

      {breakdown && (totalCtc > 0 || fixed > 0) && (
        <>
          {/* Visual distribution bar */}
          <div className="mb-4">
            <div className="flex h-6 rounded-full overflow-hidden bg-gray-200 shadow-inner">
              {breakdown.fixedPercent > 0 && (
                <div
                  className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${breakdown.fixedPercent}%` }}
                  title={`Fixed Guaranteed: ${breakdown.fixedPercent}%`}
                >
                  {breakdown.fixedPercent > 12 ? `Fixed ${breakdown.fixedPercent}%` : ''}
                </div>
              )}
              {breakdown.variablePercent > 0 && (
                <div
                  className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${breakdown.variablePercent}%` }}
                  title={`Variable / Incentive: ${breakdown.variablePercent}%`}
                >
                  {breakdown.variablePercent > 12 ? `Var ${breakdown.variablePercent}%` : ''}
                </div>
              )}
              {breakdown.conditionalPercent > 0 && (
                <div
                  className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${breakdown.conditionalPercent}%` }}
                  title={`Conditional / Bonus: ${breakdown.conditionalPercent}%`}
                >
                  {breakdown.conditionalPercent > 12 ? `Cond ${breakdown.conditionalPercent}%` : ''}
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                Guaranteed Fixed Pay ({breakdown.fixedPercent}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                Performance Variable ({breakdown.variablePercent}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full inline-block" />
                One-Time / Conditional ({breakdown.conditionalPercent}%)
              </span>
            </div>
          </div>

          {/* Key financial metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard
              label="Guaranteed Annual"
              value={formatINR(breakdown.guaranteedAnnual)}
              subtext="Fixed compensation only"
              color="green"
            />
            <StatCard
              label="Est. Monthly Take-Home"
              value={formatINR(breakdown.estimatedMonthlyInHand)}
              subtext="After ~25% standard deductions*"
              color="blue"
            />
            <StatCard
              label="Worst-Case Exit Liability"
              value={formatINR(breakdown.worstCaseExitCost)}
              subtext="Service bond + clawbacks"
              color="red"
            />
          </div>

          {/* Assumption disclaimer */}
          <p className="text-xs text-gray-400 italic">
            * Estimated take-home is a simplified approximation assuming ~25% statutory deductions (Employee PF + income tax + professional tax). Actual in-hand varies based on your chosen tax regime, eligible exemptions, and company-specific PF policies.
          </p>
        </>
      )}

      {totalCtc === 0 && fixed === 0 && (
        <p className="text-sm text-gray-500 italic">
          Enter salary figures above to calculate take-home and component percentages.
        </p>
      )}
    </div>
  );
}

/** Reusable number input field */
function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => {
          const val = Number(e.target.value);
          onChange(isNaN(val) ? 0 : Math.max(0, val));
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        min={0}
        aria-label={label}
      />
    </div>
  );
}

/** Small stat card */
function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  color: 'green' | 'blue' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
  };
  const textClasses = {
    green: 'text-green-800',
    blue: 'text-blue-800',
    red: 'text-red-800',
  };
  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <p className={`text-xl font-bold ${textClasses[color]} mt-0.5`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>
    </div>
  );
}
