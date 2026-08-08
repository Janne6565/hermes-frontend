import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchX, Search } from 'lucide-react';
import { EmptyState, PriorityBadge, Spinner } from '@/components/ui';
import { useMessageSearch } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Priority } from '@/api/types';

const PRIORITIES: readonly Priority[] = ['high', 'normal', 'noise'];

/**
 * Screen 06.
 *
 * Runs against the backend's local Postgres index rather than Gmail, so it keeps working while
 * sync is down — which is exactly when you most want to look something up.
 */
export function SearchScreen() {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<Priority | undefined>();

  // Deferred so typing stays responsive without a hand-rolled debounce timer.
  const deferredQuery = useDeferredValue(query);
  const params = useMemo(
    () => ({ q: deferredQuery.trim() || undefined, priority, limit: 50 }),
    [deferredQuery, priority],
  );

  const hasCriteria = Boolean(params.q || params.priority);
  const { data, isFetching } = useMessageSearch(params, hasCriteria);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-12">
        <div className="flex w-full max-w-3xl flex-col gap-4.5">
          <label className="flex items-center gap-3 border border-amber-line bg-sunken px-4 py-3.5 focus-within:border-amber">
            <Search size={15} className="text-amber" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-transparent text-[15px] text-ink-strong outline-none placeholder:text-ink-ghost"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
            {PRIORITIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPriority(priority === option ? undefined : option)}
                className={cn(
                  'border px-2.5 py-1',
                  priority === option
                    ? 'border-amber-line text-amber'
                    : 'border-line text-ink-faint hover:text-ink-dim',
                )}
              >
                priority:{option}
              </button>
            ))}
            {hasCriteria && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPriority(undefined);
                }}
                className="text-ink-fainter hover:text-ink-dim"
              >
                {t('search.clear')}
              </button>
            )}
            {data && (
              <span className="ml-auto text-ink-fainter">
                {t('search.results', { count: data.length })}
              </span>
            )}
          </div>

          <div className="flex flex-col pb-10">
            {isFetching && <Spinner label={t('common.loading')} />}
            {!isFetching && hasCriteria && data?.length === 0 && (
              <EmptyState
                title={t('search.empty')}
                hint={t('search.emptyHint')}
                icon={<SearchX size={22} aria-hidden />}
              />
            )}
            {!isFetching &&
              data?.map((message) => (
                <a
                  key={message.id}
                  href={message.gmailUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex gap-4.5 border-t border-line-dim py-4 hover:bg-[#171614]"
                >
                  <div className="flex w-24 flex-none flex-col gap-1">
                    <span className="text-[11.5px] text-ink-dimmer">
                      {formatDate(message.receivedAt, locale)}
                    </span>
                    <PriorityBadge priority={message.priority} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-[12.5px] text-ink-strong">{message.senderName}</span>
                    <span className="font-sans text-[14px] text-ink-soft">{message.subject}</span>
                    {message.snippet && (
                      <span className="line-clamp-2 font-sans text-[12.5px] leading-snug text-ink-dimmer">
                        {message.snippet}
                      </span>
                    )}
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>

      <div className="flex flex-none gap-6 border-t border-line-dim px-6 py-3.5 text-[11px] text-ink-ghost">
        <span>{t('search.localNote')}</span>
      </div>
    </div>
  );
}
