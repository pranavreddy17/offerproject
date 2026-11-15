import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompareView } from '../../src/components/CompareView';
import type { SavedOffer } from '../../src/App';
import type { AnalysisResult } from '../../src/engine/types';

function createMockOffer(
  name: string,
  ctc: number,
  fixed: number,
  exitCost: number,
  risk: 'low' | 'medium' | 'high' = 'low',
  findings: AnalysisResult['findings'] = [],
): SavedOffer {
  return {
    name,
    result: {
      findings,
      overallRisk: risk,
      summaryCounts: { high: 0, medium: 0, low: 0, info: 0 },
      ctcBreakdown: {
        totalCtc: ctc,
        fixed,
        variable: ctc - fixed,
        joiningBonus: 0,
        otherConditional: 0,
        guaranteedAnnual: fixed,
        estimatedMonthlyInHand: Math.round((fixed / 12) * 0.75),
        worstCaseExitCost: exitCost,
        fixedPercent: Math.round((fixed / ctc) * 100),
        variablePercent: Math.round(((ctc - fixed) / ctc) * 100),
        conditionalPercent: 0,
      },
      ctcExtracted: { totalCtc: ctc, fixed, variable: null, joiningBonus: null },
      warnings: [],
      clausesNotFound: [],
    },
  };
}

describe('CompareView Component', () => {
  it('renders empty state when no offers are provided', () => {
    render(<CompareView offers={[]} onRemove={() => {}} onAnalyzeAnother={() => {}} />);
    expect(screen.getByText(/Compare Offers Side by Side/i)).toBeInTheDocument();
  });

  it('renders comparison table with up to 3 offers', () => {
    const offer1 = createMockOffer('Company A', 800000, 600000, 0, 'low');
    const offer2 = createMockOffer('Company B', 1200000, 800000, 200000, 'high', [
      {
        id: 'bond-1',
        type: 'bond',
        severity: 'high',
        title: 'Service Bond',
        matchedText: 'Service bond of Rs. 2,00,000 for 2 years',
        explanation: 'test',
        questionForHR: 'test',
        extracted: { amount: 200000, durationMonths: 24 },
      },
    ]);

    render(
      <CompareView
        offers={[offer1, offer2]}
        onRemove={() => {}}
        onAnalyzeAnother={() => {}}
      />,
    );

    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    expect(screen.getAllByText('₹8,00,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹12,00,000')).toBeInTheDocument();
  });

  it('displays "Unspecified liability" instead of ₹0 when bond clause exists without parsed amount', () => {
    const offerWithUnknownBond: SavedOffer = {
      name: 'Startup Inc',
      result: {
        findings: [
          {
            id: 'bond-1',
            type: 'bond',
            severity: 'medium',
            title: 'Service Bond',
            matchedText: 'Employee agrees to liquidated damages upon early exit.',
            explanation: 'Liquidated damages clause with unspecified amount',
            questionForHR: 'What is the penalty?',
            // Amount is unparsed/undefined!
          },
        ],
        overallRisk: 'medium',
        summaryCounts: { high: 0, medium: 1, low: 0, info: 0 },
        ctcBreakdown: {
          totalCtc: 600000,
          fixed: 500000,
          variable: 100000,
          joiningBonus: 0,
          otherConditional: 0,
          guaranteedAnnual: 500000,
          estimatedMonthlyInHand: 31250,
          worstCaseExitCost: 0, // 0 numeric because amount was unknown
          fixedPercent: 83,
          variablePercent: 17,
          conditionalPercent: 0,
        },
        ctcExtracted: { totalCtc: 600000, fixed: 500000, variable: 100000, joiningBonus: null },
        warnings: [],
        clausesNotFound: [],
      },
    };

    render(
      <CompareView
        offers={[offerWithUnknownBond]}
        onRemove={() => {}}
        onAnalyzeAnother={() => {}}
      />,
    );

    // CRITICAL: Must NEVER display ₹0 for unknown exit liability!
    expect(screen.getByText('Unspecified liability')).toBeInTheDocument();
  });

  it('triggers onRemove callback when remove button is clicked', () => {
    const mockRemove = vi.fn();
    const offer1 = createMockOffer('Company A', 800000, 600000, 0);

    render(
      <CompareView
        offers={[offer1]}
        onRemove={mockRemove}
        onAnalyzeAnother={() => {}}
      />,
    );

    const removeBtn = screen.getByLabelText(/Remove Company A/i);
    fireEvent.click(removeBtn);
    expect(mockRemove).toHaveBeenCalledWith(0);
  });
});
