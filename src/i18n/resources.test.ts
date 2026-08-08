import { describe, expect, it } from 'vitest';
import { resources } from './resources';

/** A missing key is a type error at build time; this guards the shape at runtime too. */
function leafKeys(object: unknown, prefix = ''): string[] {
  if (typeof object !== 'object' || object === null) return [prefix];
  return Object.entries(object).flatMap(([key, value]) =>
    leafKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('translations', () => {
  it('every language has the same key set', () => {
    const en = leafKeys(resources.en.common).sort();
    const de = leafKeys(resources.de.common).sort();
    expect(de).toEqual(en);
  });

  it('has no empty strings', () => {
    for (const [language, bundle] of Object.entries(resources)) {
      const empty = Object.entries(flatten(bundle.common)).filter(([, value]) => !value.trim());
      expect(empty, `empty values in ${language}`).toEqual([]);
    }
  });
});

function flatten(object: object, prefix = ''): Record<string, string> {
  return Object.entries(object).reduce<Record<string, string>>((accumulator, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      accumulator[path] = value;
    } else {
      Object.assign(accumulator, flatten(value as object, path));
    }
    return accumulator;
  }, {});
}
