import { useMemo } from 'react';
import { useAcknowledgeAlert, useAlertOverview, useSnoozeAlert } from '@/api/queries';
import type { AlertEvent } from '@/api/types';

/** Alerts grouped by the app that paged, which is the unit the operator actually reacts to. */
export interface AppGroup {
  readonly app: string;
  readonly alerts: readonly AlertEvent[];
  readonly critical: boolean;
}

export function useAlertsLogic(days = 1) {
  const overview = useAlertOverview(days);
  const acknowledge = useAcknowledgeAlert();
  const snooze = useSnoozeAlert();

  const unresolvedByApp = useMemo(
    () => groupByApp(overview.data?.unresolved ?? []),
    [overview.data],
  );
  const resolvedByApp = useMemo(() => groupByApp(overview.data?.resolved ?? []), [overview.data]);

  // The design's "pushed to your phone" panel is the same alerts seen through a different
  // question: not "what is broken" but "what did this cost you in interruptions".
  const pushed = useMemo(
    () => (overview.data?.unresolved ?? []).filter((alert) => alert.notified),
    [overview.data],
  );

  return {
    isLoading: overview.isLoading,
    isError: overview.isError,
    refetch: overview.refetch,
    unresolvedByApp,
    resolvedByApp,
    pushed,
    routing: overview.data?.routing,
    sources: overview.data?.sources ?? [],
    acknowledge: (id: string) => acknowledge.mutate(id),
    snooze: (id: string, hours = 4) => snooze.mutate({ id, hours }),
    acknowledgingId: acknowledge.isPending ? acknowledge.variables : undefined,
    snoozingId: snooze.isPending ? snooze.variables?.id : undefined,
  };
}

/** Grouping by app is what turns a firehose of alerts into "three things need you". */
function groupByApp(alerts: readonly AlertEvent[]): AppGroup[] {
  const groups = new Map<string, AlertEvent[]>();
  for (const alert of alerts) {
    const key = alert.app ?? alert.source;
    const existing = groups.get(key);
    if (existing) {
      existing.push(alert);
    } else {
      groups.set(key, [alert]);
    }
  }
  return [...groups.entries()].map(([app, grouped]) => ({
    app,
    alerts: grouped,
    critical: grouped.some((alert) => alert.severity === 'critical' || alert.severity === 'error'),
  }));
}
