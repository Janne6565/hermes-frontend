import { useMemo, useState } from 'react';
import {
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
  useTestAutomation,
  useUpdateAutomation,
} from '@/api/queries';
import type { Automation, AutomationAlert } from '@/api/types';

const WEBHOOK_PATTERN = /^https?:\/\/\S+$/;

/** The HTTP status of a failed mutation, if the server answered at all. */
function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status;
}

export function useAutomationsLogic() {
  const automations = useAutomations();
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  // Its own instance, so a row toggle's pending state and errors never land on the edit form.
  const toggle = useUpdateAutomation();
  const remove = useDeleteAutomation();
  const test = useTestAutomation();

  // One form for both new and edit: `editingId` decides which mutation the submit button runs.
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [alert, setAlert] = useState<AutomationAlert>('direct');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showFormatError, setShowFormatError] = useState(false);

  const all = useMemo(() => automations.data?.automations ?? [], [automations.data]);
  const limit = automations.data?.limit ?? 25;
  const enabledCount = all.filter((automation) => automation.enabled).length;

  const webhook = webhookUrl.trim();
  const webhookValid = webhook === '' || WEBHOOK_PATTERN.test(webhook);
  const hasAction = alert !== 'none' || webhook !== '';

  // Completeness gates the button; format errors surface on submit, never as a dead button.
  const canSubmit = name.trim().length > 0 && trigger.trim().length > 0 && hasAction;

  const reset = () => {
    setEditingId(undefined);
    setName('');
    setTrigger('');
    setAlert('direct');
    setWebhookUrl('');
    setShowFormatError(false);
    create.reset();
    update.reset();
  };

  const edit = (automation: Automation) => {
    create.reset();
    update.reset();
    setShowFormatError(false);
    setEditingId(automation.id);
    setName(automation.name);
    setTrigger(automation.trigger);
    setAlert(automation.alert);
    setWebhookUrl(automation.webhookUrl ?? '');
  };

  const submit = () => {
    if (!canSubmit) return;
    if (!webhookValid) {
      setShowFormatError(true);
      return;
    }
    setShowFormatError(false);
    const request = { name: name.trim(), trigger: trigger.trim(), alert, webhookUrl: webhook };
    if (editingId) {
      update.mutate({ id: editingId, ...request }, { onSuccess: reset });
    } else {
      create.mutate(request, { onSuccess: reset });
    }
  };

  const failure = editingId ? update.error : create.error;
  const failureStatus = statusOf(failure);

  return {
    isLoading: automations.isLoading,
    isError: automations.isError,
    refetch: automations.refetch,
    automations: all,
    runs: automations.data?.recentRuns ?? [],
    limit,
    enabledCount,
    atLimit: enabledCount >= limit,
    form: {
      editingId,
      name,
      setName,
      trigger,
      setTrigger,
      alert,
      setAlert,
      webhookUrl,
      setWebhookUrl,
    },
    canSubmit,
    submit,
    cancelEdit: reset,
    edit,
    saving: create.isPending || update.isPending,
    webhookInvalid: showFormatError && !webhookValid,
    // 409 is a taken name or the enabled limit; the server's detail says which.
    conflict: failureStatus === 409,
    failed: failure != null && failureStatus !== 409,
    togglingId: toggle.isPending ? toggle.variables?.id : undefined,
    toggle: (automation: Automation) =>
      toggle.mutate({ id: automation.id, enabled: !automation.enabled }),
    // The only toggle that can fail on purpose: re-enabling past the limit.
    toggleFailed: statusOf(toggle.error) === 409,
    deletingId: remove.isPending ? remove.variables : undefined,
    remove: (id: string) => {
      if (id === editingId) reset();
      remove.mutate(id);
    },
    testingId: test.isPending ? test.variables : undefined,
    runTest: (id: string) => test.mutate(id),
    lastTest: test.data,
  };
}
