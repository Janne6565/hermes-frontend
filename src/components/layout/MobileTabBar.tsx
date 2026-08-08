import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/** The bottom bar from the 390×844 mockups. Four destinations, nothing else fits honestly. */
export function MobileTabBar() {
  const { t } = useTranslation();
  const tabs = [
    { to: '/', label: t('nav.inbox') },
    { to: '/digest', label: t('nav.digest') },
    { to: '/alerts', label: t('nav.alerts') },
    { to: '/settings', label: t('nav.settings') },
  ];

  return (
    <nav className="flex flex-none justify-between border-t border-line-dim px-6 pt-3.5 pb-5 text-[11px] text-ink-fainter md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: tab.to === '/' }}
          activeProps={{ className: 'text-amber' }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
