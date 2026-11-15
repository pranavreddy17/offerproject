import { describe, it, expect } from 'vitest';
import { detectVariablePay } from '../../src/engine/rules/variablePay';

describe('detectVariablePay', () => {
  it('detects "variable pay" mention', () => {
    const text =
      'Your variable pay component of Rs. 1,00,000 is subject to performance review.';
    const findings = detectVariablePay(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('variablePay');
  });

  it('detects "performance bonus"', () => {
    const text = 'A performance bonus of Rs. 50,000 may be paid quarterly.';
    const findings = detectVariablePay(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('marks medium severity for discretionary pay', () => {
    const text =
      'Variable pay is at the discretion of the company and is not guaranteed.';
    const findings = detectVariablePay(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('medium');
  });

  it('marks low severity for standard variable pay', () => {
    const text = 'Variable pay of Rs. 50,000 per annum based on appraisal.';
    const findings = detectVariablePay(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('low');
  });

  it('returns empty for text without variable pay', () => {
    expect(
      detectVariablePay('Your fixed salary is Rs. 5,00,000 per annum.'),
    ).toEqual([]);
  });

  it('handles empty input', () => {
    expect(detectVariablePay('')).toEqual([]);
  });
});
