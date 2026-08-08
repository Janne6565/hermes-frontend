import { useTranslation } from 'react-i18next';
import { Moon } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  Notice,
  SectionLabel,
  Spinner,
  Stat,
} from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useTodayDigest } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateLong, formatTime } from '@/lib/format';

/** Screen 02 — the day, grouped by priority, with the honesty panel on the right. */
export function DigestScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { data, isLoading, isError, refetch } = useTodayDigest();

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

  const { counts } = data;
  const silenced = counts.normal + counts.noise;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('digest.title')} subtitle={formatDateLong(data.date, locale)} />

      {counts.high + silenced === 0 ? (
        <EmptyState
          title={t('digest.empty')}
          hint={t('digest.emptyHint')}
          icon={<Moon size={22} aria-hidden />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-5 px-6 py-7 lg:overflow-y-auto lg:px-10">
            <div className="flex flex-wrap items-end gap-10">
              <Stat value={counts.high} label={t('priority.high')} tone="accent" />
              <Stat value={counts.normal} label={t('priority.normal')} tone="bright" />
              <Stat value={counts.noise} label={t('priority.noise')} />
              <div className="ml-auto text-right font-sans text-[13px] leading-relaxed text-ink-dimmer">
                <div>
                  {t('digest.interrupted', { count: counts.high })}
                </div>
                <div>{t('digest.neverReached', { count: silenced })}</div>
              </div>
            </div>

            {data.degraded && data.degradedReason && (
              <Notice label={t('digest.degraded')}>{data.degradedReason}</Notice>
            )}

            {data.high.length > 0 && (
              <section className="flex flex-col">
                <div className="flex items-baseline gap-2.5 pb-2.5">
                  <SectionLabel accent>{t('digest.highHeading')}</SectionLabel>
                  <span className="ml-auto text-[10.5px] text-ink-ghost">
                    {t('digest.stillOpen', {
                      open: String(data.high.filter((m) => !m.dismissed).length),
                      dismissed: String(data.high.filter((m) => m.dismissed).length),
                    })}
                  </span>
                </div>
                {data.high.map((message) => (
                  <article
                    key={message.id}
                    className="flex gap-4 border-t border-line-dim py-3.5"
                  >
                    <span className="w-11 flex-none pt-0.5 text-[11px] text-ink-fainter">
                      {formatTime(message.receivedAt, locale)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[13px] font-semibold text-ink-strong">
                        {message.senderName}
                      </span>
                      <span className="font-sans text-[14px] text-ink-soft">{message.subject}</span>
                      {message.reason && (
                        <span className="text-[11.5px] text-ink-dimmer italic">
                          {message.reason}
                        </span>
                      )}
                    </div>
                    <a
                      href={message.gmailUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex-none self-center text-[11px] text-ink-ghost hover:text-amber"
                    >
                      open
                    </a>
                  </article>
                ))}
              </section>
            )}

            {data.normal.length > 0 && (
              <section className="flex flex-col">
                <SectionLabel className="pb-2.5">{t('digest.normalHeading')}</SectionLabel>
                {data.normal.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-baseline gap-4 border-t border-line-faint py-1.5"
                  >
                    <span className="w-11 flex-none text-[11px] text-ink-ghost">
                      {formatTime(message.receivedAt, locale)}
                    </span>
                    <span className="w-44 flex-none truncate text-[12px] text-ink-muted">
                      {message.senderName}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-ink-dimmer">
                      {message.summary ?? message.subject}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {data.noise.count > 0 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-line-faint pt-2 text-[11.5px] text-ink-ghost">
                <span className="tracking-widest uppercase">
                  {t('digest.title')} — {data.noise.count}
                </span>
                <span>
                  {data.noise.categories
                    .map((category) => `${category.count} ${category.label}`)
                    .join(' · ')}
                </span>
              </div>
            )}
          </div>

          <aside className="flex w-full flex-none flex-col gap-6 border-t border-line-dim px-6 py-8 lg:w-85 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-2.5">
              <SectionLabel>{t('digest.delivery')}</SectionLabel>
              <div className="text-[12px] leading-relaxed text-ink-dim">
                {data.sentAt
                  ? t('digest.sentAt', { time: formatTime(data.sentAt, locale) })
                  : t('digest.notSent')}
              </div>
            </div>

            {data.alerts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <SectionLabel>{t('digest.alertEvents')}</SectionLabel>
                <ul className="flex flex-col gap-1.5 text-[12px] text-ink-dim">
                  {data.alerts.map((alert) => (
                    <li key={alert.id} className="flex gap-2">
                      <span className="text-ink-fainter">{alert.source}</span>
                      <span className="truncate">{alert.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
