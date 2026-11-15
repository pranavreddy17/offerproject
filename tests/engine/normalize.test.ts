import { describe, it, expect } from 'vitest';
import { normalizeText, splitSentences } from '../../src/engine/normalize';

describe('normalizeText', () => {
  it('fixes hyphenation across line breaks', () => {
    expect(normalizeText('em-\nployee')).toBe('employee');
    expect(normalizeText('Soft-\nware')).toBe('Software');
  });

  it('normalizes line endings', () => {
    expect(normalizeText('hello\r\nworld')).toBe('hello\nworld');
    expect(normalizeText('hello\rworld')).toBe('hello\nworld');
  });

  it('replaces bullet characters', () => {
    expect(normalizeText('• Item one')).toBe('- Item one');
    expect(normalizeText('● Item two')).toBe('- Item two');
  });

  it('collapses excessive whitespace', () => {
    expect(normalizeText('hello    world')).toBe('hello world');
    expect(normalizeText('  indented  text  ')).toBe('indented text');
  });

  it('collapses excessive newlines', () => {
    expect(normalizeText('hello\n\n\n\nworld')).toBe('hello\n\nworld');
  });

  it('trims each line', () => {
    expect(normalizeText('  hello  \n  world  ')).toBe('hello\nworld');
  });

  it('handles empty input', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('splitSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    const result = splitSentences('Hello world. This is a test. Another one.');
    expect(result).toContain('Hello world.');
    expect(result).toContain('This is a test.');
  });

  it('filters very short fragments', () => {
    const result = splitSentences('OK. This is a sentence. X.');
    // "OK" and "X" are too short
    expect(result.some((s) => s === 'OK.')).toBe(false);
  });

  it('handles empty input', () => {
    expect(splitSentences('')).toEqual([]);
  });

  it('deduplicates sentences', () => {
    const result = splitSentences('Same sentence.\n\nSame sentence.');
    const matching = result.filter((s) => s.includes('Same sentence'));
    expect(matching.length).toBe(1);
  });
});
