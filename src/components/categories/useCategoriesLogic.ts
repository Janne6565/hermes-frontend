import { useMemo, useState } from 'react';
import {
  useAssignCategory,
  useBackfillCategories,
  useCategoryOverview,
  useCreateCategory,
  useDeleteCategory,
} from '@/api/queries';

/**
 * The palette offered for a new category.
 *
 * Deliberately hand-picked rather than a colour wheel: every swatch has to survive on a near-black
 * surface at 7 px, and none of them may land in the red the product reserves for "broken". A free
 * picker would let the user paint a category the same colour as a failure.
 */
export const CATEGORY_COLORS = [
  '#c98b74',
  '#c9a227',
  '#b8934a',
  '#7ba05b',
  '#6b8fa8',
  '#8a857b',
  '#5a5a72',
  '#9a7fa8',
] as const;

export function useCategoriesLogic() {
  const overview = useCategoryOverview();
  const create = useCreateCategory();
  const remove = useDeleteCategory();
  const assign = useAssignCategory();
  const backfill = useBackfillCategories();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[4]);

  const categories = useMemo(() => overview.data?.categories ?? [], [overview.data]);
  const mix = overview.data?.mix;
  const total =
    mix === undefined
      ? 0
      : mix.byRule + mix.byModel + mix.lowConfidence + mix.byUser + mix.unresolved;

  const canSubmit = name.trim().length > 0 && !categories.some((c) => c.name === name.trim());

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('');
          setCreating(false);
        },
      },
    );
  };

  return {
    isLoading: overview.isLoading,
    isError: overview.isError,
    refetch: overview.refetch,
    windowDays: overview.data?.windowDays ?? 7,
    categories,
    mix,
    // Shares are computed against the window, so the mix denominators come from the same read —
    // a percentage over a total fetched separately could exceed 100 mid-poll.
    total,
    unsure: overview.data?.unsure ?? [],
    corrections: overview.data?.recentCorrections ?? [],
    form: { open: creating, setOpen: setCreating, name, setName, color, setColor },
    canSubmit,
    submit,
    submitting: create.isPending,
    // 409 is the duplicate-name case; the button is already disabled for names we can see, so this
    // only fires when another tab created the same one.
    duplicate:
      (create.error as { response?: { status?: number } } | null)?.response?.status === 409,
    deletingId: remove.isPending ? remove.variables : undefined,
    remove: (id: string) => remove.mutate(id),
    assigningId: assign.isPending ? assign.variables?.messageId : undefined,
    assignTo: (messageId: string, categoryId: string) => assign.mutate({ messageId, categoryId }),
    // Offered only when there is something to fix. A button that always says "backfill" invites a
    // pointless run that still costs a round trip and reads as a no-op.
    uncategorised: categories.find((category) => category.fallback)?.count ?? 0,
    backfill: () => backfill.mutate(undefined),
    backfilling: backfill.isPending,
    backfillResult: backfill.data,
    backfillFailed: backfill.isError,
  };
}
