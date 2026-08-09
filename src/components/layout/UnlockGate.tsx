import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui';
import { getAdminToken, setAdminToken } from '@/lib/session';

/**
 * Asks for the admin token once and keeps it.
 *
 * Hermes reads someone's mail and can be pointed at a mailbox, so the API is not public. This is
 * the browser side of that: a plain token prompt rather than a login, because there is exactly one
 * user and no account system to hang a session off.
 */
export function UnlockGate({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(() => getAdminToken() !== null);
  const [value, setValue] = useState('');

  if (unlocked) {
    return <>{children}</>;
  }

  const canSubmit = value.trim().length > 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setAdminToken(value);
    setUnlocked(true);
  };

  return (
    <div className="flex h-full items-center justify-center bg-void px-6">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 bg-amber" aria-hidden />
          <span className="text-[13px] font-semibold tracking-wide">{t('app.name')}</span>
        </div>
        <h1 className="font-sans text-2xl text-ink-bright">{t('unlock.title')}</h1>
        <p className="font-sans text-[14px] leading-relaxed text-ink-dim">{t('unlock.body')}</p>
        <label className="flex items-center gap-2 border border-line bg-sunken px-3 py-2.5 focus-within:border-amber-line">
          <KeyRound size={14} className="text-ink-faint" aria-hidden />
          <input
            type="password"
            // A full-screen blocking gate whose only control is this field.
            // biome-ignore lint/a11y/noAutofocus: focusing it is where a reader should already be
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('unlock.placeholder')}
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-ghost"
          />
        </label>
        <Button type="submit" variant="primary" disabled={!canSubmit} className="self-start">
          {t('unlock.submit')}
        </Button>
      </form>
    </div>
  );
}
