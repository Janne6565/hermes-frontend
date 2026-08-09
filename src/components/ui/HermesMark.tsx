import { cn } from '@/lib/utils';

/**
 * The Hermes mark — four tiles, one lit.
 *
 * Mark C of the four the design explored, and the one it selected. It wins because it is not a
 * drawing of anything: it is the console's own visual language shrunk to 16 px. The amber square
 * already sits in the nav rail as the active-row marker, so the logo and the interface state read
 * as the same idea — most of it is quiet, one thing is not.
 *
 * Pure geometry on a 44-unit grid, so it survives being rendered at favicon size without hinting.
 */
export function HermesMark({
  size = 18,
  className,
}: {
  readonly size?: number;
  readonly className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <title>Hermes</title>
      <rect x="5" y="5" width="15" height="15" fill="var(--color-line)" />
      <rect x="24" y="5" width="15" height="15" fill="var(--color-line)" />
      <rect x="5" y="24" width="15" height="15" fill="var(--color-line)" />
      <rect x="24" y="24" width="15" height="15" fill="var(--color-amber)" />
    </svg>
  );
}

/** The mark plus the wordmark, as it appears at the top of the rail and on the unlock gate. */
export function HermesLockup({
  name,
  size = 18,
  className,
}: {
  readonly name: string;
  readonly size?: number;
  readonly className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <HermesMark size={size} />
      <span className="text-[13px] font-semibold tracking-wide">{name}</span>
    </span>
  );
}
