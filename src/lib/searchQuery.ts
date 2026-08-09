import type { ClassifiedBy, Priority } from '@/api/types';

/**
 * Parses the search box's `key:value` tokens into API parameters.
 *
 * Every token maps to a filter the backend actually implements. Tokens the design sketched but
 * the data cannot support — `has:alert`, for one, since messages carry no link to alert events —
 * are deliberately absent rather than accepted and silently ignored: a filter that appears to
 * apply but doesn't is worse than one that was never offered.
 */
export interface ParsedQuery {
  readonly from?: string;
  readonly priority?: Priority;
  readonly after?: string;
  readonly before?: string;
  readonly classifiedBy?: ClassifiedBy;
  /** Whatever was left once the tokens were removed. */
  readonly text?: string;
  /** Tokens that looked like filters but were not understood, kept for the UI to flag. */
  readonly unknown: readonly string[];
}

/** One removable chip in the UI. */
export interface QueryToken {
  readonly key: string;
  readonly value: string;
}

const PRIORITIES = new Set<string>(['high', 'normal', 'noise']);
const CLASSIFIERS = new Set<string>(['rule', 'llm', 'fallback']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseQuery(input: string): ParsedQuery {
  const words = input.trim().split(/\s+/).filter(Boolean);

  const text: string[] = [];
  const unknown: string[] = [];
  const result: {
    from?: string;
    priority?: Priority;
    after?: string;
    before?: string;
    classifiedBy?: ClassifiedBy;
  } = {};

  for (const word of words) {
    const separator = word.indexOf(':');
    if (separator <= 0) {
      text.push(word);
      continue;
    }

    const key = word.slice(0, separator).toLowerCase();
    const value = word.slice(separator + 1);
    if (!value) {
      unknown.push(word);
      continue;
    }

    switch (key) {
      case 'from':
        result.from = value;
        break;
      case 'priority':
        if (PRIORITIES.has(value.toLowerCase())) result.priority = value.toLowerCase() as Priority;
        else unknown.push(word);
        break;
      case 'after':
        if (ISO_DATE.test(value)) result.after = value;
        else unknown.push(word);
        break;
      case 'before':
        if (ISO_DATE.test(value)) result.before = value;
        else unknown.push(word);
        break;
      case 'classified_by':
      case 'classifiedby':
        if (CLASSIFIERS.has(value.toLowerCase()))
          result.classifiedBy = value.toLowerCase() as ClassifiedBy;
        else unknown.push(word);
        break;
      default:
        // An unrecognised `word:word` is far more likely a colon in prose than a typo'd filter,
        // so it stays part of the free-text search rather than being dropped.
        text.push(word);
    }
  }

  return { ...result, text: text.join(' ') || undefined, unknown };
}

/** The active filters, as chips, in a stable order. */
export function tokensOf(parsed: ParsedQuery): QueryToken[] {
  const tokens: QueryToken[] = [];
  if (parsed.priority) tokens.push({ key: 'priority', value: parsed.priority });
  if (parsed.from) tokens.push({ key: 'from', value: parsed.from });
  if (parsed.after) tokens.push({ key: 'after', value: parsed.after });
  if (parsed.before) tokens.push({ key: 'before', value: parsed.before });
  if (parsed.classifiedBy) tokens.push({ key: 'classified_by', value: parsed.classifiedBy });
  return tokens;
}

/** Removes one token from the raw query string, so a chip's × edits the box the user sees. */
export function removeToken(input: string, token: QueryToken): string {
  return input
    .trim()
    .split(/\s+/)
    .filter((word) => {
      const separator = word.indexOf(':');
      if (separator <= 0) return true;
      const key = word.slice(0, separator).toLowerCase().replace('classifiedby', 'classified_by');
      return !(key === token.key && word.slice(separator + 1).toLowerCase() === token.value);
    })
    .join(' ');
}
