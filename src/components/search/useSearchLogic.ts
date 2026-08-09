import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useMessageSearch } from '@/api/queries';
import {
  parseQuery,
  removeToken,
  searchExamples,
  tokensOf,
  type QueryToken,
} from '@/lib/searchQuery';

export function useSearchLogic() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Deferred so typing stays responsive without a hand-rolled debounce timer.
  const deferredQuery = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);

  const params = useMemo(
    () => ({
      q: parsed.text,
      priority: parsed.priority,
      sender: parsed.from,
      after: parsed.after,
      before: parsed.before,
      classifiedBy: parsed.classifiedBy,
      limit: 50,
    }),
    [parsed],
  );

  const hasCriteria = Object.entries(params).some(
    ([key, value]) => key !== 'limit' && value !== undefined,
  );

  const search = useMessageSearch(params, hasCriteria);

  // Measured around the query itself rather than taken from a header: what the user cares about
  // is how long the answer took to arrive, which includes the network, not just the SQL.
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined);
  const startedAt = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (search.isFetching) {
      startedAt.current = performance.now();
      return;
    }
    if (startedAt.current !== undefined) {
      setElapsedMs(Math.round(performance.now() - startedAt.current));
      startedAt.current = undefined;
    }
  }, [search.isFetching]);

  // Computed once per mount rather than per render: the date example must not shift underfoot
  // between the click and the search it produces.
  const examples = useMemo(() => searchExamples(new Date()), []);

  /**
   * Appends an example instead of replacing the box.
   *
   * The filters combine — `priority:high classified_by:fallback` is a real question — so clicking a
   * second one has to narrow the search rather than throw the first one away. Focus goes back to
   * the input because the click is usually the start of typing, not the end of it.
   */
  const applyExample = useCallback((example: string) => {
    setQuery((current) => {
      const words = current.trim().split(/\s+/).filter(Boolean);
      if (words.includes(example)) return current;
      return [...words, example].join(' ');
    });
    inputRef.current?.focus();
  }, []);

  // ⌘K / Ctrl-K focuses the box from anywhere on the screen; esc clears it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.key === 'Escape') {
        setQuery('');
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, []);

  return {
    query,
    setQuery,
    inputRef,
    tokens: tokensOf(parsed),
    unknown: parsed.unknown,
    hasCriteria,
    examples,
    applyExample,
    results: search.data,
    isFetching: search.isFetching,
    elapsedMs,
    removeToken: (token: QueryToken) => setQuery((current) => removeToken(current, token)),
    clear: () => setQuery(''),
  };
}
