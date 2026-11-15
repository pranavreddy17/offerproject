import { describe, it, expect } from 'vitest';
import { detectNoticePeriod } from '../../src/engine/rules/noticePeriod';

describe('detectNoticePeriod', () => {
  it('detects "notice period of X days"', () => {
    const text = 'You must provide a notice period of 90 days before resignation.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('noticePeriod');
  });

  it('marks high severity for > 90 days', () => {
    const text = 'The notice period shall be 120 days from either side.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
  });

  it('marks medium severity for 60-90 days', () => {
    const text = 'You are required to give 60 days notice before leaving.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('medium');
  });

  it('marks low severity for <= 30 days', () => {
    const text = 'Either party may terminate by giving 30 days notice.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('low');
  });

  it('detects month-based notice period', () => {
    const text = 'Notice period of 4 months is required.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high'); // 4 months = 120 days > 90 days
  });

  it('detects asymmetric termination notice', () => {
    const text =
      'The company may terminate your employment without any notice or payment in lieu thereof.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.title.includes('Asymmetric'))).toBe(true);
  });

  it('boundary: exactly 30 days is low', () => {
    const text = 'Notice period of 30 days.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('low');
  });

  it('boundary: exactly 90 days is medium (not high)', () => {
    const text = 'Notice period of 90 days.';
    const findings = detectNoticePeriod(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('medium');
  });

  it('returns empty for text without notice period', () => {
    const text = 'We are pleased to offer you the position.';
    expect(detectNoticePeriod(text)).toEqual([]);
  });

  it('does not duplicate findings for same sentence', () => {
    const text = 'Notice period of 30 days notice in writing.';
    const findings = detectNoticePeriod(text);
    const sentences = findings.map((f) => f.matchedText);
    expect(sentences.length).toBe(new Set(sentences).size);
  });

  it('handles empty input', () => {
    expect(detectNoticePeriod('')).toEqual([]);
  });
});
