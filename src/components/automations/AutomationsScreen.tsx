import { useTranslation } from 'react-i18next';
import { FlaskConical, Pencil, Trash2, Zap } from 'lucide-react';
import { Button, EmptyState, ErrorState, Notice, SectionLabel, Spinner } from '@/components/ui';
import { SegmentedChoice } from '@/components/ui/SegmentedChoice';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAutomationsLogic } from './useAutomationsLogic';
import type { ActionOutcome, Automation, AutomationAlert, AutomationRun } from '@/api/types';

const ALERTS: readonly AutomationAlert[] = ['none', 'direct', 'important'];

const FIELD_LABEL = 'text-[10.5px] tracking-wider text-ink-fainter uppercase';
const FIELD =
  'border border-line bg-sunken px-2.5 py-2 text-[12px] text-ink-soft placeholder:text-ink-ghost focus:border-amber-line';

/**
 * Natural-language triggers and what they do.
 *
 * The classifier already reads every mail once; the enabled triggers ride along on that same turn
 * and it answers with the ones that match. So the screen's promise is narrow and has to stay
 * honest: an automation adds a push or a webhook call on top of the triage — it never changes a
 * mail's priority, and it only sees mail that arrives after it was created.
 */
export function AutomationsScreen() {
  const { t } = useTranslation();
  const state = useAutomationsLogic();

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

  const editing = state.form.editingId !== undefined;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('automations.title')}
        subtitle={t('automations.subtitle', {
          enabled: String(state.enabledCount),
          limit: String(state.limit),
        })}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-6 lg:overflow-y-auto">
          {state.lastTest && <TestResult run={state.lastTest} />}

          {state.toggleFailed && (
            <p className="text-[11.5px] text-broken">
              {t('automations.limitReached', { limit: String(state.limit) })}
            </p>
          )}

          {state.automations.length === 0 ? (
            <EmptyState
              title={t('automations.empty')}
              hint={t('automations.emptyHint')}
              icon={<Zap size={22} aria-hidden />}
            />
          ) : (
            // Fixed layout so a long trigger truncates instead of pushing the table under the rail.
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="label-caps border-b border-line text-ink-fainter">
                  <th className="pr-4 pb-2 font-normal">{t('automations.automation')}</th>
                  <th className="w-40 pr-4 pb-2 font-normal max-md:hidden">
                    {t('automations.actions')}
                  </th>
                  <th className="w-28 pr-4 pb-2 font-normal max-md:hidden">
                    {t('automations.fired')}
                  </th>
                  <th className="w-16 pr-2 pb-2 font-normal">{t('automations.state')}</th>
                  <th className="w-24 pb-2" />
                </tr>
              </thead>
              <tbody>
                {state.automations.map((automation) => (
                  <AutomationRow
                    key={automation.id}
                    automation={automation}
                    selected={state.form.editingId === automation.id}
                    toggling={state.togglingId === automation.id}
                    testing={state.testingId === automation.id}
                    deleting={state.deletingId === automation.id}
                    onToggle={() => state.toggle(automation)}
                    onEdit={() => state.edit(automation)}
                    onTest={() => state.runTest(automation.id)}
                    onDelete={() => state.remove(automation.id)}
                  />
                ))}
              </tbody>
            </table>
          )}

          <div className="flex flex-col gap-2.5">
            <SectionLabel>{t('automations.recentRuns')}</SectionLabel>
            {state.runs.length === 0 ? (
              <p className="font-sans text-[12.5px] text-ink-faint">{t('automations.noRuns')}</p>
            ) : (
              <ul className="flex flex-col">
                {state.runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex w-full flex-none flex-col gap-5 border-t border-line-dim px-6 py-6 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <SectionLabel accent={editing}>
            {editing ? t('automations.editTitle') : t('automations.newTitle')}
          </SectionLabel>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="automation-name" className={FIELD_LABEL}>
              {t('automations.name')}
            </label>
            <input
              id="automation-name"
              value={state.form.name}
              maxLength={60}
              onChange={(event) => state.form.setName(event.target.value)}
              placeholder={t('automations.namePlaceholder')}
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="automation-trigger" className={FIELD_LABEL}>
              {t('automations.trigger')}
            </label>
            <textarea
              id="automation-trigger"
              value={state.form.trigger}
              maxLength={300}
              rows={3}
              onChange={(event) => state.form.setTrigger(event.target.value)}
              placeholder={t('automations.triggerPlaceholder')}
              className={cn(FIELD, 'resize-y font-sans leading-relaxed')}
            />
            <p className="font-sans text-[11.5px] leading-relaxed text-ink-faint">
              {t('automations.triggerHint')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <SegmentedChoice
              legend={t('automations.alert')}
              name="automation-alert"
              options={ALERTS}
              value={state.form.alert}
              onChange={state.form.setAlert}
              renderLabel={(option) => t(`automations.alertLabel.${option}`)}
            />
            <p className="font-sans text-[11.5px] leading-relaxed text-ink-faint">
              {t(`automations.alertHint.${state.form.alert}`)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="automation-webhook" className={FIELD_LABEL}>
              {t('automations.webhook')}
            </label>
            <input
              id="automation-webhook"
              type="url"
              inputMode="url"
              value={state.form.webhookUrl}
              onChange={(event) => state.form.setWebhookUrl(event.target.value)}
              placeholder="https://n8n.example.com/webhook/…"
              aria-invalid={state.webhookInvalid}
              className={cn(FIELD, state.webhookInvalid && 'border-broken-line')}
            />
            {state.webhookInvalid ? (
              <p className="text-[11.5px] text-broken">{t('automations.webhookInvalid')}</p>
            ) : (
              <p className="font-sans text-[11.5px] leading-relaxed text-ink-faint">
                {t('automations.webhookHint')}
              </p>
            )}
          </div>

          {state.form.alert === 'none' && state.form.webhookUrl.trim() === '' && (
            <p className="font-sans text-[11.5px] text-ink-faint">{t('automations.needsAction')}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-center"
              disabled={!state.canSubmit || (!editing && state.atLimit)}
              loading={state.saving}
              onClick={state.submit}
            >
              {state.saving
                ? t('common.saving')
                : editing
                  ? t('common.save')
                  : t('automations.create')}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={state.cancelEdit}>
                {t('common.cancel')}
              </Button>
            )}
          </div>

          {!editing && state.atLimit && (
            <p className="text-[11.5px] text-ink-faint">
              {t('automations.limitReached', { limit: String(state.limit) })}
            </p>
          )}
          {state.conflict && (
            <p className="text-[11.5px] text-broken">{t('automations.conflict')}</p>
          )}
          {state.failed && <p className="text-[11.5px] text-broken">{t('automations.failed')}</p>}

          <div className="mt-auto flex flex-col gap-2 border-t border-line-dim pt-4">
            <SectionLabel>{t('automations.howTitle')}</SectionLabel>
            <p className="font-sans text-[12.5px] leading-relaxed text-ink-dim">
              {t('automations.howBody')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AutomationRow({
  automation,
  selected,
  toggling,
  testing,
  deleting,
  onToggle,
  onEdit,
  onTest,
  onDelete,
}: {
  readonly automation: Automation;
  readonly selected: boolean;
  readonly toggling: boolean;
  readonly testing: boolean;
  readonly deleting: boolean;
  readonly onToggle: () => void;
  readonly onEdit: () => void;
  readonly onTest: () => void;
  readonly onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  return (
    <tr
      className={cn(
        'border-b border-line-faint align-top text-[12px]',
        !automation.enabled && 'opacity-60',
        selected && 'bg-amber-wash',
      )}
    >
      <td className="min-w-0 py-2.5 pr-4">
        <div className="truncate text-ink-soft">{automation.name}</div>
        <div className="truncate font-sans text-[11.5px] text-ink-faint" title={automation.trigger}>
          {automation.trigger}
        </div>
      </td>
      <td className="py-2.5 pr-4 max-md:hidden">
        <div className="flex flex-col gap-0.5">
          {automation.alert !== 'none' && (
            <span className={cn(automation.alert === 'important' ? 'text-amber' : 'text-ink-dim')}>
              {t(`automations.alertLabel.${automation.alert}`)}
            </span>
          )}
          {automation.webhookUrl && (
            <span className="truncate text-ink-faint" title={automation.webhookUrl}>
              {t('automations.webhookTo', { host: hostOf(automation.webhookUrl) })}
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4 text-ink-dimmer max-md:hidden">
        <div>{automation.fireCount}×</div>
        <div className="text-[11px] text-ink-ghost">
          {automation.lastFiredAt
            ? `${formatDate(automation.lastFiredAt, locale)} ${formatTime(automation.lastFiredAt, locale)}`
            : t('automations.never')}
        </div>
      </td>
      <td className="py-2.5 pr-2">
        <button
          type="button"
          aria-pressed={automation.enabled}
          aria-label={t('automations.toggle', { name: automation.name })}
          disabled={toggling}
          onClick={onToggle}
          className={cn(
            'min-h-6 border px-2 py-0.5 text-[10.5px] disabled:opacity-50',
            automation.enabled ? 'border-amber-line text-amber' : 'border-line text-ink-fainter',
          )}
        >
          {automation.enabled ? t('automations.on') : t('automations.off')}
        </button>
      </td>
      <td className="py-2.5">
        <div className="flex justify-end gap-1">
          <IconButton label={t('automations.edit')} onClick={onEdit}>
            <Pencil size={13} aria-hidden />
          </IconButton>
          <IconButton label={t('automations.test')} onClick={onTest} disabled={testing}>
            <FlaskConical size={13} aria-hidden className={cn(testing && 'animate-pulse')} />
          </IconButton>
          <IconButton label={t('automations.delete')} onClick={onDelete} disabled={deleting} danger>
            <Trash2 size={13} aria-hidden />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      // 13px icon, 25px target — past the 24px floor (WCAG 2.5.8).
      className={cn(
        'inline-flex p-1.5 text-ink-ghost disabled:opacity-50',
        danger ? 'hover:text-broken' : 'hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function RunRow({ run }: { readonly run: AutomationRun }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  return (
    <li className="flex flex-col gap-0.5 border-b border-line-faint py-2 text-[12px]">
      <div className="flex items-baseline gap-2">
        <span className="flex-none text-ink-soft">{run.automationName}</span>
        <span className="min-w-0 truncate text-ink-faint">
          {run.messageId ? (run.subject ?? '—') : t('automations.testRun')}
        </span>
        <span className="ml-auto flex-none text-[11px] text-ink-ghost">
          {formatDate(run.firedAt, locale)} {formatTime(run.firedAt, locale)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 text-[11px]">
        <Outcome label={t('automations.push')} outcome={run.alert} />
        <Outcome label={t('automations.webhookShort')} outcome={run.webhook} />
        {run.detail && <span className="text-ink-ghost">{run.detail}</span>}
      </div>
    </li>
  );
}

/** A failed action is a broken integration, so it is the one place this screen uses red. */
function Outcome({ label, outcome }: { readonly label: string; readonly outcome: ActionOutcome }) {
  const { t } = useTranslation();
  if (outcome === 'none') return null;
  return (
    <span
      className={cn(
        outcome === 'delivered' && 'text-ink-dim',
        outcome === 'failed' && 'text-broken',
        outcome === 'suppressed' && 'text-ink-faint',
      )}
    >
      {label} {t(`automations.outcome.${outcome}`)}
    </span>
  );
}

function TestResult({ run }: { readonly run: AutomationRun }) {
  const { t } = useTranslation();
  const failed = run.alert === 'failed' || run.webhook === 'failed';
  return (
    <Notice
      label={t('automations.testResult', { name: run.automationName })}
      tone={failed ? 'broken' : 'amber'}
    >
      <span className="flex flex-wrap gap-x-3">
        <Outcome label={t('automations.push')} outcome={run.alert} />
        <Outcome label={t('automations.webhookShort')} outcome={run.webhook} />
        {run.detail && <span className="text-ink-faint">{run.detail}</span>}
      </span>
    </Notice>
  );
}

/** `https://n8n.example.com/webhook/abc?token=…` → `n8n.example.com` — never the token. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
