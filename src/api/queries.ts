import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acknowledgeAlert,
  assignCategory,
  backfillCategories,
  createAutomation,
  createCategory,
  createRule,
  deleteAutomation,
  fetchAutomations,
  testAutomation,
  updateAutomation,
  deleteCategory,
  deleteCategoryRule,
  fetchCategoryOverview,
  renameCategory,
  dryRunRule,
  fetchDigestRange,
  fetchDigestStats,
  fetchRecentFeedback,
  deleteRule,
  fetchAlertOverview,
  snoozeAlert,
  fetchConfig,
  sendDigestNow,
  sendTestPush,
  disconnectGoogle,
  dismissMessage,
  fetchDigest,
  fetchGoogleAccount,
  fetchHealth,
  fetchMessage,
  fetchOpenHighPriority,
  fetchRules,
  fetchTodayDigest,
  fetchUnresolvedAlerts,
  searchMessages,
  sendFeedback,
  setRuleEnabled,
  startGoogleConnect,
  syncMessages,
  type MessageSearchParams,
} from './hermes';
import type {
  AssignCategoryRequest,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateRuleRequest,
  FeedbackRequest,
  RuleType,
} from './types';

/** Query keys in one place so invalidation can't drift from the reads. */
export const queryKeys = {
  digestToday: ['digest', 'today'] as const,
  digest: (date: string) => ['digest', date] as const,
  digestStats: (days: number) => ['digest', 'stats', days] as const,
  digestRange: (from: string, to: string) => ['digest', 'range', from, to] as const,
  recentFeedback: ['rules', 'feedback'] as const,
  ruleDryRun: (type: string, pattern: string) => ['rules', 'dry-run', type, pattern] as const,
  openHigh: ['messages', 'high', 'open'] as const,
  message: (id: string) => ['messages', id] as const,
  messages: (params: MessageSearchParams) => ['messages', params] as const,
  rules: ['rules'] as const,
  categories: (days: number | undefined) => ['categories', days ?? 'default'] as const,
  automations: ['automations'] as const,
  alerts: ['alerts'] as const,
  alertOverview: (days: number) => ['alerts', 'overview', days] as const,
  health: ['health'] as const,
  config: ['config'] as const,
  googleAccount: ['auth', 'google'] as const,
};

/**
 * The inbox and widget stay live without a manual refresh, in step with the backend's poll loop.
 *
 * Matched to `hermes.gmail.poll-interval` rather than set independently: whichever of the two is
 * slower decides how long a mail sits unseen, so a UI interval above the poll interval would spend
 * the backend's latency gain and give nothing back.
 */
const LIVE_REFETCH_MS = 30_000;

/** While the backfill runs the overview doubles as its progress readout. */
const BACKFILL_REFETCH_MS = 3_000;

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

/**
 * The ad-hoc range report.
 *
 * Disabled until a span is actually submitted: the request costs an LLM call, so it must never be
 * fired by someone half-way through picking dates. Cached under the span, so flipping back to a
 * range you already built is instant and does not narrate it a second time.
 */
