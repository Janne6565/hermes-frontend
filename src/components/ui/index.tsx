import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Priority } from '@/api/types';

/**
 * The shared primitives.
 *
 * They exist mostly to keep the mockup's two rules from drifting: square corners everywhere, and
 * a palette where amber is the only accent and red means *broken*, never "high priority".
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  readonly loading?: boolean;
}

export function Button({
  variant = 'ghost',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      // `loading` and `disabled` compose: an in-flight request is also unpressable.
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2 border px-3 py-1.5 text-[11.5px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'border-amber bg-amber font-medium text-void hover:bg-amber-bright',
        variant === 'outline' &&
          'border-amber-line text-amber hover:border-amber hover:bg-amber-wash',
        variant === 'ghost' && 'border-line text-ink-dim hover:border-ink-faint hover:text-ink',
        variant === 'danger' && 'border-broken-line text-broken hover:bg-broken-wash',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={12} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Panel({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={cn('border border-line bg-surface', className)}>{children}</div>;
}

/** The all-caps, wide-tracked section label used throughout the mockup. */
export function SectionLabel({
  children,
  accent = false,
  className,
}: {
  readonly children: ReactNode;
  readonly accent?: boolean;
  readonly className?: string;
}) {
  return (
    <div className={cn('label-caps', accent ? 'text-amber' : 'text-ink-faint', className)}>
      {children}
    </div>
  );
}

/**
 * Priority badge. Only `high` is amber — normal and noise recede, which is the whole point of the
 * palette. Nothing here is ever red.
 */
export function PriorityBadge({ priority }: { readonly priority: Priority }) {
  return (
    <span
      className={cn(
        'label-caps px-1.5 py-0.5',
        priority === 'high' && 'bg-amber text-void',
        priority === 'normal' && 'border border-line text-ink-dim',
        priority === 'noise' && 'border border-line-dim text-ink-fainter',
      )}
    >
      {priority}
    </span>
  );
}

/** Traffic light for the health screen and the widget. */
export function StatusDot({
  state,
  className,
}: {
  readonly state: 'ok' | 'warn' | 'bad';
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block size-1.5 rounded-full',
        state === 'ok' && 'bg-healthy',
        state === 'warn' && 'bg-amber',
        state === 'bad' && 'bg-broken',
        className,
      )}
      aria-hidden
    />
  );
}

/** A number over a wide-tracked caption — the digest's headline counts. */
export function Stat({
  value,
  label,
  tone = 'muted',
}: {
  readonly value: number | string;
  readonly label: string;
  readonly tone?: 'accent' | 'bright' | 'muted';
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'text-4xl leading-none',
          tone === 'accent' && 'font-semibold text-amber',
          tone === 'bright' && 'text-ink-soft',
          tone === 'muted' && 'text-ink-ghost',
        )}
      >
        {value}
      </div>
      <div className="label-caps text-ink-dimmer">{label}</div>
    </div>
  );
}

/**
 * Empty and degraded states are designed, not improvised — a blank panel reads as "broken" when
 * it usually means "nothing happened today", and those must not look the same.
 */
export function EmptyState({
  title,
  hint,
  icon,
}: {
  readonly title: string;
  readonly hint?: string;
  readonly icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-ghost">{icon}</div>}
      <div className="text-[13px] text-ink-dim">{title}</div>
      {hint && <div className="font-sans text-[12.5px] text-ink-faint">{hint}</div>}
    </div>
  );
}

/** The amber-washed callout the mockup uses for degradation notices. */
export function Notice({
  label,
  children,
  tone = 'amber',
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly tone?: 'amber' | 'broken';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 border p-4',
        tone === 'amber' && 'border-amber-line bg-amber-wash',
        tone === 'broken' && 'border-broken-line bg-broken-wash',
      )}
    >
      <div className={cn('label-caps', tone === 'amber' ? 'text-amber' : 'text-broken')}>
        {label}
      </div>
      <div className="font-sans text-[13px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export function Spinner({ label }: { readonly label: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-12 text-ink-faint">
      <Loader2 size={14} className="animate-spin" aria-hidden />
      <span className="text-[12.5px]">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly retryLabel: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-12">
      <div className="text-[13px] text-broken">{message}</div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
