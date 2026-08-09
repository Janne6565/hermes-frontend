import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/ui';
import { HermesLockup } from '@/components/ui/HermesMark';
import { useNavRailLogic } from './useNavRailLogic';
import type { InboxSearch } from '@/routes/index';

/**
 * The left rail from screen 01, and the bottom tab bar on mobile.
 *
 * Counts sit next to their labels because the mockup's rail is a status readout as much as a
 * navigation control — you should be able to read the day off it without opening anything.
 */
export function NavRail() {
  const { t } = useTranslation();
  const {
    counts,
    openHigh,
    dismissed,
    health,
    lastSync,
    historyId,
    alertCount,
    ruleCount,
    categoryCount,
  } = useNavRailLogic();

  return (
    <nav className="flex w-52 flex-none flex-col border-r border-line bg-rail py-5 max-md:hidden">
      <HermesLockup name={t('app.name')} className="gap-2.5 px-4.5 pb-5" />

      <div className="label-caps px-4.5 pb-2 text-ink-fainter">{t('nav.mail')}</div>
      <div className="flex flex-col">
        <RailLink to="/" label={t('nav.inbox')} value={counts.total} exact search={{}} />
        <RailLink
          to="/"
          label={t('nav.highOpen')}
          value={openHigh}
          accent
          indent
          search={{ view: 'high' }}
        />
        <RailLink
          to="/"
          label={t('nav.dismissed')}
          value={dismissed}
          indent
          dim
          search={{ view: 'dismissed' }}
        />
        <RailLink
          to="/"
          label={t('nav.normal')}
          value={counts.normal}
          indent
          search={{ view: 'normal' }}
        />
        <RailLink
          to="/"
          label={t('nav.noise')}
          value={counts.noise}
          indent
          dim
          search={{ view: 'noise' }}
        />
        <RailLink to="/digest" label={t('nav.digest')} indent />
        {/* The shortcut is only discoverable if something says it exists. It sits on the row it
            duplicates rather than in a help screen nobody opens. */}
        <RailLink to="/search" label={t('nav.search')} hint="⌘K" indent />
        <RailLink to="/categories" label={t('nav.categories')} value={categoryCount} indent />
      </div>

      <div className="label-caps px-4.5 pt-5 pb-2 text-ink-fainter">{t('nav.system')}</div>
      <div className="flex flex-col">
        <RailLink to="/rules" label={t('nav.rules')} value={ruleCount} indent />
        <RailLink to="/health" label={t('nav.health')} indent dot={health} />
        <RailLink to="/alerts" label={t('nav.alerts')} value={alertCount} accent indent />
        <RailLink to="/settings" label={t('nav.settings')} indent />
      </div>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-line-dim px-4.5 pt-4">
        <div className="text-[10px] tracking-wider text-ink-fainter">
          {t('nav.lastSync')} {lastSync}
        </div>
        {historyId && (
          <div className="text-[10px] tracking-wider text-ink-fainter">
            {t('nav.historyId')} {historyId}
          </div>
        )}
      </div>
    </nav>
  );
}

interface RailLinkProps {
  readonly to: string;
  readonly label: string;
  readonly value?: number | string;
  readonly accent?: boolean;
  readonly indent?: boolean;
  readonly dim?: boolean;
  readonly exact?: boolean;
  readonly dot?: 'ok' | 'warn' | 'bad';
  readonly hint?: string;
  readonly search?: InboxSearch;
}

function RailLink({ to, label, value, accent, indent, dim, dot, hint, search }: RailLinkProps) {
  return (
    <Link
      to={to}
      search={search}
      // Exact so the five inbox rows, which share a pathname and differ only by `view`, highlight
      // one at a time instead of all matching the unfiltered row.
      activeOptions={{ exact: true, includeSearch: true }}
      className={cn(
        'flex items-center justify-between px-4.5 py-2 text-[13px] transition-colors',
        indent && 'pl-5',
        dim ? 'text-ink-faint' : 'text-ink-dim',
        'hover:text-ink',
      )}
      activeProps={{
        className: 'border-l-2 border-amber bg-[#1d1c1a] pl-4 text-ink-strong',
      }}
    >
      <span>{label}</span>
      {hint && <span className="ml-auto text-[10.5px] text-ink-ghost">{hint}</span>}
      {dot ? (
        <StatusDot state={dot} />
      ) : value !== undefined ? (
        <span className={cn(accent ? 'font-semibold text-amber' : 'text-ink-faint')}>{value}</span>
      ) : null}
    </Link>
  );
}
