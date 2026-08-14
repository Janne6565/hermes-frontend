import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Notice, SectionLabel, Stat } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import type { DigestCounts, Message, NoiseSummary } from '@/api/types';

interface DigestBodyProps {
  readonly counts: DigestCounts;
  readonly narrative?: string;
  /** Shown in place of the paragraph when there is none. Nothing is rendered without one. */
  readonly narrativeFallback?: ReactNode;
  readonly high: readonly Message[];
  readonly normal: readonly Message[];
  readonly noise: NoiseSummary;
  readonly degraded: boolean;
  readonly degradedReason?: string;
  /** The right-hand lines next to the counts — a day and a span say different things there. */
  readonly meta?: ReactNode;
  /** Range rows carry a date; a single day's would repeat the header on every line. */
  readonly showDates?: boolean;
}

/**
 * A digest, rendered.
 *
 * Shared by the daily screen and the ad-hoc range report so the two can never drift into showing
 * the same mail differently. Everything that distinguishes a day from a span — delivery state, the
 * week chart, the wording above the counts — stays outside this component, because that is exactly
 * the part that is not shared.
 */
export function DigestBody({
  counts,
  narrative,
  narrativeFallback,
  high,
  normal,
  noise,
  degraded,
  degradedReason,
  meta,
  showDates = false,
}: DigestBodyProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  return (
    <>
      <div className="flex flex-wrap items-end gap-10">
        <Stat value={counts.high} label={t('priority.high')} tone="accent" />
        <Stat value={counts.normal} label={t('priority.normal')} tone="bright" />
        <Stat value={counts.noise} label={t('priority.noise')} />
        {meta && (
          <div className="ml-auto text-right font-sans text-[13px] leading-relaxed text-ink-dimmer">
            {meta}
          </div>
        )}
      </div>

      {degraded && degradedReason && <Notice label={t('digest.degraded')}>{degradedReason}</Notice>}

      {(narrative || narrativeFallback) && (
        <section className="flex flex-col gap-2">
          <SectionLabel>{t('digest.narrativeHeading')}</SectionLabel>
          {narrative ? (
            <p className="max-w-[62ch] font-sans text-[14.5px] leading-[1.65] text-ink-soft">
              {narrative}
            </p>
          ) : (
            narrativeFallback
          )}
        </section>
      )}

      {high.length > 0 && (
        <section className="flex flex-col">
          <div className="flex items-baseline gap-2.5 pb-2.5">
            <SectionLabel accent>{t('digest.highHeading')}</SectionLabel>
            <span className="ml-auto text-[10.5px] text-ink-ghost">
              {t('digest.stillOpen', {
                open: String(high.filter((m) => !m.dismissed).length),
                dismissed: String(high.filter((m) => m.dismissed).length),
              })}
            </span>
          </div>
          {high.map((message) => (
            <article key={message.id} className="flex gap-4 border-t border-line-dim py-3.5">
              <span className="w-11 flex-none pt-0.5 text-[11px] text-ink-fainter">
                {showDates
                  ? formatDayAndTime(message.receivedAt, locale)
                  : formatTime(message.receivedAt, locale)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[13px] font-semibold text-ink-strong">
                  {message.senderName}
                </span>
                <span className="font-sans text-[14px] text-ink-soft">{message.subject}</span>
                {message.reason && (
                  <span className="text-[11.5px] text-ink-dimmer italic">{message.reason}</span>
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

      {normal.length > 0 && (
        <section className="flex flex-col">
          <SectionLabel className="pb-2.5">{t('digest.normalHeading')}</SectionLabel>
          {normal.map((message) => (
            <div
              key={message.id}
              className="flex items-baseline gap-4 border-t border-line-faint py-1.5"
            >
              <span className="w-11 flex-none text-[11px] text-ink-ghost">
                {showDates
                  ? formatDayAndTime(message.receivedAt, locale)
                  : formatTime(message.receivedAt, locale)}
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

      {noise.count > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line-faint pt-2 text-[11.5px] text-ink-ghost">
          <span className="tracking-widest uppercase">
            {t('digest.noiseHeading', { count: noise.count })}
          </span>
          <span>
            {noise.categories.map((category) => `${category.count} ${category.label}`).join(' · ')}
          </span>
        </div>
      )}
    </>
  );
}

/**
 * Day and month only, in the same 11-character column the time occupies.
 *
 * Over a span the time of day is the less useful half — "was that the 3rd or the 9th" is the
 * question a range report answers — and both cannot fit without widening the column for every row.
 */
function formatDayAndTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}
