import { createFileRoute } from '@tanstack/react-router';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

/** The OAuth callback redirects back here with ?connected=1 or ?error=… */
interface SettingsSearch {
  readonly connected?: string;
  readonly error?: string;
}

export const Route = createFileRoute('/settings')({
  component: SettingsScreen,
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    connected: typeof search.connected === 'string' ? search.connected : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
});
