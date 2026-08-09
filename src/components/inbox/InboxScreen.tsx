import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { Inbox, RefreshCw } from 'lucide-react';
import type { SyncResult } from '@/api/types';
import { EmptyState, ErrorState, SectionLabel, Spinner } from '@/components/ui';
import { useHasReaderPane } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { HighMessageRow, NormalMessageRow } from './MessageRow';
import { Reader } from './Reader';
import { useInboxLogic } from './useInboxLogic';
import type { InboxView } from './views';

/** Screen 01 — the list on the left, the reader on the right. */
export function InboxScreen() {
  const { t } = useTranslation();
  const inbox = useInboxLogic();
  const hasReaderPane = useHasReaderPane();
  const navigate = useNavigate();

  // With no reader pane on screen there is nowhere for a selection to show, so a tap has to open
  // the message on its own route instead of silently selecting an invisible thing.
  const open = (id: string) => {
    inbox.setSelectedId(id);
    if (!hasReaderPane) void navigate({ to: '/message/$id', params: { id } });
  };

  if (inbox.isLoading) {
    return <Spinner label={t('common.loading')} />;
  }
  if (inbox.isError) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void inbox.refetch()}
      />
    );
  }

  const isEmpty = inbox.high.length === 0 && inbox.normal.length === 0;

  return (
    <div className="flex h-full">
      <section className="flex w-full flex-col border-r border-line md:w-[452px] md:flex-none">
        <div className="flex h-13 flex-none items-center gap-3.5 border-b border-line-dim px-4.5">
          <span className="text-[12px] tracking-widest text-ink-dim uppercase">
            {t('nav.inbox')}
          </span>
          <SyncNotice notice={inbox.syncNotice} />
          <div className="ml-auto flex gap-1.5 text-[11px]">
            <FilterChip
              view="high"
              active={inbox.view === 'high'}
              onSelect={inbox.setView}
              tone="accent"
            >
              {t('priority.high')} {inbox.counts?.high ?? 0}
            </FilterChip>
            <FilterChip view="normal" active={inbox.view === 'normal'} onSelect={inbox.setView}>
              {t('priority.normal')} {inbox.counts?.normal ?? 0}
            </FilterChip>
            <FilterChip
              view="noise"
              active={inbox.view === 'noise'}
              onSelect={inbox.setView}
              tone="dim"
            >
              {t('priority.noise')} {inbox.counts?.noise ?? 0}
            </FilterChip>
          </div>
          <button
            type="button"
            onClick={inbox.refresh}
            disabled={inbox.refreshing}
            // The poll runs every three minutes on its own; this is for the minutes in between,
            // when you know a mail was just sent and would rather not wait out the tick.
            title={t('inbox.refreshHint')}
            aria-label={t('inbox.refresh')}
            className="-mr-1 flex-none p-1 text-ink-fainter transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-ink-ghost"
          >
            <RefreshCw size={13} className={cn(inbox.refreshing && 'animate-spin')} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <>
            {inbox.showHigh && inbox.high.length > 0 && (
              <>
                <SectionLabel accent className="px-4.5 pt-3.5 pb-1.5">
                  {t('inbox.highSection', {
                    open: String(inbox.openCount),
                    dismissed: String(inbox.dismissedCount),
                  })}
                </SectionLabel>
                {inbox.high.map((message) => (
                  <HighMessageRow
                    key={message.id}
                    message={message}
                    selected={hasReaderPane && message.id === inbox.selectedId}
                    onSelect={() => open(message.id)}
                    onToggleDismissed={() => inbox.toggleDismissed(message)}
                  />
                ))}
              </>
            )}

            {inbox.showNormal && inbox.normal.length > 0 && (
              <>
                <SectionLabel className="px-4.5 pt-4.5 pb-1.5">
                  {t('inbox.normalSection', { count: inbox.normal.length })}
                </SectionLabel>
                {inbox.normal.map((message) => (
                  <NormalMessageRow
                    key={message.id}
                    message={message}
                    selected={hasReaderPane && message.id === inbox.selectedId}
                    onSelect={() => open(message.id)}
                  />
                ))}
              </>
            )}

            {inbox.showNoise && (inbox.noise?.count ?? 0) > 0 && (
              <div className="flex flex-col gap-2 px-5 py-4">
                <button
                  type="button"
                  onClick={inbox.toggleNoise}
                  className="flex items-center gap-2.5 text-[11.5px] text-ink-fainter hover:text-ink-dim"
                >
                  <span className="tracking-widest uppercase">
                    {t('inbox.noiseSection', { count: inbox.noise?.count ?? 0 })}
                  </span>
                  <span className="h-px flex-1 bg-line-faint" />
                  <span>{inbox.noiseExpanded ? t('inbox.collapse') : t('inbox.expand')}</span>
                </button>
                {inbox.noiseExpanded && (
                  // The domain breakdown is what makes the count auditable — "23 noise" is only
                  // trustworthy if you can see it was 18 newsletters and not 18 lost invoices.
                  <ul className="flex flex-col gap-1 pl-1 text-[11.5px] text-ink-ghost">
                    {inbox.noise?.categories.map((category) => (
                      <li key={category.label} className="flex justify-between">
                        <span>{category.label}</span>
                        <span>{category.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* The noise view lists the messages themselves. Elsewhere noise stays a count, so
                  it cannot crowd out the mail that mattered — but this route *is* the request to
                  see it, and answering that with a count alone would be withholding. */}
            {inbox.noiseMessages.map((message) => (
              <NormalMessageRow
                key={message.id}
                message={message}
                selected={hasReaderPane && message.id === inbox.selectedId}
                onSelect={() => open(message.id)}
              />
            ))}

            {isEmpty && (inbox.noise?.count ?? 0) === 0 && (
              <EmptyState
                title={t('inbox.empty')}
                hint={t('inbox.emptyHint')}
                icon={<Inbox size={22} aria-hidden />}
              />
            )}
          </>
        </div>
      </section>

      <div className="hidden min-w-0 flex-1 md:flex">
        <Reader
          message={inbox.selected}
          busy={inbox.feedbackPending || inbox.dismissingId !== undefined}
          onDismiss={() => inbox.selected && inbox.toggleDismissed(inbox.selected)}
          onNeverNotify={() => inbox.selected && inbox.neverNotifySender(inbox.selected)}
          onMarkNormal={() => inbox.selected && inbox.markNormal(inbox.selected)}
        />
      </div>
    </div>
  );
}

/**
 * What the last manual refresh found, for the few seconds it is still news.
 *
 * A refresh that changes nothing on screen is the common case — the poll usually got there first —
 * and without a word for it the button is indistinguishable from a broken one. A mailbox that threw
 * is the one case that gets the broken colour, because then the list is not merely unchanged, it is
 * stale and lying.
 */
function SyncNotice({ notice }: { readonly notice: SyncResult | 'error' | null }) {
  const { t } = useTranslation();
  if (!notice) return null;

  if (notice === 'error' || notice.failed > 0) {
    return <span className="truncate text-[11px] text-broken">{t('inbox.syncFailed')}</span>;
  }

  const label = notice.alreadyRunning
    ? t('inbox.syncRunning')
    : notice.ingested > 0
      ? t('inbox.syncIngested', { count: notice.ingested })
      : t('inbox.syncNothingNew');

  return <span className="truncate text-[11px] text-ink-fainter">{label}</span>;
}

/** A header chip. Clicking the active one clears the filter — the chip is its own toggle. */
function FilterChip({
  view,
  active,
  tone,
  onSelect,
  children,
}: {
  readonly view: InboxView;
  readonly active: boolean;
  readonly tone?: 'accent' | 'dim';
  readonly onSelect: (next: InboxView | undefined) => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(active ? undefined : view)}
      className={cn(
        'border px-2 py-1 transition-colors',
        active
          ? 'border-amber-line text-amber'
          : tone === 'accent'
            ? 'border-line text-ink-dim hover:border-amber-line hover:text-amber'
            : tone === 'dim'
              ? 'border-line-dim text-ink-fainter hover:text-ink-dim'
              : 'border-line text-ink-dim hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
