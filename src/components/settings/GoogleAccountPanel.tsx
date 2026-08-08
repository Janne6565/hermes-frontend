import { useTranslation } from 'react-i18next';
import { CheckCircle2, LogIn, Unplug } from 'lucide-react';
import { Button, Notice, SectionLabel, StatusDot } from '@/components/ui';
import { useConnectGoogle, useDisconnectGoogle, useGoogleAccount } from '@/api/queries';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateLong } from '@/lib/format';

/**
 * Connect the mailbox with Sign in with Google.
 *
 * The browser never sees a token: this only sends the user to Google's consent screen and back to
 * a backend callback, which exchanges the code server-side and stores the refresh token
 * encrypted. What comes back over the API is the address and a connected flag, nothing more.
 */
export function GoogleAccountPanel({ justConnected }: { readonly justConnected: boolean }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { data, isLoading } = useGoogleAccount();
  const connect = useConnectGoogle();
  const disconnect = useDisconnectGoogle();

  const connected = data?.connected ?? false;
  // Without a registered OAuth client there is nothing to redirect to, so the button is disabled
  // and the reason is stated rather than failing on click.
  const canConnect = data?.clientConfigured ?? false;

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel accent>{t('settings.account')}</SectionLabel>

      {justConnected && (
        <div className="flex items-center gap-2 border border-amber-line bg-amber-wash px-3.5 py-2.5 text-[12.5px] text-amber">
          <CheckCircle2 size={14} aria-hidden />
          {t('settings.connectSuccess')}
        </div>
      )}

      <div className="flex flex-col gap-3.5 border border-line bg-raised p-4.5">
        <div className="flex items-center gap-2.5">
          <StatusDot state={connected ? 'ok' : 'warn'} />
          <span className="text-[13px] text-ink">
            {isLoading
              ? t('common.loading')
              : connected
                ? t('settings.connected')
                : t('settings.notConnected')}
          </span>
        </div>

        {connected && (
          <div className="flex flex-col gap-1 text-[12px] text-ink-dim">
            <span className="text-ink-soft">
              {data?.email
                ? t('settings.connectedAs', { email: data.email })
                : t('settings.connected')}
            </span>
            {data?.connectedAt && (
              <span className="text-ink-faint">
                {t('settings.connectedSince', {
                  date: formatDateLong(data.connectedAt, locale),
                })}
              </span>
            )}
            <span className="text-ink-faint">{data?.scope}</span>
          </div>
        )}

        <p className="font-sans text-[12.5px] leading-relaxed text-ink-dimmer">
          {t('settings.scopeNote')}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={connected ? 'ghost' : 'primary'}
            disabled={!canConnect}
            loading={connect.isPending}
            onClick={() => connect.mutate()}
          >
            <LogIn size={12} aria-hidden />
            {connect.isPending
              ? t('settings.connecting')
              : connected
                ? t('settings.reconnect')
                : t('settings.signIn')}
          </Button>

          {connected && (
            <Button
              variant="danger"
              loading={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              <Unplug size={12} aria-hidden />
              {disconnect.isPending ? t('settings.disconnecting') : t('settings.disconnect')}
            </Button>
          )}
        </div>

        {connected && (
          <p className="font-sans text-[11.5px] leading-relaxed text-ink-faint">
            {t('settings.revokeNote')}
          </p>
        )}
      </div>

      {!isLoading && !canConnect && (
        <Notice label={t('settings.notConnected')}>{t('settings.clientMissing')}</Notice>
      )}
    </section>
  );
}
