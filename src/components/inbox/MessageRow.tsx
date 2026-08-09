import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format';
import { useLanguage } from '@/hooks/useLanguage';
import type { Message } from '@/api/types';

/**
 * The category, as a dot and a word.
 *
 * A dot rather than a filled badge on purpose: the priority badge is the only thing in a row
 * allowed to carry weight, and a second coloured block would compete with it. The colour here says
 * "which bucket", never "how urgent".
 */
function CategoryChip({
  message,
  dim = false,
}: {
  readonly message: Message;
  readonly dim?: boolean;
}) {
  if (!message.category) return null;
  return (
    <span className="flex flex-none items-center gap-1.5">
      <span
        className="size-1.5"
        style={{ backgroundColor: message.categoryColor ?? 'var(--color-line)' }}
        aria-hidden
      />
      <span className={cn('label-caps', dim ? 'text-ink-faint' : 'text-ink-dimmer')}>
        {message.category}
      </span>
    </span>
  );
}

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

  return (
    // The dismiss control is a real <button>, so it cannot live inside the row's own button —
    // nested buttons are invalid HTML and the previous role="button" span was a workaround that
    // reimplemented keyboard handling by hand. The row is a container; the two controls are
    // siblings, with the select button stretched over the row via an ::after overlay.
    <div
      className={cn(
        'relative flex flex-col gap-1 border-b border-line-faint border-l-2 px-4.5 py-3 transition-colors',
        cleared ? 'border-l-line' : 'border-l-amber',
        selected ? 'bg-[#1b1a18]' : 'hover:bg-[#171614]',
      )}
    >
      <div className="flex items-baseline gap-2.5">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'truncate text-left text-[12.5px] font-semibold after:absolute after:inset-0 after:content-[""]',
            cleared ? 'text-ink-faint' : 'text-ink-strong',
          )}
        >
          {message.senderName}
        </button>
        {message.tag && !cleared && (
          <span className="label-caps flex-none bg-amber px-1.5 py-0.5 text-void">
            {message.tag}
          </span>
        )}
        <CategoryChip message={message} dim={cleared} />
        <span className="relative z-10 ml-auto flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={onToggleDismissed}
            className={cn(
              'border px-1.5 py-0.5 text-[10px]',
              cleared
                ? 'border-line-faint text-ink-ghost'
                : 'border-line text-ink-faint hover:border-amber-line hover:text-amber',
            )}
          >
            {cleared ? t('inbox.undo') : t('inbox.dismiss').toLowerCase()}
          </button>
          <span className="text-[11px] text-ink-fainter">
            {formatTime(message.receivedAt, locale)}
          </span>
        </span>
      </div>
      <div className={cn('truncate text-[12.5px]', cleared ? 'text-ink-fainter' : 'text-ink-soft')}>
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
    </div>
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
        <CategoryChip message={message} dim />
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
