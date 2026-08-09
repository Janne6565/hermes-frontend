import { useDeferredValue, useMemo, useState } from 'react';
import {
  useCreateRule,
  useDeleteRule,
  useRecentFeedback,
  useRuleDryRun,
  useRules,
  useSetRuleEnabled,
} from '@/api/queries';
import type { Priority, RuleType } from '@/api/types';

export function useRulesLogic() {
  const rules = useRules();
  const create = useCreateRule();
  const setEnabled = useSetRuleEnabled();
  const remove = useDeleteRule();

  const [filter, setFilter] = useState<RuleType | 'all'>('all');
  const [type, setType] = useState<RuleType>('sender');
  const [pattern, setPattern] = useState('');
  const [priority, setPriority] = useState<Priority>('noise');

  // Deferred so the dry run follows the pattern without firing on every keystroke; the query
  // itself is also cached per (type, pattern), so backtracking a character is free.
  const deferredPattern = useDeferredValue(pattern);
  const dryRun = useRuleDryRun(type, deferredPattern.trim());
  const feedback = useRecentFeedback();

  const all = useMemo(() => rules.data ?? [], [rules.data]);
  const visible = useMemo(
    () => (filter === 'all' ? all : all.filter((rule) => rule.type === filter)),
    [all, filter],
  );

  const countsByType = useMemo(
    () => ({
      all: all.length,
      sender: all.filter((rule) => rule.type === 'sender').length,
      domain: all.filter((rule) => rule.type === 'domain').length,
      header: all.filter((rule) => rule.type === 'header').length,
    }),
    [all],
  );

  // Completeness, not format: an empty pattern is the only thing that makes the button useless.
  const canSubmit = pattern.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate({ type, pattern: pattern.trim(), priority }, { onSuccess: () => setPattern('') });
  };

  return {
    isLoading: rules.isLoading,
    isError: rules.isError,
    refetch: rules.refetch,
    rules: visible,
    activeCount: all.filter((rule) => rule.enabled).length,
    countsByType,
    filter,
    setFilter,
    form: { type, setType, pattern, setPattern, priority, setPriority },
    canSubmit,
    submit,
    creating: create.isPending,
    dryRun: dryRun.data,
    dryRunPending: dryRun.isFetching,
    recentFeedback: feedback.data ?? [],
    // 409 is the duplicate-pattern case; anything else is a generic failure.
    duplicate:
      (create.error as { response?: { status?: number } } | null)?.response?.status === 409,
    togglingId: setEnabled.isPending ? setEnabled.variables?.id : undefined,
    toggle: (id: string, enabled: boolean) => setEnabled.mutate({ id, enabled }),
    deletingId: remove.isPending ? remove.variables : undefined,
    remove: (id: string) => remove.mutate(id),
  };
}
