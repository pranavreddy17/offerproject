import { describe, it, expect } from 'vitest';
import { detectBond } from '../../src/engine/rules/bond';

describe('detectBond', () => {
  it('detects "service agreement" with amount and duration', () => {
    const text =
      'You are required to sign a service agreement for 2 years. If you leave early, you must pay Rs. 2,00,000 as liquidated damages.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.severity === 'high')).toBe(true);
  });

  it('detects "minimum service period"', () => {
    const text =
      'The employee must serve a minimum service period of 18 months from the date of joining.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('bond');
  });

  it('marks high severity for bond >= 1 lakh', () => {
    const text =
      'In case of early exit, you shall pay Rs. 1,50,000 as bond amount.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
    expect(findings[0].extracted?.amount).toBe(150000);
  });

  it('marks high severity for duration >= 24 months', () => {
    const text = 'You must serve for 3 years under the employment bond.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
  });

  it('marks medium severity for smaller bond', () => {
    const text = 'Service bond of Rs. 50,000 for a period of 1 year.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('medium');
  });

  it('detects "lock-in period"', () => {
    const text = 'There is a lock-in period of 12 months from joining.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('CORRECTLY ignores negated bond statements (no false positives)', () => {
    const text = 'No service bond or minimum service commitment applies to your employment.';
    const findings = detectBond(text);
    expect(findings).toEqual([]);
  });

  it('CORRECTLY ignores "without any bond"', () => {
    const text = 'You are being hired on a permanent basis without any bond or lock-in period.';
    const findings = detectBond(text);
    expect(findings).toEqual([]);
  });

  it('correctly associates amount vs duration without mixing them up', () => {
    const text = 'Serve for 24 months under service bond or pay ₹2,00,000.';
    const findings = detectBond(text);
    expect(findings.length).toBe(1);
    expect(findings[0].extracted?.durationMonths).toBe(24);
    expect(findings[0].extracted?.amount).toBe(200000);
  });

  it('returns empty for text without bond mentions', () => {
    const text =
      'We are pleased to offer you the position of Software Engineer. Your salary will be Rs. 5,00,000 per annum.';
    const findings = detectBond(text);
    expect(findings).toEqual([]);
  });

  it('does not produce duplicate findings for the same sentence', () => {
    const text =
      'Service bond agreement requires you to serve for 2 years with bond amount of Rs. 1,00,000.';
    const findings = detectBond(text);
    const sentences = findings.map((f) => f.matchedText);
    const unique = new Set(sentences);
    expect(sentences.length).toBe(unique.size);
  });

  it('handles Indian number formats', () => {
    const text =
      'Bond penalty of ₹2,50,000/- if you leave before completing the bond period of 2 years.';
    const findings = detectBond(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].extracted?.amount).toBe(250000);
  });

  it('handles empty input without throwing', () => {
    expect(detectBond('')).toEqual([]);
  });

  it('handles garbage input without throwing', () => {
    expect(detectBond('asdf 123 !@#$ %%%')).toEqual([]);
  });
});
