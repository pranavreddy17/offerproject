import { describe, it, expect } from 'vitest';
import { detectTrainingCost } from '../../src/engine/rules/trainingCost';

describe('detectTrainingCost', () => {
  it('detects training cost recovery', () => {
    const text =
      'The company will invest Rs. 3,00,000 in training cost. If you resign within 18 months, you shall reimburse the company for the training cost.';
    const findings = detectTrainingCost(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('trainingCost');
  });

  it('marks high severity for large amount', () => {
    const text =
      'Training cost of Rs. 5,00,000 shall be recovered if the employee leaves within 2 years.';
    const findings = detectTrainingCost(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('high');
  });

  it('marks medium severity for moderate amount', () => {
    const text =
      'Training expenses of Rs. 50,000 may be recovered if you leave within 6 months.';
    const findings = detectTrainingCost(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('medium');
  });

  it('detects "reimburse the company" for training', () => {
    const text =
      'You will need to reimburse the company for the cost of training if you resign early.';
    const findings = detectTrainingCost(text);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('returns empty for no training cost mentions', () => {
    expect(
      detectTrainingCost('Your work hours are 9 AM to 6 PM.'),
    ).toEqual([]);
  });

  it('handles empty input', () => {
    expect(detectTrainingCost('')).toEqual([]);
  });

  it('does not duplicate findings', () => {
    const text = 'Training cost recovery and training expenses reimbursement within 1 year.';
    const findings = detectTrainingCost(text);
    const sentences = findings.map((f) => f.matchedText);
    expect(sentences.length).toBe(new Set(sentences).size);
  });
});
