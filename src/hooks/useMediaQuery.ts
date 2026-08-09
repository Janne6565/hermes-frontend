import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Used to tell the two-pane layout from the single-column one. The breakpoint is duplicated from
 * Tailwind's `md` here because the inbox has to *behave* differently, not just look different:
 * without a reader pane on screen, selecting a row has to navigate somewhere instead.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = globalThis.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => globalThis.matchMedia(query).matches,
    () => false,
  );
}

/** True when the reader pane is on screen — Tailwind's `md` breakpoint. */
export function useHasReaderPane(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
