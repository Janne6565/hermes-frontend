import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SearchX, X } from 'lucide-react';
import { EmptyState, PriorityBadge, Spinner } from '@/components/ui';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate } from '@/lib/format';
import { MessageDialog } from '@/components/messages/MessageDialog';
import { useSearchLogic } from './useSearchLogic';
import type { Message } from '@/api/types';

/**
 * Screen 06.
 *
 * Runs against the backend's local Postgres index rather than Gmail, so it keeps working while
 * sync is down — which is exactly when you most want to look something up.
 */
export function SearchScreen() {
  const [opened, setOpened] = useState<Message | null>(null);
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const search = useSearchLogic();

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-12">
        <div className="flex w-full max-w-3xl flex-col gap-4.5">
          <label className="flex items-center gap-3 border border-amber-line bg-sunken px-4 py-3.5 focus-within:border-amber">
            <Search size={15} className="text-amber" aria-hidden />
            <input
              ref={search.inputRef}
              // The box is the entire purpose of this route.
              // biome-ignore lint/a11y/noAutofocus: having to tab to it would be the surprise
              autoFocus
              value={search.query}
              onChange={(event) => search.setQuery(event.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-transparent text-[15px] text-ink-strong outline-none placeholder:text-ink-ghost"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
            {/* Chips are the parsed query made visible. Removing one edits the text box, so the
                box and the chips can never disagree about what is being searched. */}
            {search.tokens.map((token) => (
              <button
                key={`${token.key}:${token.value}`}
                type="button"
                onClick={() => search.removeToken(token)}
                className="inline-flex items-center gap-1.5 border border-amber-line px-2.5 py-1 text-amber hover:bg-amber-wash"
              >
                {token.key}:{token.value}
                <X size={10} aria-hidden />
              </button>
            ))}

            {search.unknown.map((token) => (
              <span
                key={token}
                title={t('search.unknownToken')}
                className="border border-line px-2.5 py-1 text-ink-fainter line-through"
              >
                {token}
              </span>
            ))}

            {/* Only while nothing is being searched: once there are chips this row is the state of
                the query, and suggestions sitting among them would read as active filters. */}
            {!search.hasCriteria && (
              <>
                <span className="text-ink-ghost">{t('search.examples')}</span>
                {search.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => search.applyExample(example)}
                    className="border border-line px-2.5 py-1 text-ink-fainter transition-colors hover:border-amber-line hover:text-amber"
                  >
                    {example}
                  </button>
                ))}
              </>
            )}

            {search.hasCriteria && (
              <button
                type="button"
                onClick={search.clear}
                className="text-ink-fainter hover:text-ink-dim"
              >
                {t('search.clear')}
              </button>
            )}

            {search.results && !search.isFetching && (
              <span className="ml-auto text-ink-fainter">
                {t('search.results', { count: search.results.length })}
                {search.elapsedMs !== undefined && ` · ${search.elapsedMs} ms`}
              </span>
            )}
          </div>

          <div className="flex flex-col pb-10">
            {search.isFetching && <Spinner label={t('common.loading')} />}

            {!search.isFetching && search.hasCriteria && search.results?.length === 0 && (
              <EmptyState
                title={t('search.empty')}
                hint={t('search.emptyHint')}
                icon={<SearchX size={22} aria-hidden />}
              />
            )}

            {!search.isFetching &&
              search.results?.map((message) => (
                // Opens the detail dialog rather than jumping straight to Gmail. A search result
                // is usually a question about the triage — why is this noise, who sent it — and
                // leaving the app to answer it loses the result set. Gmail is still one click
                // away inside the dialog.
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setOpened(message)}
                  className="flex gap-4.5 border-t border-line-dim py-4 text-left hover:bg-[#171614]"
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
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="flex flex-none flex-wrap gap-6 border-t border-line-dim px-6 py-3.5 text-[11px] text-ink-ghost">
        <span>{t('search.localNote')}</span>
        <span className="ml-auto">{t('search.shortcuts')}</span>
      </div>

      {opened && (
        <MessageDialog messageId={opened.id} fallback={opened} onClose={() => setOpened(null)} />
      )}
    </div>
  );
}
