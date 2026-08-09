import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { Button, ErrorState, Notice, SectionLabel, Spinner } from '@/components/ui';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useConfig, useSendTestPush } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTime } from '@/lib/format';
import { GoogleAccountPanel } from './GoogleAccountPanel';
import type { AppLanguage } from '@/i18n/resources';
import { cn } from '@/lib/utils';

/**
 * Screen 07.
 *
 * The account panel and the test push are interactive; everything else is a read-only mirror of
 * the ConfigMap, read from the server rather than hardcoded. Showing them as inert values rather
 * than dead-looking form controls is deliberate — a toggle that silently does nothing is worse
 * than a label that says where the setting actually lives.
 */
export function SettingsScreen() {
  const { t } = useTranslation();
  const { language, setLanguage, locale } = useLanguage();
  const search = useSearch({ from: '/settings' });
  const config = useConfig();
  const testPush = useSendTestPush();

  const onOff = (value: boolean) => (value ? t('rules.on') : t('rules.off'));

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

        {config.isLoading && <Spinner label={t('common.loading')} />}
        {config.isError && (
          <ErrorState
            message={t('common.failed')}
            retryLabel={t('common.retry')}
            onRetry={() => void config.refetch()}
          />
        )}

        {config.data && (
          <>
            {config.data.shadowMode && (
              <Notice label={t('settings.shadowMode')}>{t('settings.shadowModeNote')}</Notice>
            )}

            <div className="grid max-w-4xl gap-8 md:grid-cols-2">
              <ReadOnlyGroup
                title={t('settings.digest')}
                rows={[
                  {
                    label: t('settings.sendTime'),
                    value: `${config.data.digest.sendTime} · ${config.data.timezone}`,
                  },
                  {
                    label: t('settings.includeNoise'),
                    value: onOff(config.data.digest.includeNoise),
                  },
                  {
                    label: t('settings.skipEmpty'),
                    value: onOff(config.data.digest.skipWhenEmpty),
                  },
                ]}
              />

              <ReadOnlyGroup
                title={t('settings.quietHours')}
                rows={[
                  {
                    label: t('settings.holdBetween'),
                    value: config.data.quietHours.enabled
                      ? `${config.data.quietHours.start} — ${config.data.quietHours.end}`
                      : t('settings.disabled'),
                  },
                  {
                    label: t('settings.allowSecurity'),
                    value: onOff(config.data.quietHours.allowSecurityAlerts),
                  },
                ]}
                note={config.data.quietHours.enabled ? t('settings.quietNote') : undefined}
              />

              <ReadOnlyGroup
                title={t('settings.ntfy')}
                rows={[
                  { label: t('settings.topic'), value: config.data.ntfy.topic },
                  {
                    label: t('settings.highPriorityLevel'),
                    value: t('settings.urgentOverride'),
                  },
                ]}
              >
                {/* The one control on this screen that acts rather than reports. It deliberately
                    bypasses shadow mode: proving the channel works is the whole point. */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    loading={testPush.isPending}
                    onClick={() => testPush.mutate()}
                  >
                    {t('settings.sendTestPush')}
                  </Button>
                  {testPush.data && (
                    <span
                      className={cn(
                        'text-[11.5px]',
                        testPush.data.delivered ? 'text-healthy' : 'text-broken',
                      )}
                    >
                      {testPush.data.delivered
                        ? t('settings.testDelivered', {
                            time: formatTime(testPush.data.sentAt, locale),
                            ms: String(testPush.data.durationMs),
                          })
                        : t('settings.testFailed')}
                    </span>
                  )}
                  {testPush.isError && (
                    <span className="text-[11.5px] text-broken">{t('settings.testFailed')}</span>
                  )}
                </div>
              </ReadOnlyGroup>

              <ReadOnlyGroup
                title={t('settings.dataAccess')}
                rows={[
                  { label: t('settings.gmailScope'), value: config.data.data.gmailScope },
                  {
                    label: t('settings.sentToClassifier'),
                    value: t('settings.sentToClassifierValue', {
                      count: config.data.data.snippetLength,
                    }),
                  },
                  {
                    label: t('settings.deleteAfter'),
                    value: t('settings.days', { count: config.data.data.retentionDays }),
                  },
                  {
                    label: t('settings.pollInterval'),
                    value: `${config.data.data.pollIntervalSeconds} s`,
                  },
                ]}
              />
            </div>
          </>
        )}

        <section className="flex max-w-xl flex-col gap-3">
          <SectionLabel accent>{t('settings.language')}</SectionLabel>
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
  children,
}: {
  readonly title: string;
  readonly rows: readonly { label: string; value: string }[];
  readonly note?: string;
  readonly children?: React.ReactNode;
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
          <span className="text-right text-[13px] text-ink-dim">{row.value}</span>
        </div>
      ))}
      {note && <p className="font-sans text-[12.5px] leading-relaxed text-ink-faint">{note}</p>}
      {children}
      <p className="text-[11px] text-ink-ghost">{t('settings.serverManaged')}</p>
    </section>
  );
}
