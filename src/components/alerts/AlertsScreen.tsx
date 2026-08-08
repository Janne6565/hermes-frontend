import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { EmptyState, ErrorState, SectionLabel, Spinner, Stat } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAlerts } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AlertEvent } from '@/api/types';

/**
 * Screen 03 — grouped by the app that paged, not by individual alert.
 *
 * Red is used here, and only here in the priority-bearing UI: an unresolved critical alert is the
 * one case that genuinely means something is broken.
 */
export function AlertsScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { data, isLoading, isError, refetch } = useAlerts();

  const byApp = useMemo(() => groupByApp(data ?? []), [data]);

  if (isLoading) return <Spinner label={t('common.loading')} />;
  if (isError) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('alerts.title')} subtitle={t('alerts.subtitle')} />

      {byApp.length === 0 ? (
        <EmptyState
          title={t('alerts.empty')}
          hint={t('alerts.emptyHint')}
          icon={<ShieldCheck size={22} aria-hidden />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="flex flex-wrap items-end gap-10">
            <Stat
              value={byApp.length}
              label={t('alerts.appsNeedAttention')}
              tone="accent"
            />
            <div className="ml-auto max-w-[42ch] text-right font-sans text-[13px] leading-relaxed text-ink-dimmer">
              {t('alerts.scopeNote')}
            </div>
          </div>

          <section className="flex flex-col gap-3.5">
            <SectionLabel accent>{t('alerts.unresolved')}</SectionLabel>
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {byApp.map((group) => {
                const critical = group.alerts.some(
                  (alert) => alert.severity === 'critical' || alert.severity === 'error',
                );
                return (
                  <article
                    key={group.app}
                    className={cn(
                      'flex min-w-0 flex-col gap-3.5 border border-l-2 border-line p-4',
                      critical
                        ? 'border-l-broken bg-broken-wash'
                        : 'border-l-amber bg-amber-wash',
                    )}
                  >
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <h3 className="truncate text-[13.5px] font-semibold text-ink-strong">
                        {group.app}
                      </h3>
                      <span className="label-caps ml-auto flex-none text-ink-faint">
                        {group.alerts[0].source}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className={cn(
                          'text-3xl leading-none font-semibold',
                          critical ? 'text-broken' : 'text-amber',
                        )}
                      >
                        {group.alerts.length}
                      </span>
                      <span className="label-caps text-ink-dimmer">{t('alerts.unresolved')}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-sans text-[13px] leading-snug text-ink-soft">
                        {group.alerts[0].title}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {formatTime(group.alerts[0].receivedAt, locale)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 border-t border-line-dim pt-2.5 text-[10.5px]">
                      <span className={critical ? 'text-broken' : 'text-ink-dimmer'}>
                        {group.alerts.some((alert) => alert.notified)
                          ? t('alerts.pushedToPhone')
                          : t('alerts.heldForDigest')}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

interface AppGroup {
  readonly app: string;
  readonly alerts: readonly AlertEvent[];
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
  return [...groups.entries()].map(([app, grouped]) => ({ app, alerts: grouped }));
}
