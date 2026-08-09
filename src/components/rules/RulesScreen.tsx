import { useTranslation } from 'react-i18next';
import { Trash2, Filter } from 'lucide-react';
import { Button, EmptyState, ErrorState, SectionLabel, Spinner } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { cn } from '@/lib/utils';
import { useRulesLogic } from './useRulesLogic';
import type { Priority, RuleType } from '@/api/types';

const RULE_TYPES: readonly RuleType[] = ['sender', 'domain', 'header'];
const PRIORITIES: readonly Priority[] = ['high', 'normal', 'noise'];

/** Screen 04 — the rule table plus the new-rule form. */
export function RulesScreen() {
  const { t } = useTranslation();
  const state = useRulesLogic();

  if (state.isLoading) return <Spinner label={t('common.loading')} />;
  if (state.isError) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void state.refetch()}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('rules.title')}
        subtitle={t('rules.subtitle', { count: state.activeCount })}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 px-6 py-6 lg:overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {(['all', ...RULE_TYPES] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => state.setFilter(option)}
                className={cn(
                  'border px-2.5 py-1 text-[11.5px]',
                  state.filter === option
                    ? 'border-amber-line text-amber'
                    : 'border-line text-ink-dim hover:text-ink',
                )}
              >
                {option === 'all' ? t('rules.all') : option} {state.countsByType[option]}
              </button>
            ))}
          </div>

          {state.rules.length === 0 ? (
            <EmptyState
              title={t('rules.empty')}
              hint={t('rules.emptyHint')}
              icon={<Filter size={22} aria-hidden />}
            />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="label-caps border-b border-line text-ink-fainter">
                  <th className="w-20 pb-2 font-normal">{t('rules.type')}</th>
                  <th className="pb-2 font-normal">{t('rules.pattern')}</th>
                  <th className="w-20 pb-2 font-normal">{t('rules.priorityColumn')}</th>
                  <th className="w-24 pb-2 font-normal max-md:hidden">{t('rules.source')}</th>
                  <th className="w-16 pb-2 font-normal max-md:hidden">{t('rules.hits')}</th>
                  <th className="w-24 pb-2 font-normal">{t('rules.state')}</th>
                  <th className="w-10 pb-2" />
                </tr>
              </thead>
              <tbody>
                {state.rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-line-faint text-[12px]">
                    <td className="py-2.5 text-ink-faint">{rule.type}</td>
                    <td className="min-w-0 truncate py-2.5 text-ink-soft">{rule.pattern}</td>
                    <td
                      className={cn(
                        'py-2.5',
                        rule.priority === 'high' ? 'text-amber' : 'text-ink-dim',
                      )}
                    >
                      {rule.priority}
                    </td>
                    <td className="py-2.5 text-ink-faint max-md:hidden">{rule.source}</td>
                    <td className="py-2.5 text-ink-dimmer max-md:hidden">{rule.hits}</td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        disabled={state.togglingId === rule.id}
                        onClick={() => state.toggle(rule.id, !rule.enabled)}
                        className={cn(
                          'border px-2 py-0.5 text-[10.5px] disabled:opacity-50',
                          rule.enabled
                            ? 'border-amber-line text-amber'
                            : 'border-line text-ink-fainter',
                        )}
                      >
                        {rule.enabled ? t('rules.on') : t('rules.off')}
                      </button>
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        aria-label={t('rules.delete')}
                        disabled={state.deletingId === rule.id}
                        onClick={() => state.remove(rule.id)}
                        className="text-ink-ghost hover:text-broken disabled:opacity-50"
                      >
                        <Trash2 size={13} aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="flex w-full flex-none flex-col gap-5 border-t border-line-dim px-6 py-6 lg:w-90 lg:border-t-0 lg:border-l">
          <SectionLabel>{t('rules.newRule')}</SectionLabel>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] tracking-wider text-ink-fainter uppercase">
              {t('rules.type')}
            </span>
            <div className="flex gap-1.5">
              {RULE_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => state.form.setType(option)}
                  className={cn(
                    'flex-1 border py-1.5 text-center text-[11.5px]',
                    state.form.type === option
                      ? 'border-amber-line text-amber'
                      : 'border-line text-ink-faint hover:text-ink-dim',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] tracking-wider text-ink-fainter uppercase">
              {t('rules.pattern')}
            </span>
            <input
              value={state.form.pattern}
              onChange={(event) => state.form.setPattern(event.target.value)}
              placeholder={t('rules.patternPlaceholder')}
              className="border border-line bg-sunken px-2.5 py-2 text-[12px] text-ink-soft outline-none placeholder:text-ink-ghost focus:border-amber-line"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] tracking-wider text-ink-fainter uppercase">
              {t('rules.priorityColumn')}
            </span>
            <div className="flex gap-1.5">
              {PRIORITIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => state.form.setPriority(option)}
                  className={cn(
                    'flex-1 border py-1.5 text-center text-[11.5px]',
                    state.form.priority === option
                      ? 'border-amber-line text-amber'
                      : 'border-line text-ink-faint hover:text-ink-dim',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="justify-center"
            disabled={!state.canSubmit}
            loading={state.creating}
            onClick={state.submit}
          >
            {state.creating ? t('rules.creating') : t('rules.create')}
          </Button>

          {state.duplicate && <p className="text-[11.5px] text-broken">{t('rules.duplicate')}</p>}

          {state.dryRun && (
            <div className="flex flex-col gap-2 border-t border-line-dim pt-4">
              <SectionLabel>{t('rules.dryRun')}</SectionLabel>
              {state.dryRun.supported ? (
                <p className="font-sans text-[12.5px] leading-relaxed text-ink-dim">
                  {/* The high count is the number that matters: a noise rule that would have
                      swallowed something high is the mistake this panel exists to prevent. */}
                  {t('rules.dryRunResult', {
                    matched: String(state.dryRun.matched),
                    sample: String(state.dryRun.sampleSize),
                  })}{' '}
                  <span
                    className={cn(
                      state.dryRun.matchedHigh > 0 && state.form.priority !== 'high'
                        ? 'text-amber'
                        : 'text-ink-faint',
                    )}
                  >
                    {state.dryRun.matchedHigh > 0
                      ? t('rules.dryRunHigh', { count: state.dryRun.matchedHigh })
                      : t('rules.dryRunNoHigh')}
                  </span>
                </p>
              ) : (
                <p className="font-sans text-[12.5px] leading-relaxed text-ink-faint">
                  {t('rules.dryRunUnsupported')}
                </p>
              )}
            </div>
          )}

          {state.recentFeedback.length > 0 && (
            <div className="mt-auto flex flex-col gap-2 border-t border-line-dim pt-4">
              <SectionLabel>{t('rules.recentFeedback')}</SectionLabel>
              <ul className="flex flex-col gap-1.5 text-[11.5px] text-ink-dimmer">
                {state.recentFeedback.map((rule) => (
                  <li key={rule.id} className="flex flex-col">
                    <span className="truncate text-ink-muted">
                      {rule.type} {rule.pattern}
                    </span>
                    <span className="text-ink-ghost">→ {rule.priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
