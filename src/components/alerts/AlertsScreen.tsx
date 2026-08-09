import { useTranslation } from 'react-i18next';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionLabel, Spinner, Stat } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAlertsLogic } from './useAlertsLogic';

/**
 * Screen 03 — grouped by the app that paged, not by individual alert.
 *
 * Red is used here, and only here in the priority-bearing UI: an unresolved critical alert is the
 * one case that genuinely means something is broken.
 */
export function AlertsScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const alerts = useAlertsLogic();

  if (alerts.isLoading) return <Spinner label={t('common.loading')} />;
  if (alerts.isError) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void alerts.refetch()}
      />
    );
  }

  const nothingAtAll = alerts.unresolvedByApp.length === 0 && alerts.resolvedByApp.length === 0;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('alerts.title')} subtitle={t('alerts.subtitle')} />

      {nothingAtAll ? (
        <EmptyState
          title={t('alerts.empty')}
          hint={t('alerts.emptyHint')}
          icon={<ShieldCheck size={22} aria-hidden />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-7 lg:overflow-y-auto lg:px-8">
            <div className="flex flex-wrap items-end gap-10">
              <Stat
                value={alerts.unresolvedByApp.length}
                label={t('alerts.appsNeedAttention')}
                tone="accent"
              />
              <Stat value={alerts.resolvedByApp.length} label={t('alerts.quietAgain')} />
              <div className="ml-auto max-w-[42ch] text-right font-sans text-[13px] leading-relaxed text-ink-dimmer">
                {t('alerts.scopeNote')}
              </div>
            </div>

            {alerts.unresolvedByApp.length > 0 && (
              <section className="flex flex-col gap-3.5">
                <SectionLabel accent>{t('alerts.unresolved')}</SectionLabel>
                <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                  {alerts.unresolvedByApp.map((group) => {
                    const latest = group.alerts[0];
                    return (
                      <article
                        key={group.app}
                        className={cn(
                          'flex min-w-0 flex-col gap-3.5 border border-l-2 border-line p-4',
                          group.critical
                            ? 'border-l-broken bg-broken-wash'
                            : 'border-l-amber bg-amber-wash',
                        )}
                      >
                        <div className="flex min-w-0 items-baseline gap-2.5">
                          <h3 className="truncate text-[13.5px] font-semibold text-ink-strong">
                            {group.app}
                          </h3>
                          <span className="label-caps ml-auto flex-none text-ink-faint">
                            {latest.source}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2.5">
                          <span
                            className={cn(
                              'text-3xl leading-none font-semibold',
                              group.critical ? 'text-broken' : 'text-amber',
                            )}
                          >
                            {group.alerts.length}
                          </span>
                          <span className="label-caps text-ink-dimmer">
                            {t('alerts.unresolved')}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-sans text-[13px] leading-snug text-ink-soft">
                            {latest.title}
                          </span>
                          <span className="text-[11px] text-ink-faint">
                            {t('alerts.firingSince', {
                              time: formatTime(latest.receivedAt, locale),
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 border-t border-line-dim pt-2.5 text-[10.5px]">
                          <span className={group.critical ? 'text-broken' : 'text-ink-dimmer'}>
                            {routeLabel(
                              group.alerts.some((alert) => alert.notified),
                              t,
                            )}
                          </span>
                          {latest.sourceUrl && (
                            <a
                              href={latest.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="ml-auto inline-flex items-center gap-1 text-ink-ghost hover:text-amber"
                            >
                              {t('alerts.openIn', { source: latest.source })}
                              <ExternalLink size={10} aria-hidden />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {alerts.resolvedByApp.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionLabel>{t('alerts.resolvedToday')}</SectionLabel>
                {alerts.resolvedByApp.map((group) => (
                  <div
                    key={group.app}
                    className="flex items-baseline gap-4 border-t border-line-faint py-2"
                  >
                    <span className="w-36 flex-none truncate text-[12.5px] text-ink-muted">
                      {group.app}
                    </span>
                    <span className="w-20 flex-none text-[11px] text-ink-fainter">
                      {t('alerts.alertCount', { count: group.alerts.length })}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-sans text-[12.5px] text-ink-faint">
                      {group.alerts[0].title}
                    </span>
                    <span className="flex-none text-[11px] text-ink-ghost">
                      {formatTime(group.alerts[0].resolvedAt, locale)}
                    </span>
                  </div>
                ))}
              </section>
            )}

            <p className="mt-auto border-t border-line-faint pt-3.5 font-sans text-[12px] text-ink-ghost">
              {t('alerts.scopeFooter')}
            </p>
          </div>

          <aside className="flex w-full flex-none flex-col gap-6 border-t border-line-dim px-6 py-7 lg:w-90 lg:overflow-y-auto lg:border-t-0 lg:border-l">
            {alerts.routing && (
              <section className="flex flex-col gap-3">
                <SectionLabel>{t('alerts.howRouted')}</SectionLabel>
                {/* Two buckets, not three: an alert either earned a push or waited for the
                    digest. Hermes has no alert-silencing rules, so there is no third number. */}
                <RoutingRow
                  count={alerts.routing.pushed}
                  label={t('alerts.routedPushed')}
                  note={t('alerts.routedPushedNote')}
                  tone="accent"
                />
                <RoutingRow
                  count={alerts.routing.held}
                  label={t('alerts.routedHeld')}
                  note={t('alerts.routedHeldNote')}
                />
                <RoutingRow
                  count={alerts.routing.resolved}
                  label={t('alerts.routedResolved')}
                  note={t('alerts.routedResolvedNote')}
                  tone="dim"
                />
              </section>
            )}

            {alerts.pushed.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionLabel accent>{t('alerts.pushedToPhone')}</SectionLabel>
                {alerts.pushed.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col gap-1.5 border-l-2 border-l-broken bg-broken-wash px-3 py-2.5"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] text-ink-strong">
                        {alert.app ?? alert.source}
                      </span>
                      <span className="ml-auto text-[11px] text-ink-fainter">
                        {formatTime(alert.receivedAt, locale)}
                      </span>
                    </div>
                    <p className="font-sans text-[12.5px] leading-snug text-ink-muted">
                      {alert.title}
                    </p>
                    {alert.acknowledgedAt ? (
                      <span className="text-[10.5px] text-ink-fainter">
                        {t('alerts.acknowledgedAt', {
                          time: formatTime(alert.acknowledgedAt, locale),
                        })}
                      </span>
                    ) : (
                      <div className="flex gap-1.5 pt-0.5">
                        <Button
                          onClick={() => alerts.acknowledge(alert.id)}
                          loading={alerts.acknowledgingId === alert.id}
                        >
                          {t('alerts.acknowledge')}
                        </Button>
                        <Button
                          onClick={() => alerts.snooze(alert.id, 4)}
                          loading={alerts.snoozingId === alert.id}
                        >
                          {t('alerts.snooze', { hours: '4' })}
                        </Button>
                      </div>
                    )}
                    {alert.snoozedUntil && (
                      <span className="text-[10.5px] text-ink-fainter">
                        {t('alerts.snoozedUntil', {
                          time: formatTime(alert.snoozedUntil, locale),
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="mt-auto flex flex-col gap-2 border-t border-line-dim pt-4">
              <SectionLabel>{t('alerts.sources')}</SectionLabel>
              {alerts.sources.map((source) => (
                <div
                  key={source.source}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="text-ink-dim">{source.source}</span>
                  <span
                    className={cn(
                      'text-[11.5px]',
                      source.everReceived ? 'text-ink-faint' : 'text-amber',
                    )}
                  >
                    {/* A source that has never delivered anything is indistinguishable from a
                        healthy one on a quiet day — unless it is called out as never-seen. */}
                    {source.everReceived
                      ? t('alerts.sourceEvents', { count: source.eventsInWindow })
                      : t('alerts.sourceNeverSeen')}
                  </span>
                </div>
              ))}
              <p className="text-[11px] text-ink-ghost">{t('alerts.silencedNote')}</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function routeLabel(pushed: boolean, t: ReturnType<typeof useTranslation>['t']): string {
  return pushed ? t('alerts.pushedToPhone') : t('alerts.heldForDigest');
}

function RoutingRow({
  count,
  label,
  note,
  tone,
}: {
  readonly count: number;
  readonly label: string;
  readonly note: string;
  readonly tone?: 'accent' | 'dim';
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line-faint pb-2.5 last:border-b-0">
      <span
        className={cn(
          'w-8 flex-none text-lg font-semibold',
          tone === 'accent' ? 'text-amber' : tone === 'dim' ? 'text-ink-fainter' : 'text-ink-dim',
        )}
      >
        {count}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[12px] text-ink-soft">{label}</span>
        <span className="font-sans text-[11.5px] leading-snug text-ink-faint">{note}</span>
      </div>
    </div>
  );
}
