import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { Notice, SectionLabel } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { GoogleAccountPanel } from './GoogleAccountPanel';
import type { AppLanguage } from '@/i18n/resources';
import { cn } from '@/lib/utils';

/**
 * Screen 07.
 *
 * The account panel is interactive; everything below it is a read-only mirror of the ConfigMap.
 * Showing them as inert values rather than dead-looking form controls is deliberate — a toggle
 * that silently does nothing is worse than a label that says where the setting actually lives.
 */
export function SettingsScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const search = useSearch({ from: '/settings' });

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('settings.title')} />

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-8 lg:px-10">
        {search.error && (
          <Notice label={t('settings.notConnected')} tone="broken">
            {search.error}
          </Notice>
        )}

        <div className="max-w-xl">
          <GoogleAccountPanel justConnected={search.connected === '1'} />
        </div>

        <div className="grid max-w-4xl gap-8 md:grid-cols-2">
          <ReadOnlyGroup
            title={t('settings.digest')}
            rows={[
              { label: t('settings.sendTime'), value: '18:00 · Europe/Berlin' },
              { label: t('settings.includeNoise'), value: 'on' },
              { label: t('settings.skipEmpty'), value: 'off' },
            ]}
          />
          <ReadOnlyGroup
            title={t('settings.quietHours')}
            rows={[
              { label: t('settings.holdBetween'), value: '23:00 — 07:30' },
              { label: t('settings.allowSecurity'), value: 'on' },
            ]}
            note={t('settings.quietNote')}
          />
          <ReadOnlyGroup
            title={t('settings.ntfy')}
            rows={[
              { label: t('settings.topic'), value: 'janus-mail' },
              { label: t('settings.highPriorityLevel'), value: t('settings.urgentOverride') },
            ]}
          />
          <ReadOnlyGroup
            title={t('settings.dataAccess')}
            rows={[
              { label: t('settings.gmailScope'), value: 'gmail.readonly' },
              {
                label: t('settings.sentToClassifier'),
                value: t('settings.sentToClassifierValue'),
              },
              { label: t('settings.deleteAfter'), value: t('settings.days', { count: 90 }) },
              { label: t('settings.pollInterval'), value: '180 s' },
            ]}
          />
        </div>

        <section className="flex max-w-xl flex-col gap-3">
          <SectionLabel accent>Language</SectionLabel>
          <div className="flex gap-1.5">
            {(['en', 'de'] as const).map((option: AppLanguage) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={cn(
                  'border px-3 py-1.5 text-[11.5px]',
                  language === option
                    ? 'border-amber-line text-amber'
                    : 'border-line text-ink-faint hover:text-ink-dim',
                )}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReadOnlyGroup({
  title,
  rows,
  note,
}: {
  readonly title: string;
  readonly rows: readonly { label: string; value: string }[];
  readonly note?: string;
}) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3.5">
      <SectionLabel accent>{title}</SectionLabel>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-4 border-b border-line-faint pb-3 last:border-b-0"
        >
          <span className="flex-1 text-[13px] text-ink-soft">{row.label}</span>
          <span className="text-[13px] text-ink-dim">{row.value}</span>
        </div>
      ))}
      {note && <p className="font-sans text-[12.5px] leading-relaxed text-ink-faint">{note}</p>}
      <p className="text-[11px] text-ink-ghost">{t('settings.serverManaged')}</p>
    </section>
  );
}
