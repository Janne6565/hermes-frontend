import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRule,
  deleteRule,
  disconnectGoogle,
  dismissMessage,
  fetchDigest,
  fetchGoogleAccount,
  fetchHealth,
  fetchOpenHighPriority,
  fetchRules,
  fetchTodayDigest,
  fetchUnresolvedAlerts,
  searchMessages,
  sendFeedback,
  setRuleEnabled,
  startGoogleConnect,
  type MessageSearchParams,
} from './hermes';
import type { CreateRuleRequest, FeedbackRequest } from './types';

/** Query keys in one place so invalidation can't drift from the reads. */
export const queryKeys = {
  digestToday: ['digest', 'today'] as const,
  digest: (date: string) => ['digest', date] as const,
  openHigh: ['messages', 'high', 'open'] as const,
  messages: (params: MessageSearchParams) => ['messages', params] as const,
  rules: ['rules'] as const,
  alerts: ['alerts'] as const,
  health: ['health'] as const,
  googleAccount: ['auth', 'google'] as const,
};

/** The inbox and widget stay live without a manual refresh; the poll loop is 180s anyway. */
const LIVE_REFETCH_MS = 60_000;

export function useTodayDigest() {
  return useQuery({
    queryKey: queryKeys.digestToday,
    queryFn: fetchTodayDigest,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useDigest(date: string) {
  return useQuery({ queryKey: queryKeys.digest(date), queryFn: () => fetchDigest(date) });
}

export function useOpenHighPriority() {
  return useQuery({
    queryKey: queryKeys.openHigh,
    queryFn: () => fetchOpenHighPriority(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useMessageSearch(params: MessageSearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages(params),
    queryFn: () => searchMessages(params),
    enabled,
  });
}

export function useRules() {
  return useQuery({ queryKey: queryKeys.rules, queryFn: fetchRules });
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: fetchUnresolvedAlerts,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useGoogleAccount() {
  return useQuery({ queryKey: queryKeys.googleAccount, queryFn: fetchGoogleAccount });
}

export function useDismissMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dismissed }: { id: string; dismissed: boolean }) =>
      dismissMessage(id, dismissed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.openHigh });
      void queryClient.invalidateQueries({ queryKey: queryKeys.digestToday });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRuleRequest) => createRule(request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.rules }),
  });
}

export function useSetRuleEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setRuleEnabled(id, enabled),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.rules }),
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRule(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.rules }),
  });
}

export function useSendFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: FeedbackRequest) => sendFeedback(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.openHigh });
      void queryClient.invalidateQueries({ queryKey: queryKeys.digestToday });
    },
  });
}

/**
 * Starts the Google consent flow.
 *
 * A full-page navigation rather than a popup: Google blocks its consent screen in many embedded
 * and popup contexts, and the backend redirects straight back into the app afterwards.
 */
export function useConnectGoogle() {
  return useMutation({
    mutationFn: startGoogleConnect,
    onSuccess: (url) => {
      globalThis.location.href = url;
    },
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.googleAccount });
      void queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
}
