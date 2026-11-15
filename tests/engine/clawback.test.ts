import { describe, it, expect } from 'vitest';
import { detectClawback } from '../../src/engine/rules/clawback';

describe('detectClawback', () => {
  it('detects joining bonus clawback when repayment condition exists', () => {
    const text =
      'The joining bonus of Rs. 1,00,000 shall be refunded if you leave within 1 year.';
    const findings = detectClawback(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('clawback');
    expect(findings[0].severity).toBe('medium');
    expect(findings[0].extracted?.amount).toBe(100000);
  });

  it('detects relocation repayment', () => {
    const text =
      'Relocation allowance of Rs. 50,000 must be repaid if you resign within 6 months.';
    const findings = detectClawback(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].extracted?.amount).toBe(50000);
  });

  it('marks high severity for large clawback amount', () => {
    const text =
      'You must repay the joining bonus of Rs. 3,00,000 if you leave within 2 years.';
    const findings = detectClawback(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
    expect(findings[0].extracted?.amount).toBe(300000);
  });

  it('detects pro-rata recovery', () => {
    const text =
      'Pro-rated recovery of the sign-on bonus will apply if you leave early.';
    const findings = detectClawback(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('CORRECTLY classifies plain bonus mention without repayment as low severity and not an exit liability', () => {
    const text = 'You will receive a joining bonus of Rs. 50,000 on joining.';
    const findings = detectClawback(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('low');
    // Crucial: since there is NO repayment condition, it is NOT an exit penalty!
    expect(findings[0].extracted?.amount).toBeUndefined();
    expect(findings[0].title).toContain('No Repayment Condition');
  });

  it('returns empty for no clawback text', () => {
    expect(
      detectClawback('Your salary will be paid on the last day of each month.'),
    ).toEqual([]);
  });

  it('handles empty input', () => {
    expect(detectClawback('')).toEqual([]);
  });

  it('does not produce duplicate findings for the same sentence', () => {
    const text = 'Joining bonus repayment and clawback of relocation bonus applies.';
    const findings = detectClawback(text);
    const sentences = findings.map((f) => f.matchedText);
    expect(sentences.length).toBe(new Set(sentences).size);
  });
});
