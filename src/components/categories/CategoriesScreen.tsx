import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tags, Trash2, Wand2 } from 'lucide-react';
import { Button, EmptyState, ErrorState, Notice, SectionLabel, Spinner } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, useCategoriesLogic } from './useCategoriesLogic';
import type { Category, UnsureMessage } from '@/api/types';

/**
 * Screen 05 — what the mail is about, as opposed to how loud it is.
 *
 * The screen is built around one claim it has to keep honest: every message has exactly one
 * category and none of this touches priority. So the table accounts for the whole window including
 * the leftovers, the "typical" column reports what priority the mail *got* rather than offering a
 * priority to set, and the correction panel says in words what a correction does.
 */
export function CategoriesScreen() {
  const { t } = useTranslation();
  const state = useCategoriesLogic();

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
        title={t('categories.title')}
        subtitle={t('categories.subtitle', { count: state.categories.length })}
        actions={
          <>
            {state.uncategorised > 0 && (
              <Button
                variant="ghost"
                loading={state.backfilling}
                disabled={state.backfilling}
                onClick={state.backfill}
                title={t('categories.backfillHint')}
              >
                <Wand2 size={12} aria-hidden />
                {state.backfilling
                  ? t('categories.backfilling')
                  : t('categories.backfill', { count: state.uncategorised })}
              </Button>
            )}
            <Button variant="outline" onClick={() => state.form.setOpen(!state.form.open)}>
              <Plus size={12} aria-hidden />
              {t('categories.new')}
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-6 py-6 lg:overflow-y-auto">
          {state.backfillFailed && (
            <Notice label={t('categories.backfillFailedLabel')} tone="broken">
              {t('categories.backfillFailed')}
            </Notice>
          )}

          {state.backfilling && (
            <Notice label={t('categories.backfillRunningLabel')}>
              {state.backfillProgress
                ? t('categories.backfillProgress', {
                    done: String(state.backfillProgress.done),
                    total: String(state.backfillProgress.total),
                  })
                : t('categories.backfillStarting')}
            </Notice>
          )}

          {!state.backfilling && state.backfillOutcome === 'sidecar_unavailable' && (
            <Notice label={t('categories.backfillStalledLabel')} tone="broken">
              {t('categories.backfillStalled', { count: state.uncategorised })}
            </Notice>
          )}

          {!state.backfilling && state.backfillOutcome === 'more_remaining' && (
            <Notice label={t('categories.backfillDoneLabel')}>
              {t('categories.backfillMore', { count: state.uncategorised })}
            </Notice>
          )}

          {state.form.open && (
            <div className="flex flex-col gap-3 border border-line bg-raised p-4">
              <SectionLabel>{t('categories.new')}</SectionLabel>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={state.form.name}
                  onChange={(event) => state.form.setName(event.target.value)}
                  placeholder={t('categories.namePlaceholder')}
                  className="min-w-48 flex-1 border border-line bg-sunken px-2.5 py-2 text-[12px] text-ink-soft outline-none placeholder:text-ink-ghost focus:border-amber-line"
                />
                <div className="flex gap-1.5">
                  {CATEGORY_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={swatch}
                      onClick={() => state.form.setColor(swatch)}
                      className={cn(
                        'size-6 border',
                        state.form.color === swatch ? 'border-amber' : 'border-line',
                      )}
                    >
                      <span
                        className="block size-full"
                        style={{ backgroundColor: swatch }}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  disabled={!state.canSubmit}
                  loading={state.submitting}
                  onClick={state.submit}
                >
                  {t('categories.create')}
                </Button>
              </div>
              {state.duplicate && (
                <p className="text-[11.5px] text-broken">{t('categories.duplicate')}</p>
              )}
            </div>
          )}

          {state.categories.length === 0 ? (
            <EmptyState
              title={t('categories.empty')}
              hint={t('categories.emptyHint')}
              icon={<Tags size={22} aria-hidden />}
            />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="label-caps border-b border-line text-ink-fainter">
                  <th className="w-44 pb-2 font-normal">{t('categories.category')}</th>
                  <th className="w-56 pb-2 font-normal">
                    {t('categories.share', { days: String(state.windowDays) })}
                  </th>
                  <th className="w-24 pb-2 font-normal max-md:hidden">{t('categories.typical')}</th>
                  <th className="pb-2 font-normal max-lg:hidden">{t('categories.matchedBy')}</th>
                  <th className="w-20 pb-2 text-right font-normal max-md:hidden">
                    {t('categories.corrected')}
                  </th>
                  <th className="w-10 pb-2" />
                </tr>
              </thead>
              <tbody>
                {state.categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    deleting={state.deletingId === category.id}
                    renaming={state.renamingId === category.id}
                    conflict={state.renameConflictId === category.id}
                    onRename={(name, color) => state.renameTo(category.id, name, color)}
                    onDelete={() => state.remove(category.id)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {state.mix && (
            <div className="mt-auto flex flex-wrap gap-10 border-t border-line-dim pt-5">
              <MixStat
                value={share(state.mix.byRule, state.total)}
                label={t('categories.settledByRule')}
                tone="bright"
              />
              <MixStat
                value={share(state.mix.byModel, state.total)}
                label={t('categories.byModel')}
              />
              <MixStat
                value={share(state.mix.lowConfidence, state.total)}
                label={t('categories.askedYou')}
                tone="accent"
              />
              {state.mix.byUser > 0 && (
                <MixStat
                  value={share(state.mix.byUser, state.total)}
                  label={t('categories.byYou')}
                />
              )}
            </div>
          )}
        </div>

        <aside className="flex w-full flex-none flex-col gap-5 border-t border-line-dim px-6 py-6 lg:w-100 lg:border-t-0 lg:border-l">
          <div className="flex items-baseline gap-3">
            <SectionLabel accent>{t('categories.needsACall')}</SectionLabel>
            <span className="ml-auto text-[10.5px] text-ink-ghost">
              {t('categories.needsACallCount', {
                count: state.unsure.length,
                total: String(state.total),
              })}
            </span>
          </div>

          {state.unsure.length === 0 ? (
            <p className="font-sans text-[12.5px] leading-relaxed text-ink-faint">
              {t('categories.nothingUnsure')}
            </p>
          ) : (
            state.unsure.map((message) => (
              <UnsureCard
                key={message.messageId}
                message={message}
                categories={state.categories}
                busy={state.assigningId === message.messageId}
                onAssign={(categoryId) => state.assignTo(message.messageId, categoryId)}
              />
            ))
          )}

          <div className="flex flex-col gap-2 border-t border-line-dim pt-4">
            <SectionLabel>{t('categories.whatACorrectionDoes')}</SectionLabel>
            <p className="font-sans text-[12.5px] leading-relaxed text-ink-dim">
              {t('categories.correctionExplainer')}
            </p>
          </div>

          {state.corrections.length > 0 && (
            <div className="mt-auto flex flex-col gap-2 border-t border-line-dim pt-4">
              <SectionLabel>{t('categories.recentCorrections')}</SectionLabel>
              <ul className="flex flex-col gap-1.5 text-[11.5px] text-ink-dimmer">
                {state.corrections.map((correction) => (
                  <CorrectionLine key={correction.messageId} correction={correction} />
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  deleting,
  renaming,
  conflict,
  onRename,
  onDelete,
}: {
  readonly category: Category;
  readonly deleting: boolean;
  readonly renaming: boolean;
  readonly conflict: boolean;
  readonly onRename: (name: string, color?: string) => void;
  readonly onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [color, setColor] = useState(category.color);

  const open = () => {
    setDraft(category.name);
    setColor(category.color);
    setEditing(true);
  };

  const commit = () => {
    const name = draft.trim();
    // Nothing to send is not an error — closing an edit you did not make should just close it.
    if (name.length > 0 && (name !== category.name || color !== category.color)) {
      onRename(name, color);
    }
    setEditing(false);
  };

  return (
    <tr className="border-b border-line-faint text-[12px]">
      <td className="py-2.5">
        {editing ? (
          <span className="flex min-w-0 items-center gap-2">
            <ColorDot color={color} />
            <input
              value={draft}
              // biome-ignore lint/a11y/noAutofocus: the row turned into a form on the user's click
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commit();
                // Escape abandons the edit rather than saving it — blur would otherwise commit.
                if (event.key === 'Escape') setEditing(false);
              }}
              aria-label={t('categories.rename')}
              className="min-w-0 flex-1 border border-amber-line bg-sunken px-1.5 py-0.5 text-[12px] text-ink outline-none"
            />
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-2.5">
            <ColorDot color={category.color} />
            <button
              type="button"
              onClick={open}
              disabled={renaming}
              title={t('categories.rename')}
              className="truncate text-left text-ink hover:text-amber disabled:opacity-50"
            >
              {category.name}
            </button>
          </span>
        )}
        {conflict && (
          <span className="mt-1 block text-[11px] text-broken">{t('categories.duplicate')}</span>
        )}
      </td>
      <td className="py-2.5">
        <span className="flex items-center gap-2.5">
          <span className="h-1.5 flex-1 bg-line-faint">
            <span
              className="block h-full"
              style={{
                backgroundColor: category.color,
                width: `${Math.round(category.share * 100)}%`,
              }}
            />
          </span>
          <span className="w-10 flex-none text-right text-[11px] text-ink-dimmer">
            {category.count}
          </span>
        </span>
      </td>
      <td
        className={cn(
          'py-2.5 max-md:hidden',
          category.typicalPriority === 'high' ? 'text-amber' : 'text-ink-dim',
        )}
      >
        {category.typicalPriority ?? '—'}
      </td>
      <td className="min-w-0 truncate py-2.5 font-sans text-[12.5px] text-ink-dimmer max-lg:hidden">
        {category.matchedBy.length > 0 ? category.matchedBy.join(', ') : t('categories.modelOnly')}
      </td>
      <td className="py-2.5 text-right text-[11.5px] text-ink-faint max-md:hidden">
        {category.corrected > 0 ? category.corrected : '—'}
      </td>
      <td className="py-2.5">
        {/* Built-ins are part of the classifier's vocabulary — deleting one would silently shrink
            what the model is allowed to answer, so there is no control to offer. Renaming them is
            fine, and is why the name itself is the button rather than this cell. */}
        {!category.builtin && (
          <button
            type="button"
            aria-label={t('categories.delete')}
            disabled={deleting}
            onClick={onDelete}
            className="text-ink-ghost hover:text-broken disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden />
          </button>
        )}
      </td>
    </tr>
  );
}

function UnsureCard({
  message,
  categories,
  busy,
  onAssign,
}: {
  readonly message: UnsureMessage;
  readonly categories: readonly Category[];
  readonly busy: boolean;
  readonly onAssign: (categoryId: string) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  // Everything the two chips do not already offer. The fallback is excluded: "this is
  // Uncategorised" is not an answer to "which category is this", it is the state being escaped.
  const others = categories.filter(
    (category) =>
      !category.fallback &&
      category.id !== message.guess?.id &&
      category.id !== message.alternative?.id,
  );

  return (
    <div className="flex flex-col gap-2.5 border border-line bg-raised px-3.5 py-3">
      <div className="flex items-baseline gap-2.5">
        <span className="truncate text-[12px] text-ink-soft">{message.sender}</span>
        <span className="ml-auto flex-none text-[11px] text-ink-fainter">
          {message.confidence.toFixed(2)}
        </span>
      </div>
      <p className="font-sans text-[12.5px] leading-snug text-ink-dimmer">{message.subject}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {message.guess && (
          <ChoiceChip
            label={message.guess.name}
            primary
            disabled={busy}
            onClick={() => onAssign(message.guess?.id ?? '')}
          />
        )}
        {message.alternative && (
          <ChoiceChip
            label={message.alternative.name}
            disabled={busy}
            onClick={() => onAssign(message.alternative?.id ?? '')}
          />
        )}

        {others.length > 0 && (
          <label className="flex items-center">
            <span className="sr-only">{t('categories.chooseOther')}</span>
            {/* A native select rather than a custom popover: it is one tap on a phone, keyboard
                navigable for free, and never renders off the edge of this narrow column. */}
            <select
              disabled={busy}
              value=""
              onChange={(event) => {
                if (event.target.value) onAssign(event.target.value);
              }}
              className="border border-line bg-transparent px-2 py-1 text-[11px] text-ink-dim outline-none hover:text-ink focus:border-amber-line disabled:opacity-50"
            >
              <option value="">{t('categories.other')}</option>
              {others.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="ml-auto text-[10.5px] text-ink-ghost">
          {formatDate(message.receivedAt, locale)}
        </span>
      </div>
    </div>
  );
}

function ColorDot({ color }: { readonly color: string }) {
  return <span className="size-1.5 flex-none" style={{ backgroundColor: color }} aria-hidden />;
}

/** The two the classifier named are single taps; everything else lives behind the select. */
function ChoiceChip({
  label,
  primary = false,
  disabled,
  onClick,
}: {
  readonly label: string;
  readonly primary?: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'border px-2.5 py-1 text-[11px] disabled:opacity-50',
        primary
          ? 'border-amber-line text-amber hover:bg-amber-wash'
          : 'border-line text-ink-dim hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

function CorrectionLine({
  correction,
}: {
  readonly correction: { subject: string; category?: string; previousCategory?: string };
}) {
  const { t } = useTranslation();
  return (
    <li className="flex flex-col">
      <span className="truncate text-ink-muted">{correction.subject}</span>
      <span className="text-ink-ghost">
        → {correction.category ?? '—'}
        {correction.previousCategory
          ? ` ${t('categories.wasCategory', { category: correction.previousCategory })}`
          : ''}
      </span>
    </li>
  );
}

function MixStat({
  value,
  label,
  tone = 'muted',
}: {
  readonly value: string;
  readonly label: string;
  readonly tone?: 'accent' | 'bright' | 'muted';
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          'text-[26px] leading-none font-semibold',
          tone === 'accent' && 'text-amber',
          tone === 'bright' && 'text-ink',
          tone === 'muted' && 'text-ink-dim',
        )}
      >
        {value}
      </span>
      <span className="label-caps text-ink-faint">{label}</span>
    </div>
  );
}

/** An empty window is "—", not "0%" — nothing happened is not the same as nothing worked. */
function share(part: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((part / total) * 100)}%`;
}
