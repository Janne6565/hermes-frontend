import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format';
import { useLanguage } from '@/hooks/useLanguage';
import type { Message } from '@/api/types';

/**
 * A high-priority row: sender, subject, reason.
 *
 * A dismissed item stays in place but recedes to near-invisible rather than disappearing — the
 * mockup's "cleared · undo" state. Removing it would make an accidental dismissal unrecoverable
 * without going hunting.
 */
export function HighMessageRow({
  message,
  selected,
  onSelect,
  onToggleDismissed,
}: {
  readonly message: Message;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onToggleDismissed: () => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const cleared = message.dismissed;
  const isAlert = message.reason?.toLowerCase().includes('alert') ?? false;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-line-faint border-l-2 px-4.5 py-3 text-left transition-colors',
        cleared ? 'border-l-line' : 'border-l-amber',
        selected ? 'bg-[#1b1a18]' : 'hover:bg-[#171614]',
      )}
    >
      <div className="flex items-baseline gap-2.5">
        <span
          className={cn(
            'truncate text-[12.5px] font-semibold',
            cleared ? 'text-ink-faint' : 'text-ink-strong',
          )}
        >
          {message.senderName}
        </span>
        {isAlert && !cleared && (
          <span className="label-caps flex-none bg-amber px-1.5 py-0.5 text-void">infra</span>
        )}
        <span className="ml-auto flex flex-none items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onToggleDismissed();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                event.preventDefault();
                onToggleDismissed();
              }
            }}
            className={cn(
              'border px-1.5 py-0.5 text-[10px]',
              cleared
                ? 'border-line-faint text-ink-ghost'
                : 'border-line text-ink-faint hover:border-amber-line hover:text-amber',
            )}
          >
            {cleared ? t('inbox.undo') : t('inbox.dismiss').toLowerCase()}
          </span>
          <span className="text-[11px] text-ink-fainter">
            {formatTime(message.receivedAt, locale)}
          </span>
        </span>
      </div>
      <div
        className={cn('truncate text-[12.5px]', cleared ? 'text-ink-fainter' : 'text-ink-soft')}
      >
        {message.subject}
      </div>
      {message.reason && (
        <div
          className={cn(
            'truncate text-[11px] italic',
            cleared ? 'text-ink-ghost' : 'text-ink-dimmer',
          )}
        >
          {message.reason}
        </div>
      )}
    </button>
  );
}

/** A normal row: one line of sender, one of summary. No reason, no actions — it can wait. */
export function NormalMessageRow({
  message,
  selected,
  onSelect,
}: {
  readonly message: Message;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const { locale } = useLanguage();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-0.5 border-b border-line-faint py-2 pr-4.5 pl-5 text-left transition-colors',
        selected ? 'bg-[#1b1a18]' : 'hover:bg-[#171614]',
      )}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="truncate text-[12px] text-ink-muted">{message.senderName}</span>
        <span className="ml-auto flex-none text-[11px] text-ink-fainter">
          {formatTime(message.receivedAt, locale)}
        </span>
      </div>
      <div className="truncate text-[12px] text-ink-dimmer">
        {message.summary ?? message.subject}
      </div>
    </button>
  );
}
