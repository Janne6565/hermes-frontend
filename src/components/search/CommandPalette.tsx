import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useMessageSearch } from '@/api/queries';
import { MessageDialog } from '@/components/messages/MessageDialog';
import { PriorityBadge, Spinner } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/format';
import { parseQuery } from '@/lib/searchQuery';
import { cn } from '@/lib/utils';
import type { Message } from '@/api/types';

/** Enough to choose from without turning the palette into the search screen. */
const PALETTE_LIMIT = 8;

/**
 * Search from anywhere, and open what you find without leaving the page.
 *
 * The point is reach, not features: the search screen is still where you go to work through a
 * result set. This is for the other case — you are on Health or Rules, you remember a mail, and
 * you want to look at it without losing where you were. So it opens the message in a dialog rather
 * than navigating, and closes back to exactly what was underneath.
 *
 * It shares the parser with the search screen, so `priority:high category:Billing` works here too.
 * A second syntax for the same job would be worse than no palette at all.
 */
export function CommandPalette() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [opened, setOpened] = useState<Message | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Chrome and Firefox both bind Ctrl/Cmd+K to the address bar, so this only works if we
        // take it. Safe to: the combination does nothing inside a page otherwise.
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const deferred = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferred), [deferred]);
  const params = useMemo(
    () => ({
      q: parsed.text,
      priority: parsed.priority,
      sender: parsed.from,
      after: parsed.after,
      before: parsed.before,
      classifiedBy: parsed.classifiedBy,
      category: parsed.category,
      limit: PALETTE_LIMIT,
    }),
    [parsed],
  );
  const hasCriteria = Object.entries(params).some(
    ([key, value]) => key !== 'limit' && value !== undefined,
  );
  const search = useMessageSearch(params, open && hasCriteria);
  const results = useMemo(() => search.data ?? [], [search.data]);

  // Clamped rather than reset: as results narrow while typing, a selection past the end would
  // make Enter silently do nothing.
  useEffect(() => {
    setSelected((current) => Math.min(current, Math.max(results.length - 1, 0)));
  }, [results.length]);

  if (opened) {
    return (
      <MessageDialog
        messageId={opened.id}
        fallback={opened}
        onClose={() => {
          setOpened(null);
          // Back to the palette, not to nothing: you were probably scanning several results.
          setOpen(true);
        }}
      />
    );
  }

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((current) => Math.min(current + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      setOpen(false);
      setOpened(results[selected]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 px-4 py-[12vh]">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={close}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex w-full max-w-2xl flex-col border border-line bg-surface">
        <div className="flex items-center gap-3 border-b border-line-dim px-4 py-3">
          <Search size={15} className="flex-none text-ink-faint" aria-hidden />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('search.placeholder')}
            aria-label={t('search.title')}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-ghost"
          />
          <span className="flex-none text-[10.5px] text-ink-ghost">{t('search.paletteHint')}</span>
        </div>

        {search.isFetching && <Spinner label={t('common.loading')} />}

        {!search.isFetching && hasCriteria && results.length === 0 && (
          <p className="px-4 py-6 text-[12.5px] text-ink-faint">{t('search.empty')}</p>
        )}

        {!hasCriteria && (
          <p className="px-4 py-6 font-sans text-[12.5px] leading-relaxed text-ink-faint">
            {t('search.paletteIdle')}
          </p>
        )}

        {!search.isFetching &&
          results.map((message, index) => (
            <button
              key={message.id}
              type="button"
              // Pointer and keyboard drive the same selection, so hovering then pressing Enter
              // opens what is under the cursor rather than something else.
              onMouseEnter={() => setSelected(index)}
              onClick={() => {
                setOpen(false);
                setOpened(message);
              }}
              className={cn(
                'flex items-baseline gap-3 border-t border-line-faint px-4 py-2.5 text-left',
                index === selected ? 'bg-[#1b1a18]' : 'hover:bg-[#171614]',
              )}
            >
              <span className="w-28 flex-none truncate text-[12px] text-ink-muted">
                {message.senderName}
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-ink-soft">
                {message.subject}
              </span>
              {message.category && (
                <span className="label-caps flex-none text-ink-fainter max-sm:hidden">
                  {message.category}
                </span>
              )}
              <PriorityBadge priority={message.priority} />
              <span className="flex-none text-[11px] text-ink-fainter">
                {formatDate(message.receivedAt, locale)}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
