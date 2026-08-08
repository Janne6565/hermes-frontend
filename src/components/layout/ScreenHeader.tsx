import type { ReactNode } from 'react';

/** The 52px title bar every full screen in the mockup shares. */
export function ScreenHeader({
  title,
  subtitle,
  actions,
}: {
  readonly title: string;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <header className="flex h-13 flex-none items-center gap-4 border-b border-line-dim px-6">
      <h1 className="text-[12px] tracking-widest text-ink-dim uppercase">{title}</h1>
      {subtitle && <div className="truncate text-[12px] text-ink-fainter">{subtitle}</div>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
