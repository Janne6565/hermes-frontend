import { useMemo, useState } from 'react';
import { useDigestRange } from '@/api/queries';
import { toIsoDate } from '@/lib/format';

/** Mirrors the backend's ceiling, so an over-long span is refused before it costs a request. */
export const MAX_RANGE_DAYS = 92;

/** How far back the default span reaches when the panel is first opened. */
const DEFAULT_SPAN_DAYS = 7;

export type RangeProblem = 'inverted' | 'tooLong' | 'future';

/**
 * The range report's state.
 *
 * The draft dates and the submitted span are deliberately separate: building the report costs an
 * LLM call, so it happens when the user asks for it and never as a side effect of editing a date
 * field.
 */
export function useDigestRangeLogic() {
  const today = toIsoDate(new Date());
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => toIsoDate(daysAgo(DEFAULT_SPAN_DAYS)));
  const [to, setTo] = useState(today);
  const [submitted, setSubmitted] = useState<{ from: string; to: string }>();

  const query = useDigestRange(submitted);

  const problem = useMemo<RangeProblem | undefined>(() => {
    if (!from || !to) return undefined;
    if (to < from) return 'inverted';
    if (to > today) return 'future';
    if (spanDays(from, to) > MAX_RANGE_DAYS) return 'tooLong';
    return undefined;
  }, [from, to, today]);

  const days = from && to && !problem ? spanDays(from, to) : 0;

  return {
    open,
    from,
    to,
    days,
    problem,
    submitted,
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    setFrom,
    setTo,
    openPanel: () => setOpen(true),
    /** Closing drops the result too — a stale span left on screen reads as today's digest. */
    close: () => {
      setOpen(false);
      setSubmitted(undefined);
    },
    canSubmit: Boolean(from && to && !problem),
    submit: () => {
      if (from && to && !problem) setSubmitted({ from, to });
    },
  };
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Inclusive of both ends, matching the backend's own count. */
function spanDays(from: string, to: string): number {
  const millis = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(millis / 86_400_000) + 1;
}
