import { api } from './axios-instance';
import type {
  AlertEvent,
  AlertOverview,
  ClassifiedBy,
  Config,
  CreateRuleRequest,
  Digest,
  DigestStats,
  FeedbackRequest,
  GoogleAccount,
  Health,
  Message,
  Priority,
  Rule,
  RuleDryRun,
  RuleType,
  SyncResult,
  TestPushResult,
} from './types';

/**
 * The typed API surface, one function per endpoint.
 *
 * Kept hand-written and thin so it mirrors `src/api/generated/` once Orval can reach a running
 * backend — swapping to the generated client is then an import change, not a rewrite.
 */

export async function fetchTodayDigest(): Promise<Digest> {
  const { data } = await api.get<Digest>('/api/v1/digest/today');
  return data;
}

export async function fetchDigest(date: string): Promise<Digest> {
  const { data } = await api.get<Digest>(`/api/v1/digest/${date}`);
  return data;
}

export interface MessageSearchParams {
  readonly priority?: Priority;
  readonly date?: string;
  readonly after?: string;
  readonly before?: string;
  readonly sender?: string;
  readonly classifiedBy?: ClassifiedBy;
  readonly q?: string;
  readonly limit?: number;
}

export async function fetchDigestStats(days = 7): Promise<DigestStats> {
  const { data } = await api.get<DigestStats>('/api/v1/digest/stats', { params: { days } });
  return data;
}

export async function searchMessages(params: MessageSearchParams): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/api/v1/messages', { params });
  return data;
}

export async function fetchMessage(id: string): Promise<Message> {
  const { data } = await api.get<Message>(`/api/v1/messages/${id}`);
  return data;
}

export async function fetchOpenHighPriority(days = 7): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/api/v1/messages/high/open', { params: { days } });
  return data;
}

/**
 * Polls the mailbox now instead of waiting out the 180s tick.
 *
 * Resolves only once the sync is done, so whatever it ingested is already in the index by the time
 * the caller reloads the list.
 */
export async function syncMessages(): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>('/api/v1/messages/sync');
  return data;
}

export async function dismissMessage(id: string, dismissed = true): Promise<Message> {
  const { data } = await api.post<Message>(`/api/v1/messages/${id}/dismiss`, { dismissed });
  return data;
}

export async function fetchRules(): Promise<Rule[]> {
  const { data } = await api.get<Rule[]>('/api/v1/rules');
  return data;
}

export async function createRule(request: CreateRuleRequest): Promise<Rule> {
  const { data } = await api.post<Rule>('/api/v1/rules', request);
  return data;
}

export async function setRuleEnabled(id: string, enabled: boolean): Promise<Rule> {
  const { data } = await api.post<Rule>(`/api/v1/rules/${id}/enabled`, null, {
    params: { enabled },
  });
  return data;
}

export async function deleteRule(id: string): Promise<void> {
  await api.delete(`/api/v1/rules/${id}`);
}

export async function sendFeedback(request: FeedbackRequest): Promise<Rule> {
  const { data } = await api.post<Rule>('/api/v1/rules/feedback', request);
  return data;
}

export async function dryRunRule(
  type: RuleType,
  pattern: string,
  sampleSize = 500,
): Promise<RuleDryRun> {
  const { data } = await api.get<RuleDryRun>('/api/v1/rules/dry-run', {
    params: { type, pattern, sampleSize },
  });
  return data;
}

export async function fetchRecentFeedback(limit = 5): Promise<Rule[]> {
  const { data } = await api.get<Rule[]>('/api/v1/rules/feedback/recent', { params: { limit } });
  return data;
}

export async function fetchUnresolvedAlerts(): Promise<AlertEvent[]> {
  const { data } = await api.get<AlertEvent[]>('/api/v1/events/alerts');
  return data;
}

export async function fetchAlertOverview(days = 1): Promise<AlertOverview> {
  const { data } = await api.get<AlertOverview>('/api/v1/events/alerts/overview', {
    params: { days },
  });
  return data;
}

export async function acknowledgeAlert(id: string): Promise<AlertEvent> {
  const { data } = await api.post<AlertEvent>(`/api/v1/events/alerts/${id}/acknowledge`);
  return data;
}

export async function snoozeAlert(id: string, hours?: number): Promise<AlertEvent> {
  const { data } = await api.post<AlertEvent>(`/api/v1/events/alerts/${id}/snooze`, null, {
    params: hours ? { hours } : undefined,
  });
  return data;
}

export async function fetchHealth(): Promise<Health> {
  const { data } = await api.get<Health>('/api/v1/health');
  return data;
}

export async function fetchConfig(): Promise<Config> {
  const { data } = await api.get<Config>('/api/v1/config');
  return data;
}

export async function sendTestPush(): Promise<TestPushResult> {
  const { data } = await api.post<TestPushResult>('/api/v1/notifications/test');
  return data;
}

export async function fetchGoogleAccount(): Promise<GoogleAccount> {
  const { data } = await api.get<GoogleAccount>('/api/v1/auth/google/status');
  return data;
}

/** @returns the Google consent URL to send the browser to. */
export async function startGoogleConnect(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/api/v1/auth/google/start');
  return data.url;
}

export async function disconnectGoogle(): Promise<void> {
  await api.delete('/api/v1/auth/google');
}
