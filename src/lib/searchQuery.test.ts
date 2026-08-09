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

describe('category filter', () => {
  it('parses a category token and exposes it as a chip', () => {
    const parsed = parseQuery('category:Billing rechnung');
    expect(parsed.category).toBe('Billing');
    expect(parsed.text).toBe('rechnung');
    expect(tokensOf(parsed)).toContainEqual({ key: 'category', value: 'Billing' });
  });

  it('accepts the cat: shorthand', () => {
    expect(parseQuery('cat:Alerts').category).toBe('Alerts');
  });

  it('preserves the name verbatim, since the server matches case-insensitively', () => {
    // Lowercasing here would make the removable chip disagree with what the user typed.
    expect(parseQuery('category:bILLing').category).toBe('bILLing');
  });

  it('removing the chip edits the raw query', () => {
    const query = 'category:Billing rechnung';
    const parsed = parseQuery(query);
    expect(removeToken(query, { key: 'category', value: 'Billing' })).toBe('rechnung');
    expect(parsed.unknown).toEqual([]);
  });
});

describe('removeToken casing', () => {
  it('removes a chip whose value is not lowercase', () => {
    // Regression: the comparison lowercased only one side, so any filter with a user-chosen
    // value — which categories are — had a chip whose × silently did nothing.
    expect(removeToken('category:Billing x', { key: 'category', value: 'Billing' })).toBe('x');
  });

  it('removes a chip written with the shorthand key', () => {
    expect(removeToken('cat:Alerts x', { key: 'category', value: 'Alerts' })).toBe('x');
  });
});
