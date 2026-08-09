import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, Spinner } from '@/components/ui';
import { Reader } from './Reader';
import { useMessageLogic } from './useMessageLogic';

/**
 * One message, full screen.
 *
 * This exists for the single-column layout, where the inbox has no reader pane beside it — but it
 * is a real route rather than a mobile-only sheet, so any message stays linkable from anywhere.
 */
export function MessageScreen() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/message/$id' });
  const message = useMessageLogic(id);

  if (message.isLoading) return <Spinner label={t('common.loading')} />;
  if (message.isError || !message.data) {
    return (
      <ErrorState
        message={t('common.failed')}
        retryLabel={t('common.retry')}
        onRetry={() => void message.refetch()}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-13 flex-none items-center border-b border-line-dim px-4.5">
        <Link to="/" className="flex items-center gap-2 text-[12px] text-ink-dim hover:text-ink">
          <ArrowLeft size={14} aria-hidden />
          {t('nav.inbox')}
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        <Reader
          message={message.data}
          busy={message.busy}
          onDismiss={message.toggleDismissed}
          onNeverNotify={message.neverNotifySender}
          onMarkNormal={message.markNormal}
        />
      </div>
    </div>
  );
}
