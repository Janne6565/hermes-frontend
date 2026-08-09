/**
 * The inbox's filter vocabulary, shared by the route, the rail and the header chips.
 *
 * Kept in its own module so `routes/index.tsx` can validate the search param without importing the
 * screen — the route file is what TanStack's generator reads.
 */
export const INBOX_VIEWS = ['high', 'dismissed', 'normal', 'noise'] as const;

export type InboxView = (typeof INBOX_VIEWS)[number];
