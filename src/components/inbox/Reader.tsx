import { useTranslation } from 'react-i18next';
import { ExternalLink, Check, BellOff, ArrowDown } from 'lucide-react';
import { Button, EmptyState, PriorityBadge } from '@/components/ui';
import { formatDateLong, formatTime } from '@/lib/format';
import { useLanguage } from '@/hooks/useLanguage';
import type { Message } from '@/api/types';

/**
 * The reader pane from screen 01.
 *
 * It shows the classifier's verdict *above* the mail, which is deliberate: the point of the screen
 * is to let you judge whether the triage decision was right, not just to read the message.
 *
 * There is no message body here, and there cannot be. The backend stores a 500-character
 * plaintext snippet and nothing else — no HTML is ever fetched, stored or rendered.
 */
export function Reader({
  message,
  onDismiss,
  onNeverNotify,
  onMarkNormal,
  busy,
}: {
  readonly message: Message | null;
  readonly onDismiss: () => void;
  readonly onNeverNotify: () => void;
  readonly onMarkNormal: () => void;
  readonly busy: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  if (!message) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title={t('inbox.selectPrompt')} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-13 flex-none items-center gap-2.5 border-b border-line-dim px-5">
        <span className="hidden text-[11px] tracking-wider text-ink-fainter lg:inline">
          gmail_id {message.gmailId}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant={message.dismissed ? 'ghost' : 'primary'} onClick={onDismiss} loading={busy}>
            <Check size={12} aria-hidden />
            {message.dismissed ? t('inbox.undo') : t('inbox.dismiss')}
          </Button>
          <a
            href={message.gmailUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 border border-amber-line px-3 py-1.5 text-[11.5px] text-amber hover:bg-amber-wash"
          >
            {t('inbox.openInGmail')}
            <ExternalLink size={12} aria-hidden />
          </a>
          <Button onClick={onNeverNotify} loading={busy}>
            <BellOff size={12} aria-hidden />
            {t('inbox.neverNotify')}
          </Button>
          {message.priority === 'high' && (
            <Button onClick={onMarkNormal} loading={busy}>
              <ArrowDown size={12} aria-hidden />
              {t('inbox.downgrade')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-sans text-[23px] leading-snug font-medium text-ink-bright">
            {message.subject}
          </h2>
          <div className="flex flex-wrap gap-4 text-[12px] text-ink-dimmer">
            <span className="text-ink-soft">{message.senderName}</span>
            <span>{message.sender}</span>
            <span>
              {formatDateLong(message.receivedAt, locale)}, {formatTime(message.receivedAt, locale)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border border-amber-line bg-amber-wash px-4.5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <PriorityBadge priority={message.priority} />
            <span className="text-[11px] text-ink-dimmer">
              {t('inbox.classifiedBy')} <span className="text-ink-soft">{message.classifiedBy}</span>
            </span>
            <span className="ml-auto text-[11px] text-ink-fainter">
              {message.notifiedAt
                ? t('inbox.notified', { time: formatTime(message.notifiedAt, locale) })
                : t('inbox.notPushed')}
            </span>
          </div>
          {message.reason && (
            <div className="font-sans text-[14px] text-ink">{message.reason}</div>
          )}
          {message.summary && (
            <div className="font-sans text-[13px] text-ink-dim">
              {t('inbox.summary')}: {message.summary}
            </div>
          )}
        </div>

        {message.snippet && (
          <div className="max-w-[62ch] font-sans text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink-soft">
            {message.snippet}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-5 border-t border-line-dim pt-4 text-[11px] text-ink-fainter">
          <span>{t('inbox.readOnly')}</span>
          <span className="ml-auto hidden lg:inline">{t('inbox.shortcuts')}</span>
        </div>
      </div>
    </div>
  );
}
