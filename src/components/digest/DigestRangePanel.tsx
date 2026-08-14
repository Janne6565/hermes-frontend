import { useTranslation } from 'react-i18next';
import { Button, Notice, SectionLabel } from '@/components/ui';
import type { useDigestRangeLogic } from './useDigestRangeLogic';
import { MAX_RANGE_DAYS } from './useDigestRangeLogic';

/**
 * The span picker.
 *
 * Sits above the digest rather than in a modal: the point of the report is to compare a stretch of
 * time against the day you were just looking at, and a dialog that hides the result to change the
 * dates makes that the one thing you cannot do.
 */
export function DigestRangePanel({
  range,
}: {
  readonly range: ReturnType<typeof useDigestRangeLogic>;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5 border-b border-line-dim px-6 py-4 lg:px-10">
      <div className="flex flex-wrap items-end gap-3">
        <SectionLabel className="w-full">{t('digest.rangeHeading')}</SectionLabel>

        <label className="flex flex-col gap-1 text-[10.5px] tracking-widest text-ink-ghost uppercase">
          {t('digest.rangeFrom')}
          <input
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={(event) => range.setFrom(event.target.value)}
            className="border border-line bg-sunken px-2.5 py-2 text-[12px] text-ink-soft outline-none focus:border-amber-line"
          />
        </label>

        <label className="flex flex-col gap-1 text-[10.5px] tracking-widest text-ink-ghost uppercase">
          {t('digest.rangeTo')}
          <input
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(event) => range.setTo(event.target.value)}
            className="border border-line bg-sunken px-2.5 py-2 text-[12px] text-ink-soft outline-none focus:border-amber-line"
          />
        </label>

        <Button
          variant="outline"
          disabled={!range.canSubmit}
          loading={range.isLoading}
          onClick={() => range.submit()}
        >
          {range.isLoading ? t('digest.rangeBuilding') : t('digest.rangeCreate')}
        </Button>

        <Button variant="ghost" onClick={() => range.close()}>
          {t('common.cancel')}
        </Button>

        {range.days > 0 && !range.problem && (
          <span className="text-[11px] text-ink-fainter">
            {t('digest.rangeDays', { count: range.days })}
          </span>
        )}
      </div>

      {/* Amber, not broken: a mistyped span is the user mid-thought, and red in this app means
          mail is not being read. Only the failed request below earns the broken tone. */}
      {range.problem && (
        <Notice label={t('digest.rangeInvalid')}>
          {/* Spelled out rather than built from the problem name: only one of the three takes an
              interpolation, and a template key defeats the compile-time check on translations. */}
          {range.problem === 'inverted' && t('digest.rangeProblem.inverted')}
          {range.problem === 'future' && t('digest.rangeProblem.future')}
          {range.problem === 'tooLong' &&
            t('digest.rangeProblem.tooLong', { max: String(MAX_RANGE_DAYS) })}
        </Notice>
      )}

      {range.isError && (
        <Notice label={t('common.failed')} tone="broken">
          {t('digest.rangeFailed')}
        </Notice>
      )}
    </div>
  );
}
