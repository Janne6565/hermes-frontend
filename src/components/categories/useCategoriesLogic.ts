import { useMemo, useState } from 'react';
import {
  useAssignCategory,
  useBackfillCategories,
  useCategoryOverview,
  useCreateCategory,
  useDeleteCategory,
  useDeleteCategoryRule,
  useRenameCategory,
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
  const rename = useRenameCategory();
  const removeRule = useDeleteCategoryRule();
  const assign = useAssignCategory();
  const backfill = useBackfillCategories();

  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[4]);

  const categories = useMemo(() => overview.data?.categories ?? [], [overview.data]);
  const status = overview.data?.backfill;
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
    renamingId: rename.isPending ? rename.variables?.id : undefined,
    // 409 means another category already holds the name. Surfaced per row rather than globally,
    // since the row is where the offending input still sits.
    renameConflictId:
      (rename.error as { response?: { status?: number } } | null)?.response?.status === 409
        ? rename.variables?.id
        : undefined,
    renameTo: (id: string, name: string, color?: string) => rename.mutate({ id, name, color }),
    // Resolved from the live list rather than held as a snapshot, so the dialog keeps updating
    // while it is open — the backfill can be filing mail into this very category as you read it.
    detail: categories.find((category) => category.id === detailId) ?? null,
    openDetail: setDetailId,
    closeDetail: () => setDetailId(null),
    deletingRuleId: removeRule.isPending ? removeRule.variables : undefined,
    removeRule: (ruleId: string) => removeRule.mutate(ruleId),
    deletingId: remove.isPending ? remove.variables : undefined,
    remove: (id: string) => remove.mutate(id),
    assigningId: assign.isPending ? assign.variables?.messageId : undefined,
    assignTo: (messageId: string, categoryId: string) => assign.mutate({ messageId, categoryId }),
    // From the server's own count of unresolved rows, not the fallback category's windowed count:
    // the backfill acts on everything, so a button driven by a 7-day slice would hide work that
    // pressing it would still do.
    uncategorised: status?.uncategorised ?? 0,
    backfill: () => backfill.mutate(undefined),
    // `isPending` only covers the few milliseconds of the start call. What the user cares about is
    // whether the *run* is going, which only the server knows.
    backfilling: (status?.running ?? false) || backfill.isPending,
    backfillProgress: status?.target ? { done: status.processed, total: status.target } : undefined,
    backfillOutcome: status?.running ? undefined : status?.lastOutcome,
    backfillFailed: backfill.isError,
  };
}
