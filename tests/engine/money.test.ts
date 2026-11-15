import { describe, it, expect } from 'vitest';
import { parseMoney, findMoneyAmounts, parseDurationMonths } from '../../src/engine/money';

describe('parseMoney', () => {
  it('parses plain numbers', () => {
    expect(parseMoney('200000')).toBe(200000);
    expect(parseMoney('50000')).toBe(50000);
  });

  it('parses Indian comma-separated format', () => {
    expect(parseMoney('2,00,000')).toBe(200000);
    expect(parseMoney('3,00,000')).toBe(300000);
    expect(parseMoney('10,00,000')).toBe(1000000);
    expect(parseMoney('1,50,000')).toBe(150000);
    expect(parseMoney('50,000')).toBe(50000);
  });

  it('parses with ₹ symbol', () => {
    expect(parseMoney('₹2,00,000')).toBe(200000);
    expect(parseMoney('₹ 5,00,000')).toBe(500000);
    expect(parseMoney('₹50000')).toBe(50000);
  });

  it('parses with Rs. prefix', () => {
    expect(parseMoney('Rs. 2,00,000')).toBe(200000);
    expect(parseMoney('Rs 50000')).toBe(50000);
    expect(parseMoney('Rs.50000')).toBe(50000);
  });

  it('parses with INR prefix', () => {
    expect(parseMoney('INR 2,00,000')).toBe(200000);
    expect(parseMoney('INR 200000/-')).toBe(200000);
  });

  it('parses trailing /- format', () => {
    expect(parseMoney('₹ 1,00,000/-')).toBe(100000);
    expect(parseMoney('Rs. 2,00,000/-')).toBe(200000);
    expect(parseMoney('50,000/-')).toBe(50000);
  });

  it('parses LPA (Lakhs Per Annum)', () => {
    expect(parseMoney('2 LPA')).toBe(200000);
    expect(parseMoney('12 LPA')).toBe(1200000);
    expect(parseMoney('3.5 lpa')).toBe(350000);
    expect(parseMoney('12LPA')).toBe(1200000);
  });

  it('parses lakh/lakhs/lacs', () => {
    expect(parseMoney('2 lakh')).toBe(200000);
    expect(parseMoney('2 lakhs')).toBe(200000);
    expect(parseMoney('2.5 lacs')).toBe(250000);
    expect(parseMoney('1.5 lakh')).toBe(150000);
    expect(parseMoney('Rs. 2 lakh')).toBe(200000);
  });

  it('parses crore', () => {
    expect(parseMoney('1 crore')).toBe(10000000);
    expect(parseMoney('1.5 crore')).toBe(15000000);
    expect(parseMoney('2 crores')).toBe(20000000);
  });

  it('returns null for invalid input', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('hello world')).toBeNull();
  });

  it('handles null/undefined gracefully', () => {
    expect(parseMoney(null as unknown as string)).toBeNull();
    expect(parseMoney(undefined as unknown as string)).toBeNull();
  });
});

describe('findMoneyAmounts', () => {
  it('finds multiple amounts in text', () => {
    const text = 'Salary of Rs. 5,00,000 and bonus of ₹1,00,000';
    const amounts = findMoneyAmounts(text);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
    expect(amounts.some((a) => a.value === 500000)).toBe(true);
    expect(amounts.some((a) => a.value === 100000)).toBe(true);
  });

  it('finds LPA amounts', () => {
    const text = 'Your CTC will be 12 LPA';
    const amounts = findMoneyAmounts(text);
    expect(amounts.some((a) => a.value === 1200000)).toBe(true);
  });

  it('CRITICAL: Never mistakes duration numbers (24 months) for financial amounts', () => {
    const text = 'An employee must serve for 24 months or pay ₹2,00,000.';
    const amounts = findMoneyAmounts(text);
    // Should ONLY find 200000, NOT 24!
    expect(amounts.some((a) => a.value === 24)).toBe(false);
    expect(amounts.some((a) => a.value === 200000)).toBe(true);
    expect(amounts.length).toBe(1);
  });

  it('Never mistakes 3 years or 90 days for money', () => {
    const text = 'Serve 3 years under bond or pay Rs. 1,50,000. Notice period is 90 days.';
    const amounts = findMoneyAmounts(text);
    expect(amounts.some((a) => a.value === 3)).toBe(false);
    expect(amounts.some((a) => a.value === 90)).toBe(false);
    expect(amounts.some((a) => a.value === 150000)).toBe(true);
  });

  it('returns empty array for text without money', () => {
    expect(findMoneyAmounts('Hello world')).toEqual([]);
    expect(findMoneyAmounts('')).toEqual([]);
    expect(findMoneyAmounts('We will meet in 15 days for 2 hours.')).toEqual([]);
  });
});

describe('parseDurationMonths', () => {
  it('parses years', () => {
    expect(parseDurationMonths('2 years')).toBe(24);
    expect(parseDurationMonths('1 year')).toBe(12);
    expect(parseDurationMonths('1.5 years')).toBe(18);
  });

  it('parses months', () => {
    expect(parseDurationMonths('6 months')).toBe(6);
    expect(parseDurationMonths('18 months')).toBe(18);
    expect(parseDurationMonths('1 month')).toBe(1);
  });

  it('parses days (approximate)', () => {
    expect(parseDurationMonths('90 days')).toBe(3);
    expect(parseDurationMonths('30 days')).toBe(1);
    expect(parseDurationMonths('365 days')).toBe(12);
  });

  it('returns null for invalid input', () => {
    expect(parseDurationMonths('')).toBeNull();
    expect(parseDurationMonths('abc')).toBeNull();
    expect(parseDurationMonths(null as unknown as string)).toBeNull();
  });
});
