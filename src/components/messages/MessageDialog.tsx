import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Reader } from '@/components/inbox/Reader';
import { Spinner } from '@/components/ui';
import { useMessageLogic } from '@/components/inbox/useMessageLogic';
import type { Message } from '@/api/types';

/**
 * One message, over whatever you were doing.
 *
 * It wraps {@link Reader} rather than reimplementing it, so the verdict-above-the-mail layout and
 * the four actions stay in one place — including "Open in Gmail", which is why replacing the
 * search results' Gmail links with this loses nothing: the link is still here, one level in.
 *
 * @param fallback the message the caller already has in hand. Rendered immediately while the
 *     canonical fetch resolves, so opening a search result does not flash a spinner over data that
 *     was already on screen. The fetch still happens, because the list row may be minutes stale and
 *     the actions must operate on the current state.
 */
export function MessageDialog({
  messageId,
  fallback,
  onClose,
}: {
  readonly messageId: string;
  readonly fallback?: Message;
  readonly onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDivElement>(null);
  const state = useMessageLogic(messageId);
  const message = state.data ?? fallback ?? null;

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 px-4 py-12">
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
        aria-label={message?.subject ?? t('search.title')}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col border border-line bg-surface outline-none"
      >
        <div className="flex flex-none items-center gap-3 border-b border-line-dim px-5 py-3">
          <span className="label-caps text-ink-fainter">{t('search.messageDetail')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="ml-auto text-ink-faint hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {message ? (
            <Reader
              message={message}
              busy={state.busy}
              onDismiss={state.toggleDismissed}
              onNeverNotify={state.neverNotifySender}
              onMarkNormal={state.markNormal}
            />
          ) : (
            <Spinner label={t('common.loading')} />
          )}
        </div>
      </div>
    </div>
  );
}
