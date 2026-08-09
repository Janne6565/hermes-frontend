import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react';
import { Button, SectionLabel } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from './useCategoriesLogic';
import type { Category } from '@/api/types';

/**
 * Everything about one category, in the one place where changing it makes sense.
 *
 * The table can show what a category caught, but it is the wrong shape for acting on it: colour had
 * no editor at all once a category existed, and the patterns were a truncated string rather than
 * things you could remove. This is where those live.
 *
 * Deliberately not a route. The dialog is a detail *of* the table — it borrows the row's context
 * and hands it straight back — and a URL would imply a place you can arrive at cold, with a back
 * button that competes with Escape.
 */
export function CategoryDetail({
  category,
  saving,
  conflict,
  deletingRuleId,
  onSave,
  onDeleteRule,
  onDelete,
  onClose,
}: {
  readonly category: Category;
  readonly saving: boolean;
  readonly conflict: boolean;
  readonly deletingRuleId?: string;
  readonly onSave: (name: string, color: string) => void;
  readonly onDeleteRule: (ruleId: string) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Focus moves into the dialog on open, so the next Tab is inside it and a screen reader lands
  // on the thing that just appeared rather than continuing down the page behind it.
  useEffect(() => {
    dialog.current?.focus();
  }, []);

  const dirty = name.trim() !== category.name || color !== category.color;
  const canSave = name.trim().length > 0 && dirty;

  const save = () => {
    if (canSave) onSave(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 px-4 py-16">
      {/* The backdrop is a real button rather than a div with a click handler: dismissing is an
          action, and this way it is reachable and announced instead of being a trap for anyone
          not using a mouse. It sits behind the dialog, so a click that starts inside and drifts
          out never reaches it. */}
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={category.name}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className="relative flex w-full max-w-lg flex-col gap-6 border border-line bg-surface p-6 outline-none"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 size-2 flex-none"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="truncate text-[15px] text-ink-bright">{category.name}</h2>
            <span className="text-[11.5px] text-ink-faint">
              {category.builtin ? t('categories.builtin') : t('categories.custom')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-ink-faint hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>{t('categories.name')}</SectionLabel>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
            }}
            className="border border-line bg-sunken px-2.5 py-2 text-[13px] text-ink outline-none focus:border-amber-line"
          />
          {conflict && <p className="text-[11.5px] text-broken">{t('categories.duplicate')}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>{t('categories.color')}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {/* The category's own colour is included even when it is not one of the presets, so
                opening this on a legacy value cannot silently change it on save. */}
            {[...new Set<string>([category.color, ...CATEGORY_COLORS])].map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                onClick={() => setColor(swatch)}
                className={cn('size-7 border', color === swatch ? 'border-amber' : 'border-line')}
              >
                <span className="block size-full" style={{ backgroundColor: swatch }} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-8 border-y border-line-dim py-4">
          <Figure value={category.count} label={t('categories.inWindow')} />
          <Figure value={`${Math.round(category.share * 100)}%`} label={t('categories.shareOf')} />
          <Figure
            value={category.typicalPriority ?? '—'}
            label={t('categories.typical')}
            accent={category.typicalPriority === 'high'}
          />
          <Figure value={category.corrected} label={t('categories.corrected')} />
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>{t('categories.matchedBy')}</SectionLabel>
          {category.rules.length === 0 ? (
            <p className="font-sans text-[12.5px] leading-relaxed text-ink-faint">
              {t('categories.noRules')}
            </p>
          ) : (
            <ul className="flex flex-col">
              {category.rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center gap-3 border-b border-line-faint py-2 text-[12px] last:border-b-0"
                >
                  <span className="w-14 flex-none text-ink-faint">{rule.type}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">{rule.pattern}</span>
                  <span className="flex-none text-[11px] text-ink-fainter">
                    {t('categories.hits', { count: rule.hits })}
                  </span>
                  <button
                    type="button"
                    aria-label={t('categories.deleteRule')}
                    disabled={deletingRuleId === rule.id}
                    onClick={() => onDeleteRule(rule.id)}
                    className="flex-none text-ink-ghost hover:text-broken disabled:opacity-50"
                  >
                    <Trash2 size={12} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="font-sans text-[12px] leading-relaxed text-ink-faint">
            {t('categories.ruleDeleteNote')}
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-line-dim pt-4">
          {!category.builtin &&
            (confirmingDelete ? (
              <>
                <Button variant="danger" onClick={onDelete}>
                  {t('categories.confirmDelete')}
                </Button>
                <Button onClick={() => setConfirmingDelete(false)}>{t('common.cancel')}</Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={12} aria-hidden />
                {t('categories.delete')}
              </Button>
            ))}
          <Button
            variant="outline"
            className="ml-auto justify-center"
            disabled={!canSave}
            loading={saving}
            onClick={save}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Figure({
  value,
  label,
  accent = false,
}: {
  readonly value: number | string;
  readonly label: string;
  readonly accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn('text-[19px] leading-none', accent ? 'text-amber' : 'text-ink')}>
        {value}
      </span>
      <span className="label-caps text-ink-faint">{label}</span>
    </div>
  );
}
