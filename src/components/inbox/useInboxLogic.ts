import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useDismissMessage, useMessageSearch, useSendFeedback } from '@/api/queries';
import type { Message } from '@/api/types';
import type { InboxView } from './views';

/**
 * How much recent mail the inbox holds. Beyond this, use search.
 *
 * Exported so the nav rail can request the identical query — same key, one cache entry, and the
 * rail counts can never drift from the list they navigate into.
 */
export const INBOX_LIMIT = 200;

/**
 * Everything the inbox screen does that isn't rendering.
 *
 * The list spans recent mail rather than a single day. It used to be derived from today's digest —
 * that kept the rail, inbox and digest trivially consistent, but it also meant the inbox showed
 * *only* today: after a cold start that backfilled five days, 92 of 100 messages were invisible
 * with nothing on screen explaining why. The digest is a daily artifact; the inbox is the working
 * surface, and those are different windows.
 */
export function useInboxLogic() {
  const recent = useMessageSearch({ limit: INBOX_LIMIT });
  const dismiss = useDismissMessage();
  const feedback = useSendFeedback();

  const { view } = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noiseExpanded, setNoiseExpanded] = useState(view === 'noise');

  const messages = useMemo(() => recent.data ?? [], [recent.data]);

  const allHigh = useMemo(
    () => messages.filter((message) => message.priority === 'high'),
    [messages],
  );
  const allNormal = useMemo(
    () => messages.filter((message) => message.priority === 'normal'),
    [messages],
  );
  const allNoise = useMemo(
    () => messages.filter((message) => message.priority === 'noise'),
    [messages],
  );

  const counts = useMemo(
    () => ({ high: allHigh.length, normal: allNormal.length, noise: allNoise.length }),
    [allHigh, allNormal, allNoise],
  );

  /**
   * Noise stays a count, never a list — but the count is only trustworthy if you can see what it
   * was made of. Grouping by sender domain is a fact about the data rather than a guess at a
   * category, and it is what makes "23 noise" auditable in one glance.
   */
  const noise = useMemo(() => {
    const byDomain = new Map<string, number>();
    for (const message of allNoise) {
      const domain = message.sender.split('@').pop()?.replace(/>$/, '').toLowerCase() ?? 'unknown';
      byDomain.set(domain, (byDomain.get(domain) ?? 0) + 1);
    }
    return {
      count: allNoise.length,
      categories: [...byDomain.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [allNoise]);

  // The view decides which sections exist at all, not just which rows are dimmed — a filtered
  // list that still shows the other tiers underneath would not be a filter.
  const showHigh = view === undefined || view === 'high' || view === 'dismissed';
  const showNormal = view === undefined || view === 'normal';
  const showNoise = view === undefined || view === 'noise';

  const high = useMemo(() => {
    if (!showHigh) return [];
    if (view === 'high') return allHigh.filter((message) => !message.dismissed);
    if (view === 'dismissed') return allHigh.filter((message) => message.dismissed);
    return allHigh;
  }, [allHigh, showHigh, view]);

  const normal = useMemo(() => (showNormal ? allNormal : []), [allNormal, showNormal]);

  /** Navigation order for j/k — high first, then normal, matching what is on screen. */
  const ordered = useMemo(() => [...high, ...normal], [high, normal]);

  const selected = useMemo(
    () => ordered.find((message) => message.id === selectedId) ?? null,
    [ordered, selectedId],
  );

  // Select the first item once loaded, but never fight a selection the user already made.
  // A selection that the current filter hides is dropped rather than kept invisibly.
  useEffect(() => {
    if (ordered.length === 0) return;
    if (!selectedId || !ordered.some((message) => message.id === selectedId)) {
      setSelectedId(ordered[0].id);
    }
  }, [ordered, selectedId]);

  const setView = useCallback(
    (next: InboxView | undefined) => {
      void navigate({ search: next ? { view: next } : {} });
    },
    [navigate],
  );

  const move = useCallback(
    (delta: number) => {
      if (ordered.length === 0) return;
      const current = ordered.findIndex((message) => message.id === selectedId);
      const next = Math.min(Math.max(current + delta, 0), ordered.length - 1);
      setSelectedId(ordered[next].id);
    },
    [ordered, selectedId],
  );

  const toggleDismissed = useCallback(
    (message: Message) => dismiss.mutate({ id: message.id, dismissed: !message.dismissed }),
    [dismiss],
  );

  const neverNotifySender = useCallback(
    (message: Message) =>
      feedback.mutate({ messageId: message.id, shouldHaveBeen: 'noise', applyToDomain: false }),
    [feedback],
  );

  const markNormal = useCallback(
    (message: Message) =>
      feedback.mutate({ messageId: message.id, shouldHaveBeen: 'normal', applyToDomain: false }),
    [feedback],
  );

  const markHigh = useCallback(
    (message: Message) =>
      feedback.mutate({ messageId: message.id, shouldHaveBeen: 'high', applyToDomain: false }),
    [feedback],
  );

  // Keyboard navigation from the mockup's footer legend. Ignored while typing so the search box
  // and the rule editor don't swallow characters as commands.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case 'j':
          move(1);
          break;
        case 'k':
          move(-1);
          break;
        case 'e':
          if (selected) toggleDismissed(selected);
          break;
        case 'n':
          if (selected) neverNotifySender(selected);
          break;
        case 'h':
          if (selected) markHigh(selected);
          break;
        case 'Enter':
          // Opening means Gmail — Hermes is read-only, so there is nowhere else for it to go.
          if (selected) globalThis.open(selected.gmailUrl, '_blank', 'noopener,noreferrer');
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [move, selected, toggleDismissed, neverNotifySender, markHigh]);

  const openCount = allHigh.filter((message) => !message.dismissed).length;

  return {
    isLoading: recent.isLoading,
    isError: recent.isError,
    refetch: recent.refetch,
    view,
    setView,
    showHigh,
    showNormal,
    showNoise,
    high,
    normal,
    noise,
    counts,
    openCount,
    dismissedCount: allHigh.length - openCount,
    selected,
    selectedId,
    setSelectedId,
    noiseExpanded,
    toggleNoise: () => setNoiseExpanded((value) => !value),
    toggleDismissed,
    neverNotifySender,
    markNormal,
    markHigh,
    dismissingId: dismiss.isPending ? dismiss.variables?.id : undefined,
    feedbackPending: feedback.isPending,
  };
}
