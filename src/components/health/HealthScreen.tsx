import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState, Notice, SectionLabel, Spinner, StatusDot } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAlertOverview, useHealth } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Screen 05 — one card per moving part, plus the classification mix. */
export function HealthScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { data, isLoading, isError, refetch } = useHealth();
  const overview = useAlertOverview();

  // Both halves of the window, newest first: the intake table is about whether the webhook is
  // being called at all, so a resolved alert is just as much evidence as a firing one.
  const intake = useMemo(
    () =>
      [...(overview.data?.unresolved ?? []), ...(overview.data?.resolved ?? [])].sort((a, b) =>
        b.receivedAt.localeCompare(a.receivedAt),
      ),
    [overview.data],
  );

  if (isLoading) return <Spinner label={t('common.loading')} />;
  if (isError || !data) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void refetch()}
      />
    );
  }

  const headline =
    data.status === 'ok'
      ? t('health.ok')
      : data.status === 'degraded'
        ? t('health.degraded')
        : t('health.broken');

  const mix = data.classificationMix;
  const total = Math.max(mix.rule + mix.llm + mix.fallback, 1);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('health.title')}
        subtitle={
          <span
            className={cn(
              data.status === 'ok' && 'text-healthy',
              data.status === 'degraded' && 'text-amber',
              data.status === 'broken' && 'text-broken',
            )}
          >
            {headline}
          </span>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-7">
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
          {data.services.map((service) => (
            <article
              key={service.name}
              className="flex flex-col gap-2.5 border border-line bg-raised p-4"
            >
              <div className="flex items-center gap-2">
                <StatusDot state={service.state} />
                <span className="text-[12px] text-ink">{service.name}</span>
              </div>
              <div
                className={cn(
                  'text-xl font-medium',
                  service.state === 'ok' && 'text-healthy',
                  service.state === 'warn' && 'text-amber',
                  service.state === 'bad' && 'text-broken',
                )}
              >
                {service.value}
              </div>
              <div className="text-[11px] leading-snug text-ink-faint">{service.note}</div>
            </article>
          ))}
        </div>

        {data.syncError && (
          <Notice label={t('health.syncError')} tone="broken">
            {data.syncError}
          </Notice>
        )}

        {data.fallbackCount > 0 && (
          <Notice label={t('digest.degraded')}>
            {t('health.unclassified', { count: data.fallbackCount })}
          </Notice>
        )}

        {intake.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <SectionLabel>{t('health.alertIntake')}</SectionLabel>
            <table className="w-full text-left">
              <thead>
                <tr className="label-caps border-b border-line text-ink-fainter">
                  <th className="w-16 pb-2 font-normal">{t('health.time')}</th>
                  <th className="w-20 pb-2 font-normal">{t('health.source')}</th>
                  <th className="w-24 pb-2 font-normal">{t('health.severity')}</th>
                  <th className="pb-2 font-normal">{t('health.alertTitle')}</th>
                  <th className="w-24 pb-2 font-normal max-md:hidden">{t('health.notified')}</th>
                </tr>
              </thead>
              <tbody>
                {intake.map((alert) => (
                  <tr key={alert.id} className="border-b border-line-faint text-[12px]">
                    <td className="py-2 text-ink-fainter">
                      {formatTime(alert.receivedAt, locale)}
                    </td>
                    <td className="py-2 text-ink-dimmer">{alert.source}</td>
                    <td
                      className={cn(
                        'py-2',
                        alert.severity === 'critical' || alert.severity === 'error'
                          ? 'text-broken'
                          : alert.severity === 'warning'
                            ? 'text-amber'
                            : 'text-ink-faint',
                      )}
                    >
                      {alert.severity}
                    </td>
                    <td className="min-w-0 truncate py-2 text-ink-soft">{alert.title}</td>
                    <td className="py-2 text-ink-faint max-md:hidden">
                      {alert.notified
                        ? t('health.pushed', { time: formatTime(alert.receivedAt, locale) })
                        : t('health.heldForDigest')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {data.credentials.length > 0 && (
          <section className="flex max-w-xl flex-col gap-2.5">
            <SectionLabel>{t('health.credentials')}</SectionLabel>
            {/* Presence and validity only — this panel never sees a credential value. `unknown`
                is rendered as its own state rather than collapsed into "bad": a probe that could
                not run is not the same as a credential that is missing. */}
            {data.credentials.map((credential) => (
              <div
                key={credential.name}
                className="flex items-center justify-between gap-4 border-b border-line-faint py-1.5 text-[12px] last:border-b-0"
              >
                <span className="text-ink-dim">{credential.name}</span>
                <span
                  className={cn(
                    credential.state === 'ok' && 'text-healthy',
                    credential.state === 'warn' && 'text-amber',
                    credential.state === 'bad' && 'text-broken',
                    credential.state === 'unknown' && 'text-ink-fainter',
                  )}
                >
                  {credential.detail}
                </span>
              </div>
            ))}
          </section>
        )}

        <section className="flex max-w-xl flex-col gap-2.5">
          <SectionLabel>{t('health.classificationMix')}</SectionLabel>
          {/* Fallback share is the number that matters: it is how much of the day the classifier
              was unavailable for, and therefore how much of the digest is provisional. */}
          <div className="flex h-2.5 gap-0.5">
            <span
              className="bg-ink-ghost"
              style={{ width: `${(mix.rule / total) * 100}%` }}
              aria-hidden
            />
            <span
              className="bg-amber"
              style={{ width: `${(mix.llm / total) * 100}%` }}
              aria-hidden
            />
            <span
              className="bg-broken"
              style={{ width: `${(mix.fallback / total) * 100}%` }}
              aria-hidden
            />
          </div>
          <div className="flex gap-5 text-[11px] text-ink-faint">
            <span>
              {t('health.rule')} {mix.rule}
            </span>
            <span>
              {t('health.llm')} {mix.llm}
            </span>
            <span>
              {t('health.fallback')} {mix.fallback}
            </span>
          </div>
        </section>

        <div className="flex gap-6 text-[11px] text-ink-fainter">
          <span>
            {t('health.lastSync')}: {data.lastSync ? formatTime(data.lastSync, locale) : '—'}
          </span>
          {data.historyId && <span>historyId {data.historyId}</span>}
        </div>
      </div>
    </div>
  );
}
