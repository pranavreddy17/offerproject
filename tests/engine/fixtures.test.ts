import { describe, it, expect } from 'vitest';
import { analyze } from '../../src/engine/analyze';

import riskyOffer from '../../src/fixtures/risky-offer.txt?raw';
import cleanOffer from '../../src/fixtures/clean-offer.txt?raw';
import borderlineOffer from '../../src/fixtures/borderline-offer.txt?raw';
import messyOffer from '../../src/fixtures/messy-formatted-offer.txt?raw';
import noClausesOffer from '../../src/fixtures/no-clauses-offer.txt?raw';
import emptyIshOffer from '../../src/fixtures/empty-ish-offer.txt?raw';

const fixtures: Record<string, string> = {
  'risky-offer.txt': riskyOffer,
  'clean-offer.txt': cleanOffer,
  'borderline-offer.txt': borderlineOffer,
  'messy-formatted-offer.txt': messyOffer,
  'no-clauses-offer.txt': noClausesOffer,
  'empty-ish-offer.txt': emptyIshOffer,
};

function loadFixture(name: string): string {
  return fixtures[name] || '';
}

describe('Fixture-based analysis tests', () => {
  describe('risky-offer.txt', () => {
    const result = analyze(loadFixture('risky-offer.txt'));

    it('finds multiple high-severity clauses', () => {
      const highFindings = result.findings.filter(
        (f) => f.severity === 'high',
      );
      expect(highFindings.length).toBeGreaterThanOrEqual(2);
    });

    it('overall risk is high', () => {
      expect(result.overallRisk).toBe('high');
    });

    it('detects service bond', () => {
      expect(result.findings.some((f) => f.type === 'bond')).toBe(true);
    });

    it('detects notice period', () => {
      expect(result.findings.some((f) => f.type === 'noticePeriod')).toBe(
        true,
      );
    });

    it('detects clawback', () => {
      expect(result.findings.some((f) => f.type === 'clawback')).toBe(true);
    });

    it('detects variable pay', () => {
      expect(result.findings.some((f) => f.type === 'variablePay')).toBe(
        true,
      );
    });

    it('detects training cost', () => {
      expect(result.findings.some((f) => f.type === 'trainingCost')).toBe(
        true,
      );
    });

    it('detects non-compete', () => {
      expect(result.findings.some((f) => f.type === 'nonCompete')).toBe(
        true,
      );
    });

    it('extracts CTC', () => {
      expect(result.ctcExtracted.totalCtc).toBe(800000);
    });
  });

  describe('clean-offer.txt', () => {
    const result = analyze(loadFixture('clean-offer.txt'));

    it('has low overall risk', () => {
      expect(result.overallRisk).toBe('low');
    });

    it('has few or no high-severity findings', () => {
      const highFindings = result.findings.filter(
        (f) => f.severity === 'high',
      );
      expect(highFindings.length).toBe(0);
    });

    it('detects notice period (30 days, low)', () => {
      const np = result.findings.filter(
        (f) => f.type === 'noticePeriod',
      );
      if (np.length > 0) {
        expect(np[0].severity).toBe('low');
      }
    });

    it('reports multiple clauses not found', () => {
      expect(result.clausesNotFound.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('borderline-offer.txt', () => {
    const result = analyze(loadFixture('borderline-offer.txt'));

    it('detects medium-risk notice period (60 days)', () => {
      const np = result.findings.filter(
        (f) => f.type === 'noticePeriod',
      );
      expect(np.length).toBeGreaterThan(0);
      expect(np[0].severity).toBe('medium');
    });

    it('detects variable pay', () => {
      expect(result.findings.some((f) => f.type === 'variablePay')).toBe(
        true,
      );
    });
  });

  describe('messy-formatted-offer.txt', () => {
    const result = analyze(loadFixture('messy-formatted-offer.txt'));

    it('still detects clauses despite poor formatting', () => {
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('detects service bond', () => {
      expect(result.findings.some((f) => f.type === 'bond')).toBe(true);
    });
  });

  describe('no-clauses-offer.txt', () => {
    const result = analyze(loadFixture('no-clauses-offer.txt'));

    it('has low overall risk', () => {
      expect(result.overallRisk).toBe('low');
    });

    it('reports all 6 clause types not found', () => {
      expect(result.clausesNotFound.length).toBe(6);
    });
  });

  describe('empty-ish-offer.txt', () => {
    const result = analyze(loadFixture('empty-ish-offer.txt'));

    it('shows warning about short text', () => {
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('has zero findings', () => {
      expect(result.findings.length).toBe(0);
    });
  });
});
