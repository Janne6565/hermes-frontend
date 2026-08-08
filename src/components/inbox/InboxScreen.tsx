import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';
import { EmptyState, ErrorState, SectionLabel, Spinner } from '@/components/ui';
import { HighMessageRow, NormalMessageRow } from './MessageRow';
import { Reader } from './Reader';
import { useInboxLogic } from './useInboxLogic';

/** Screen 01 — the list on the left, the reader on the right. */
export function InboxScreen() {
  const { t } = useTranslation();
  const inbox = useInboxLogic();

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
          <div className="ml-auto flex gap-1.5 text-[11px]">
            <span className="border border-amber-line px-2 py-1 text-amber">
              {t('priority.high')} {inbox.counts?.high ?? 0}
            </span>
            <span className="border border-line px-2 py-1 text-ink-dim">
              {t('priority.normal')} {inbox.counts?.normal ?? 0}
            </span>
            <span className="border border-line-dim px-2 py-1 text-ink-fainter">
              {t('priority.noise')} {inbox.counts?.noise ?? 0}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState
              title={t('inbox.empty')}
              hint={t('inbox.emptyHint')}
              icon={<Inbox size={22} aria-hidden />}
            />
          ) : (
            <>
              {inbox.high.length > 0 && (
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
                      selected={message.id === inbox.selectedId}
                      onSelect={() => inbox.setSelectedId(message.id)}
                      onToggleDismissed={() => inbox.toggleDismissed(message)}
                    />
                  ))}
                </>
              )}

              {inbox.normal.length > 0 && (
                <>
                  <SectionLabel className="px-4.5 pt-4.5 pb-1.5">
                    {t('inbox.normalSection', { count: inbox.normal.length })}
                  </SectionLabel>
                  {inbox.normal.map((message) => (
                    <NormalMessageRow
                      key={message.id}
                      message={message}
                      selected={message.id === inbox.selectedId}
                      onSelect={() => inbox.setSelectedId(message.id)}
                    />
                  ))}
                </>
              )}

              {(inbox.noise?.count ?? 0) > 0 && (
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
                    // Noise is counted, never listed. The breakdown is what makes the count
                    // auditable — "23 noise" is only trustworthy if you can see what it was.
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
            </>
          )}
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
