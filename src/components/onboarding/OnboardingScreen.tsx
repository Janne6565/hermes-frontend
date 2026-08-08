import { useTranslation } from 'react-i18next';
import { Check, ArrowRight } from 'lucide-react';
import { Button, SectionLabel } from '@/components/ui';
import { GoogleAccountPanel } from '@/components/settings/GoogleAccountPanel';
import { useGoogleAccount, useHealth } from '@/api/queries';
import { cn } from '@/lib/utils';

/**
 * Screen 08 — first run.
 *
 * The steps are driven by real state rather than a stored wizard position, so the screen is
 * always honest about where setup actually stands even after a reinstall or a disconnect.
 */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const account = useGoogleAccount();
  const health = useHealth();

  const gmailDone = account.data?.connected ?? false;
  const classifierDone =
    health.data?.services.find((service) => service.name === 'claude sidecar')?.state === 'ok';
  const ntfyDone =
    health.data?.services.find((service) => service.name === 'ntfy')?.state === 'ok';

  const steps = [
    { title: t('onboarding.gmailConnected'), done: gmailDone },
    { title: t('onboarding.classifierAuthenticated'), done: classifierDone },
    { title: t('onboarding.ntfyVerified'), done: ntfyDone },
    { title: t('onboarding.shadowRunning'), done: false },
  ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <div className="flex h-full items-start justify-center overflow-y-auto px-6 py-12">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <SectionLabel accent>
            {t('onboarding.step', { current: String(Math.min(completed + 1, 4)), total: '4' })}
          </SectionLabel>
          <h1 className="font-sans text-[27px] font-medium text-ink-bright">
            {gmailDone ? t('onboarding.shadowTitle') : t('onboarding.connectTitle')}
          </h1>
          <p className="max-w-[60ch] font-sans text-[15px] leading-relaxed text-ink-dim">
            {gmailDone ? t('onboarding.shadowBody') : t('onboarding.connectBody')}
          </p>
        </div>

        {!gmailDone && <GoogleAccountPanel justConnected={false} />}

        <div className="flex flex-col">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex items-start gap-4.5 border-t border-line-dim py-3.5"
            >
              <span
                className={cn('w-4 flex-none pt-0.5', step.done ? 'text-healthy' : 'text-amber')}
              >
                {step.done ? <Check size={13} aria-hidden /> : <ArrowRight size={13} aria-hidden />}
              </span>
              <span
                className={cn(
                  'flex-1 text-[13.5px]',
                  step.done ? 'text-ink-dim' : 'text-ink-strong',
                )}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {gmailDone && (
          <div className="flex flex-wrap items-center gap-5 border border-amber-line bg-amber-wash px-5 py-5">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-semibold text-amber">
                {completed}/{steps.length}
              </span>
              <span className="label-caps text-ink-dimmer">{t('onboarding.shadowRemaining')}</span>
            </div>
            <p className="flex-1 font-sans text-[13px] leading-relaxed text-ink-muted">
              {t('onboarding.shadowBody')}
            </p>
            {/* Going live is a ConfigMap change (HERMES_SHADOW_MODE), not a button — flipping the
                one switch that lets the service interrupt you should be a reviewed commit. */}
            <Button variant="primary" disabled title="HERMES_SHADOW_MODE in the ConfigMap">
              {t('onboarding.goLive')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
