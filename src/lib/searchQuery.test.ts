import { describe, expect, it } from 'vitest';
import { parseQuery, removeToken, tokensOf } from './searchQuery';

describe('parseQuery', () => {
  it('splits tokens from free text', () => {
    const parsed = parseQuery('from:uni-potsdam.de priority:high Abgabe');
    expect(parsed.from).toBe('uni-potsdam.de');
    expect(parsed.priority).toBe('high');
    expect(parsed.text).toBe('Abgabe');
  });

  it('keeps an unrecognised key as free text rather than dropping it', () => {
    const parsed = parseQuery('note:remember this');
    expect(parsed.text).toBe('note:remember this');
    expect(parsed.unknown).toEqual([]);
  });

  it('flags a known key with an invalid value', () => {
    const parsed = parseQuery('priority:urgent');
    expect(parsed.priority).toBeUndefined();
    expect(parsed.unknown).toEqual(['priority:urgent']);
  });

  it('requires ISO dates', () => {
    expect(parseQuery('after:2026-08-01').after).toBe('2026-08-01');
    expect(parseQuery('after:yesterday').after).toBeUndefined();
  });

  it('lists active filters as chips', () => {
    const tokens = tokensOf(parseQuery('priority:noise from:x.com'));
    expect(tokens).toEqual([
      { key: 'priority', value: 'noise' },
      { key: 'from', value: 'x.com' },
    ]);
  });

  it('removes a token from the raw query', () => {
    const input = 'from:uni-potsdam.de priority:high Abgabe';
    expect(removeToken(input, { key: 'priority', value: 'high' })).toBe(
      'from:uni-potsdam.de Abgabe',
    );
  });
});
