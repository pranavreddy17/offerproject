import { describe, it, expect } from 'vitest';
import { extractCtcFromText, calculateCtcBreakdown } from '../../src/engine/ctc';
import type { Finding } from '../../src/engine/types';

describe('extractCtcFromText', () => {
  it('extracts total CTC', () => {
    const text = 'Your annual CTC will be Rs. 8,00,000 per annum.';
    const result = extractCtcFromText(text);
    expect(result.totalCtc).toBe(800000);
  });

  it('extracts fixed pay', () => {
    const text = 'Fixed pay: Rs. 5,00,000 per annum.';
    const result = extractCtcFromText(text);
    expect(result.fixed).toBe(500000);
  });

  it('extracts variable pay', () => {
    const text = 'Variable pay of Rs. 1,00,000 per annum.';
    const result = extractCtcFromText(text);
    expect(result.variable).toBe(100000);
  });

  it('extracts joining bonus', () => {
    const text = 'Joining bonus of Rs. 50,000 on joining.';
    const result = extractCtcFromText(text);
    expect(result.joiningBonus).toBe(50000);
  });

  it('returns null for missing components', () => {
    const text = 'Welcome to the team!';
    const result = extractCtcFromText(text);
    expect(result.totalCtc).toBeNull();
    expect(result.fixed).toBeNull();
    expect(result.variable).toBeNull();
    expect(result.joiningBonus).toBeNull();
  });
});

describe('calculateCtcBreakdown', () => {
  const emptyFindings: Finding[] = [];

  it('calculates percentages correctly', () => {
    const result = calculateCtcBreakdown(1000000, 700000, 200000, 100000, 0, emptyFindings);
    expect(result.fixedPercent).toBe(70);
    expect(result.variablePercent).toBe(20);
    expect(result.conditionalPercent).toBe(10);
  });

  it('calculates guaranteed annual correctly', () => {
    const result = calculateCtcBreakdown(800000, 600000, 200000, 0, 0, emptyFindings);
    expect(result.guaranteedAnnual).toBe(600000);
  });

  it('calculates estimated monthly in-hand', () => {
    const result = calculateCtcBreakdown(800000, 600000, 200000, 0, 0, emptyFindings);
    // 600000 / 12 * 0.75 = 37500
    expect(result.estimatedMonthlyInHand).toBe(37500);
  });

  it('calculates worst-case exit cost from findings', () => {
    const findings: Finding[] = [
      {
        id: 'bond-1',
        type: 'bond',
        severity: 'high',
        title: 'Bond',
        matchedText: 'Sentence A',
        explanation: 'test',
        questionForHR: 'test',
        extracted: { amount: 200000, durationMonths: 24 },
      },
      {
        id: 'clawback-1',
        type: 'clawback',
        severity: 'medium',
        title: 'Clawback',
        matchedText: 'Sentence B',
        explanation: 'test',
        questionForHR: 'test',
        extracted: { amount: 100000, durationMonths: 12 },
      },
    ];
    const result = calculateCtcBreakdown(800000, 600000, 200000, 0, 0, findings);
    expect(result.worstCaseExitCost).toBe(300000);
  });

  it('AVOIDS DOUBLE-COUNTING when training cost and bond match the same obligation sentence', () => {
    const sharedSentence = 'You shall pay Rs. 1,00,000 for training cost recovery under the bond agreement.';
    const overlappingFindings: Finding[] = [
      {
        id: 'bond-1',
        type: 'bond',
        severity: 'medium',
        title: 'Bond',
        matchedText: sharedSentence,
        explanation: 'test',
        questionForHR: 'test',
        extracted: { amount: 100000 },
      },
      {
        id: 'trainingCost-1',
        type: 'trainingCost',
        severity: 'medium',
        title: 'Training Cost',
        matchedText: sharedSentence,
        explanation: 'test',
        questionForHR: 'test',
        extracted: { amount: 100000 },
      },
    ];
    const result = calculateCtcBreakdown(600000, 500000, 100000, 0, 0, overlappingFindings);
    // Must be 100000, NOT 200000!
    expect(result.worstCaseExitCost).toBe(100000);
  });

  it('handles negative or invalid number inputs gracefully without crashing', () => {
    const result = calculateCtcBreakdown(-500000, -300000, NaN, 0, 0, emptyFindings);
    expect(result.totalCtc).toBe(0);
    expect(result.fixed).toBe(0);
    expect(result.variable).toBe(0);
    expect(result.estimatedMonthlyInHand).toBe(0);
  });

  it('handles zero total CTC', () => {
    const result = calculateCtcBreakdown(0, 0, 0, 0, 0, emptyFindings);
    expect(result.fixedPercent).toBe(0);
    expect(result.variablePercent).toBe(0);
    expect(result.estimatedMonthlyInHand).toBe(0);
  });
});
