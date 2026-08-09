import { describe, expect, it } from 'vitest';
import { parseQuery, removeToken, searchExamples, tokensOf } from './searchQuery';

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

describe('searchExamples', () => {
  // The suggestions are offered as valid syntax, so one the parser rejects would be the search box
  // teaching a filter it then strikes through. `priority:medium` is the exact mistake this catches:
  // plausible, but not one of high/normal/noise.
  it('offers only filters the parser understands', () => {
    for (const example of searchExamples(new Date('2026-08-09T12:00:00Z'))) {
      const parsed = parseQuery(example);
      expect(parsed.unknown, example).toEqual([]);
      expect(parsed.text, example).toBeUndefined();
      expect(tokensOf(parsed), example).toHaveLength(1);
    }
  });

  it('dates the window example relative to the day it is asked for', () => {
    expect(searchExamples(new Date('2026-08-09T12:00:00Z'))).toContain('after:2026-08-02');
  });
});
