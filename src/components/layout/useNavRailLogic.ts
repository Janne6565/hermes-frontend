import { useTodayDigest, useHealth, useAlerts, useRules } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import type { ServiceState } from '@/api/types';

/** Everything the rail displays, derived from the same queries the screens use. */
export function useNavRailLogic() {
  const { locale } = useLanguage();
  const digest = useTodayDigest();
  const health = useHealth();
  const alerts = useAlerts();
  const rules = useRules();

  const counts = digest.data?.counts ?? { high: 0, normal: 0, noise: 0 };

  return {
    counts: { ...counts, total: counts.high + counts.normal + counts.noise },
    // The rail's dot mirrors the health screen exactly: red only when mail is not being read.
    health: healthDot(health.data?.status),
    lastSync: health.data?.lastSync ? formatTime(health.data.lastSync, locale) : '—',
    historyId: health.data?.historyId,
    alertCount: alerts.data?.length ?? 0,
    ruleCount: rules.data?.filter((rule) => rule.enabled).length ?? 0,
  };
}

function healthDot(status: string | undefined): ServiceState {
  if (status === 'broken') return 'bad';
  if (status === 'degraded') return 'warn';
  return 'ok';
}