export function useDigestRange(range: { readonly from: string; readonly to: string } | undefined) {
  return useQuery({
    queryKey: queryKeys.digestRange(range?.from ?? '', range?.to ?? ''),
    queryFn: () => fetchDigestRange(range?.from ?? '', range?.to ?? ''),
    enabled: Boolean(range),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

export function useDigestStats(days = 7) {
  return useQuery({
    queryKey: queryKeys.digestStats(days),
    queryFn: () => fetchDigestStats(days),
  });
}

export function useRecentFeedback(limit = 5) {
  return useQuery({
    queryKey: queryKeys.recentFeedback,
    queryFn: () => fetchRecentFeedback(limit),
  });
}

/**
 * The retrospective effect of a candidate rule.
 *
 * Only runs once there is a pattern to evaluate, and is kept fresh briefly so typing a pattern
 * character by character does not re-query the whole sample on every keystroke.
 */
export function useRuleDryRun(type: RuleType, pattern: string) {
  return useQuery({
    queryKey: queryKeys.ruleDryRun(type, pattern),
    queryFn: () => dryRunRule(type, pattern),
    enabled: pattern.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useOpenHighPriority() {
  return useQuery({
    queryKey: queryKeys.openHigh,
    queryFn: () => fetchOpenHighPriority(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useMessage(id: string) {
  return useQuery({ queryKey: queryKeys.message(id), queryFn: () => fetchMessage(id) });
}

export function useMessageSearch(params: MessageSearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages(params),
    queryFn: () => searchMessages(params),
    enabled,
  });
}

/**
 * The categories screen in one read.
 *
 * Live like the inbox: the unsure queue fills as mail arrives, and a screen the user leaves open to
 * work through it would otherwise go stale exactly while they are using it.
 */
export function useCategoryOverview(days?: number) {
  return useQuery({
    queryKey: queryKeys.categories(days),
    queryFn: () => fetchCategoryOverview(days),
    // Faster while a backfill is in flight: this read *is* the progress bar, and 30 seconds
    // between updates on a run that visibly moves reads as a hang.
    refetchInterval: (query) =>
      query.state.data?.backfill.running ? BACKFILL_REFETCH_MS : LIVE_REFETCH_MS,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCategoryRequest) => createCategory(request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

/**
 * Renames or recolours a category.
 *
 * Invalidates the message lists as well: the category name is denormalised onto every message chip
 * in the inbox, digest and search, so those would keep showing the old label until their next poll.
 */
export function useRenameCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...request }: UpdateCategoryRequest & { id: string }) =>
      renameCategory(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Removes one pattern from a category.
 *
 * Only the categories query is invalidated: mail already filed by the rule keeps its category, so
 * no message chip anywhere changes.
 */
export function useDeleteCategoryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteCategoryRule(ruleId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Its messages went back to the fallback, so every list that renders a category chip is
      // now showing a name that no longer exists.
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Kicks off the backfill of mail that predates categories.
 *
 * Returns as soon as the run has *started*, not when it finishes — the work is one classifier turn
 * per message and used to hold the request open for minutes. Progress arrives through the overview
 * poll instead.
 *
 * No retry: each message in a run costs credit, so an automatic retry would quietly spend twice.
 */
export function useBackfillCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (limit?: number) => backfillCategories(limit),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

/**
 * Answers one item in the "needs a call" queue.
 *
 * Invalidates the message lists as well as the overview because the correction rewrites the chip
 * shown next to that mail in the inbox, digest and search.
 */
export function useAssignCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AssignCategoryRequest) => assignCategory(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.digestToday });
    },
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

export function useAlertOverview(days = 1) {
  return useQuery({
    queryKey: queryKeys.alertOverview(days),
    queryFn: () => fetchAlertOverview(days),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useSnoozeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours?: number }) => snoozeAlert(id, hours),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

/**
 * The server's effective configuration.
 *
 * No refetch interval: this only changes when the ConfigMap does, which means a pod restart, which
 * means a fresh page anyway.
 */
export function useConfig() {
  return useQuery({ queryKey: queryKeys.config, queryFn: fetchConfig, staleTime: Infinity });
}

/** Not a query — sending a test push is an action with a side effect on the user's phone. */
export function useSendTestPush() {
  return useMutation({ mutationFn: sendTestPush });
}

/**
 * Sends today's digest on demand.
 *
 * Writes the returned digest straight into the today cache instead of only invalidating it: the
 * response *is* the freshly sent digest, and a refetch would show the same day without the
 * narrative for as long as the round trip takes.
 */
export function useSendDigestNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendDigestNow,
    onSuccess: (digest) => {
      queryClient.setQueryData(queryKeys.digestToday, digest);
      void queryClient.invalidateQueries({ queryKey: ['digest', 'stats'] });
    },
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
    // The `messages` prefix covers the open-high list, the search results and the single-message
    // route at once — a dismissal changes all three and they must not disagree.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.digestToday });
    },
  });
}

/**
 * Polls the mailbox on demand.
 *
 * A mutation rather than a query: it makes the backend go and talk to Gmail, which is an action
 * with a cost, not a read that may be repeated freely. The invalidations mirror those of a
 * dismissal — a sync can add to any message list and to today's digest at once.
 */
export function useSyncMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncMessages,
    onSuccess: (result) => {
      // A run that never started has nothing to show; refetching would only make the list flicker
      // for no new data.
      if (result.alreadyRunning) return;
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.digestToday });
      void queryClient.invalidateQueries({ queryKey: queryKeys.health });
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
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
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

export function useAutomations() {
  return useQuery({ queryKey: queryKeys.automations, queryFn: fetchAutomations });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAutomationRequest) => createAutomation(request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...request }: UpdateAutomationRequest & { id: string }) =>
      updateAutomation(id, request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAutomation(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}

/** The run it returns also lands in the runs list, so the list is refreshed rather than patched. */
export function useTestAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testAutomation(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
  });
}
