import { useDismissMessage, useMessage, useSendFeedback } from '@/api/queries';

/** The single-message route's state — the same actions the reader pane has, for one known id. */
export function useMessageLogic(id: string) {
  const message = useMessage(id);
  const dismiss = useDismissMessage();
  const feedback = useSendFeedback();

  const act =
    <T>(action: (data: NonNullable<typeof message.data>) => T) =>
    () => {
      if (message.data) action(message.data);
    };

  return {
    isLoading: message.isLoading,
    isError: message.isError,
    refetch: message.refetch,
    data: message.data,
    busy: dismiss.isPending || feedback.isPending,
    toggleDismissed: act((data) => dismiss.mutate({ id: data.id, dismissed: !data.dismissed })),
    neverNotifySender: act((data) =>
      feedback.mutate({ messageId: data.id, shouldHaveBeen: 'noise', applyToDomain: false }),
    ),
    markNormal: act((data) =>
      feedback.mutate({ messageId: data.id, shouldHaveBeen: 'normal', applyToDomain: false }),
    ),
  };
}
