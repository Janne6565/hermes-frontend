import {
  useAutomations,
  useMessageSearch,
  useHealth,
  useAlerts,
  useCategoryOverview,
  useRules,
} from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { INBOX_LIMIT } from '@/components/inbox/useInboxLogic';
import type { ServiceState } from '@/api/types';

/**
 * Everything the rail displays.
 *
 * The message counts read the *same* query as the inbox — same key, so React Query serves both
 * from one cache entry. That is deliberate: the rail rows navigate into the inbox's filtered
 * views, so a rail counting today's mail while the inbox listed the last 200 messages would send
 * you to a "High · open 3" row showing eleven items.
 */
export function useNavRailLogic() {
  const { locale } = useLanguage();
  const recent = useMessageSearch({ limit: INBOX_LIMIT });
  const health = useHealth();
  const alerts = useAlerts();
  const rules = useRules();
  const automations = useAutomations();
  const categories = useCategoryOverview();

  const messages = recent.data ?? [];
  const counts = {
    high: messages.filter((message) => message.priority === 'high').length,
    normal: messages.filter((message) => message.priority === 'normal').length,
    noise: messages.filter((message) => message.priority === 'noise').length,
  };

  // "High · open" and "Dismissed" split the same tier, so they are counted off the message list
  // rather than off `counts.high` — the rail has to add up to what the inbox actually shows.
  const high = messages.filter((message) => message.priority === 'high');
  const openHigh = high.filter((message) => !message.dismissed).length;

  return {
    counts: { ...counts, total: counts.high + counts.normal + counts.noise },
    openHigh,
    dismissed: high.length - openHigh,
    // The rail's dot mirrors the health screen exactly: red only when mail is not being read.
    health: healthDot(health.data?.status),
    lastSync: health.data?.lastSync ? formatTime(health.data.lastSync, locale) : '—',
    historyId: health.data?.historyId,
    alertCount: alerts.data?.length ?? 0,
    ruleCount: rules.data?.filter((rule) => rule.enabled).length ?? 0,
    automationCount:
      automations.data?.automations.filter((automation) => automation.enabled).length ?? 0,
    categoryCount: categories.data?.categories.length ?? 0,
  };
}

function healthDot(status: string | undefined): ServiceState {
  if (status === 'broken') return 'bad';
  if (status === 'degraded') return 'warn';
  return 'ok';
}
