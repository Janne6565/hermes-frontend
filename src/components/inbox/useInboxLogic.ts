import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDismissMessage, useSendFeedback, useTodayDigest } from '@/api/queries';
import type { Message } from '@/api/types';

/**
 * Everything the inbox screen does that isn't rendering.
 *
 * The list is derived from today's digest rather than a separate messages query: the digest is
 * already the day's authoritative grouping, and reusing it means the rail counts, the inbox and
 * the digest screen can never disagree with each other.
 */
export function useInboxLogic() {
  const digest = useTodayDigest();
  const dismiss = useDismissMessage();
  const feedback = useSendFeedback();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noiseExpanded, setNoiseExpanded] = useState(false);

  const high = useMemo(() => digest.data?.high ?? [], [digest.data]);
  const normal = useMemo(() => digest.data?.normal ?? [], [digest.data]);

  /** Navigation order for j/k — high first, then normal, matching what is on screen. */
  const ordered = useMemo(() => [...high, ...normal], [high, normal]);

  const selected = useMemo(
    () => ordered.find((message) => message.id === selectedId) ?? null,
    [ordered, selectedId],
  );

  // Select the first item once loaded, but never fight a selection the user already made.
  useEffect(() => {
    if (!selectedId && ordered.length > 0) {
      setSelectedId(ordered[0].id);
    }
  }, [ordered, selectedId]);

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
        default:
          return;
      }
      event.preventDefault();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [move, selected, toggleDismissed, neverNotifySender]);

  const openCount = high.filter((message) => !message.dismissed).length;

  return {
    isLoading: digest.isLoading,
    isError: digest.isError,
    refetch: digest.refetch,
    high,
    normal,
    noise: digest.data?.noise,
    counts: digest.data?.counts,
    openCount,
    dismissedCount: high.length - openCount,
    selected,
    selectedId,
    setSelectedId,
    noiseExpanded,
    toggleNoise: () => setNoiseExpanded((value) => !value),
    toggleDismissed,
    neverNotifySender,
    markNormal,
    dismissingId: dismiss.isPending ? dismiss.variables?.id : undefined,
    feedbackPending: feedback.isPending,
  };
}
