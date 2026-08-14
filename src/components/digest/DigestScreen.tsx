import { useTranslation } from 'react-i18next';
import { CalendarRange, ChevronLeft, ChevronRight, Moon, Send } from 'lucide-react';
import { Button, EmptyState, ErrorState, Notice, SectionLabel, Spinner } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateLong, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DigestBody } from './DigestBody';
import { DigestRangePanel } from './DigestRangePanel';
import { useDigestLogic } from './useDigestLogic';
import { useDigestRangeLogic } from './useDigestRangeLogic';

/** Screen 02 — the day, grouped by priority, with the honesty panel on the right. */
export function DigestScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const digest = useDigestLogic();
  const range = useDigestRangeLogic();

  // The range report takes over the screen once it has a result: it is the same digest for a
  // different period, not a second thing to read beside the day.
  if (range.open && range.data) {
    return <DigestRangeView range={range} />;
  }

  const { data, isLoading, isError, refetch } = digest;

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
      <ScreenHeader
        title={t('digest.title')}
        subtitle={formatDateLong(data.date, locale)}
        actions={
          <>
            {/* In the header rather than next to the delivery panel: on a day where nothing
                arrived the screen renders an empty state instead of that panel, and re-sending is
                exactly what you want to reach on a day that looks suspiciously quiet. */}
            {digest.isToday && (
              <Button
                variant="outline"
                loading={digest.sendNow.isPending}
                onClick={() => digest.sendNow.mutate()}
              >
                <Send size={12} aria-hidden />
                {digest.sendNow.isPending ? t('digest.sending') : t('digest.sendNow')}
              </Button>
            )}
            {!range.open && (
              <Button onClick={() => range.openPanel()}>
                <CalendarRange size={12} aria-hidden />
                {t('digest.rangeOpen')}
              </Button>
            )}
            <NavButton
              label={t('digest.previousDay')}
              disabled={!digest.previous}
              onClick={() => digest.previous && digest.setDate(digest.previous)}
              icon={<ChevronLeft size={13} aria-hidden />}
            />
            <NavButton
              label={t('digest.nextDay')}
              disabled={!digest.next}
              onClick={() => digest.next && digest.setDate(digest.next)}
              icon={<ChevronRight size={13} aria-hidden />}
            />
          </>
        }
      />

      {range.open && <DigestRangePanel range={range} />}

      {/* Outside the branch below: the send button is in the header on every day, including the
          empty one that renders no body at all, so its failure has to be visible there too. */}
      {digest.sendNow.isError && (
        <div className="px-6 pt-4 lg:px-10">
          <Notice label={t('common.failed')} tone="broken">
            {t('digest.sendFailed')}
          </Notice>
        </div>
      )}

      {counts.high + silenced === 0 ? (
        <EmptyState
          title={t('digest.empty')}
          hint={t('digest.emptyHint')}
          icon={<Moon size={22} aria-hidden />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-5 px-6 py-7 lg:overflow-y-auto lg:px-10">
            <DigestBody
              counts={counts}
              narrative={data.narrative}
              // Only offered for today. A past day that has no narrative never gets one, and
              // promising a text that will not arrive is worse than showing nothing.
              narrativeFallback={
                digest.isToday ? (
                  <p className="font-sans text-[13px] text-ink-ghost italic">
                    {t('digest.narrativePending')}
                  </p>
                ) : undefined
              }
              high={data.high}
              normal={data.normal}
              noise={data.noise}
              degraded={data.degraded}
              degradedReason={data.degradedReason}
              meta={
                <>
                  <div>{t('digest.interrupted', { count: counts.high })}</div>
                  <div>{t('digest.neverReached', { count: silenced })}</div>
                </>
              }
            />
          </div>

          <aside className="flex w-full flex-none flex-col gap-6 border-t border-line-dim px-6 py-8 lg:w-85 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-2.5">
              <SectionLabel>{t('digest.delivery')}</SectionLabel>
              <div className="flex flex-col gap-1 text-[12px] leading-relaxed text-ink-dim">
                {digest.config && (
                  <span>
                    {t('digest.topic')}{' '}
                    <span className="text-ink-soft">{digest.config.ntfy.topic}</span>
                  </span>
                )}
                <span>
                  {data.sentAt
                    ? t('digest.sentAt', { time: formatTime(data.sentAt, locale) })
                    : digest.isToday
                      ? t('digest.scheduledFor', {
                          time: digest.config?.digest.sendTime ?? '—',
                        })
                      : t('digest.notSent')}
                </span>
                {/* Shadow mode is the difference between "the digest was not sent yet" and "the
                    digest is never sent". Saying so here avoids reading the silence as a fault. */}
                {digest.config?.shadowMode && (
                  <span className="text-amber">{t('digest.shadowNote')}</span>
                )}
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

            {digest.week.length > 0 && (
              <div className="mt-auto flex flex-col gap-2">
                <SectionLabel>{t('digest.week')}</SectionLabel>
                <div className="flex h-16 items-end gap-1.5">
                  {digest.week.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      disabled={!day.hasStoredDigest && day.date !== digest.week.at(-1)?.date}
                      onClick={() => digest.setDate(day.date)}
                      title={`${day.date} · ${day.interruptions}`}
                      className="flex flex-1 flex-col items-center gap-1.5 disabled:cursor-default"
                    >
                      {/* A zero-interruption day still needs a visible bar, or a quiet week reads
                          as a broken chart. One pixel of floor, not a fake minimum value. */}
                      <span
                        className={cn(
                          'w-full',
                          day.date === digest.date ? 'bg-amber' : 'bg-ink-ghost',
                        )}
                        style={{
                          height: `${Math.max(
                            2,
                            (day.interruptions / digest.maxInterruptions) * 52,
                          )}px`,
                        }}
                      />
                      <span className="text-[9px] text-ink-ghost">
                        {formatWeekday(day.date, locale)}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-ink-fainter">
                  {t('digest.interruptionsPerDay')}
                </span>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/**
 * The ad-hoc report for a chosen span.
 *
 * Renders the same body as a day, minus everything that only a delivered digest has: no delivery
 * panel, no week chart, no send button. What replaces them is the one fact that matters about this
 * screen — it was built just now, and it went nowhere.
 */
function DigestRangeView({ range }: { readonly range: ReturnType<typeof useDigestRangeLogic> }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const data = range.data;

  if (!data) return null;

  const silenced = data.counts.normal + data.counts.noise;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('digest.rangeTitle')}
        subtitle={`${formatDateLong(data.from, locale)} — ${formatDateLong(data.to, locale)}`}
        actions={<Button onClick={() => range.close()}>{t('digest.rangeBackToDay')}</Button>}
      />

      <DigestRangePanel range={range} />

      {data.counts.high + silenced === 0 ? (
        <EmptyState
          title={t('digest.rangeEmpty')}
          hint={t('digest.rangeEmptyHint')}
          icon={<Moon size={22} aria-hidden />}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-5 px-6 py-7 lg:overflow-y-auto lg:px-10">
            <DigestBody
              counts={data.counts}
              narrative={data.narrative}
              narrativeFallback={
                <p className="font-sans text-[13px] text-ink-ghost italic">
                  {t('digest.rangeNoNarrative')}
                </p>
              }
              high={data.high}
              normal={data.normal}
              noise={data.noise}
              degraded={data.degraded}
              degradedReason={data.degradedReason}
              showDates
              meta={
                <>
                  <div>{t('digest.rangeSpan', { count: data.days })}</div>
                  <div>{t('digest.rangeInterrupted', { count: data.counts.high })}</div>
                </>
              }
            />
          </div>

          <aside className="flex w-full flex-none flex-col gap-6 border-t border-line-dim px-6 py-8 lg:w-85 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-2.5">
              <SectionLabel>{t('digest.delivery')}</SectionLabel>
              {/* Said plainly rather than left blank: an empty delivery panel on a screen that
                  otherwise looks like the digest invites reading it as "not sent yet". */}
              <p className="font-sans text-[12px] leading-relaxed text-ink-dim">
                {t('digest.rangeNotDelivered')}
              </p>
            </div>

            {data.alerts.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <SectionLabel>{t('digest.rangeAlertEvents')}</SectionLabel>
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

/** One initial per day — the chart is a shape, not a table. */
function formatWeekday(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'narrow' });
}

function NavButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="border border-line px-2 py-1 text-ink-dim hover:text-ink disabled:opacity-30 disabled:hover:text-ink-dim"
    >
      {icon}
    </button>
  );
}
