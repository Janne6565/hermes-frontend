import { describe, expect, it } from 'vitest';
import { toIsoDate } from './format';

describe('toIsoDate', () => {
  it('uses the local calendar day, not UTC', () => {
    // 23:30 local on 8 August is already 9 August in UTC for positive offsets. Using
    // toISOString() here would put late-evening mail in tomorrow's digest.
    const lateEvening = new Date(2026, 7, 8, 23, 30);
    expect(toIsoDate(lateEvening)).toBe('2026-08-08');
  });

  it('handles the start of the day', () => {
    expect(toIsoDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});
