import { describe, it, expect } from 'vitest';
import { analyze } from '../../src/engine/analyze';

describe('analyze orchestrator', () => {
  it('returns all required fields', () => {
    const result = analyze('Some text here.');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('overallRisk');
    expect(result).toHaveProperty('summaryCounts');
    expect(result).toHaveProperty('ctcBreakdown');
    expect(result).toHaveProperty('ctcExtracted');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('clausesNotFound');
  });

  it('returns low risk for clean offer', () => {
    const text = `
      We are pleased to offer you the position of Software Engineer.
      Your annual CTC will be Rs. 6,00,000 per annum.
      Notice period: 30 days.
      Working hours are 9 AM to 6 PM.
    `;
    const result = analyze(text);
    expect(result.overallRisk).toBe('low');
  });

  it('returns high risk for heavily constrained offer', () => {
    const text = `
      You must sign a service agreement for 3 years.
      If you leave early, pay liquidated damages of Rs. 3,00,000.
      Notice period of 120 days.
      Training cost of Rs. 5,00,000 shall be recovered if you leave within 2 years.
      Non-compete of 18 months after leaving.
      Variable pay is at the discretion of the company and is not guaranteed.
    `;
    const result = analyze(text);
    expect(result.overallRisk).toBe('high');
    expect(result.findings.length).toBeGreaterThan(3);
  });

  it('sorts findings by severity (high first)', () => {
    const text = `
      Notice period of 30 days.
      Service bond for 3 years with Rs. 2,00,000 penalty.
      Variable pay subject to performance.
    `;
    const result = analyze(text);
    if (result.findings.length >= 2) {
      const severities = result.findings.map((f) => f.severity);
      const order = { high: 0, medium: 1, low: 2, info: 3 };
      for (let i = 1; i < severities.length; i++) {
        expect(order[severities[i]]).toBeGreaterThanOrEqual(
          order[severities[i - 1]],
        );
      }
    }
  });

  it('shows clausesNotFound for missing types', () => {
    const text = 'Welcome to the company!';
    const result = analyze(text);
    expect(result.clausesNotFound).toContain('bond');
    expect(result.clausesNotFound).toContain('noticePeriod');
    expect(result.clausesNotFound).toContain('clawback');
    expect(result.clausesNotFound).toContain('variablePay');
    expect(result.clausesNotFound).toContain('trainingCost');
    expect(result.clausesNotFound).toContain('nonCompete');
  });

  it('warns on very short text', () => {
    const result = analyze('Hello');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('handles empty input', () => {
    const result = analyze('');
    expect(result.findings).toEqual([]);
    expect(result.overallRisk).toBe('low');
    expect(result.clausesNotFound.length).toBe(6);
  });
});
