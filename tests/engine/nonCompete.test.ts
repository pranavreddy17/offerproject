import { describe, it, expect } from 'vitest';
import { detectNonCompete } from '../../src/engine/rules/nonCompete';

describe('detectNonCompete', () => {
  it('detects "non-compete" clause', () => {
    const text =
      'You agree to a non-compete clause for 12 months after separation from the company.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('nonCompete');
  });

  it('detects "shall not join a competitor"', () => {
    const text =
      'The employee shall not join a competitor for a period of 6 months after leaving.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('marks high severity for >= 12 months', () => {
    const text = 'Non-compete restriction applies for 24 months after exit.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
  });

  it('marks low severity for < 6 months', () => {
    const text = 'Non-compete period of 3 months.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('low');
  });

  it('detects moonlighting restrictions', () => {
    const text =
      'Moonlighting is strictly prohibited during the tenure of employment.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.title.includes('Moonlighting'))).toBe(true);
  });

  it('detects "exclusive service"', () => {
    const text = 'You shall provide exclusive service to the company.';
    const findings = detectNonCompete(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('returns empty for no non-compete text', () => {
    expect(
      detectNonCompete('We are excited to have you on our team!'),
    ).toEqual([]);
  });

  it('handles empty input', () => {
    expect(detectNonCompete('')).toEqual([]);
  });

  it('does not duplicate findings', () => {
    const text =
      'You must not join a competitor and non-compete applies for 12 months.';
    const findings = detectNonCompete(text);
    const sentences = findings.map((f) => f.matchedText);
    expect(sentences.length).toBe(new Set(sentences).size);
  });
});
