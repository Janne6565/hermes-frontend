import { useMemo, useState } from 'react';
import {
  useConfig,
  useDigest,
  useDigestStats,
  useSendDigestNow,
  useTodayDigest,
} from '@/api/queries';
import { toIsoDate } from '@/lib/format';

/**
 * The digest screen's state.
 *
 * Today is built live; any earlier day is read back from the stored record. The screen therefore
 * has two sources, and which one is in use is a fact the user can see — a historical digest is
 * what was *delivered*, not a re-derivation of it.
 */
export function useDigestLogic() {
  const [date, setDate] = useState<string>(() => toIsoDate(new Date()));
  const today = toIsoDate(new Date());
  const isToday = date === today;

  const live = useTodayDigest();
  const historical = useDigest(date);
  const stats = useDigestStats(7);
  const config = useConfig();
  const sendNow = useSendDigestNow();

  const query = isToday ? live : historical;

  // Only days the stats window says exist are navigable. Stepping into a day with no stored
  // digest would land on a 404 that looks like a bug rather than an empty day.
  const navigableDays = useMemo(
    () => (stats.data?.days ?? []).filter((day) => day.hasStoredDigest || day.date === today),
    [stats.data, today],
  );

  const index = navigableDays.findIndex((day) => day.date === date);
  const previous = index > 0 ? navigableDays[index - 1].date : undefined;
  const next =
    index >= 0 && index < navigableDays.length - 1 ? navigableDays[index + 1].date : undefined;

  const maxInterruptions = Math.max(1, ...(stats.data?.days ?? []).map((day) => day.interruptions));

  return {
    date,
    isToday,
    setDate,
    previous,
    next,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    data: query.data,
    sendNow,
    week: stats.data?.days ?? [],
    maxInterruptions,
    config: config.data,
  };
}
