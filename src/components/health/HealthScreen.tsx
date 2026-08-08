import { useTranslation } from 'react-i18next';
import { ErrorState, Notice, SectionLabel, Spinner, StatusDot } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useHealth } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Screen 05 — one card per moving part, plus the classification mix. */
export function HealthScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { data, isLoading, isError, refetch } = useHealth();

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
