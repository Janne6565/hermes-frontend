import { createFileRoute } from '@tanstack/react-router';
import { InboxScreen } from '@/components/inbox/InboxScreen';
import { INBOX_VIEWS, type InboxView } from '@/components/inbox/views';

/**
 * The rail and the header chips are the same filter, expressed as a URL.
 *
 * One `view` param rather than a priority/dismissed pair: the rail rows are mutually exclusive, so
 * a single value is what the UI actually means and it keeps back/forward honest.
 */
export interface InboxSearch {
  readonly view?: InboxView;
}

export const Route = createFileRoute('/')({
  component: InboxScreen,
  validateSearch: (search: Record<string, unknown>): InboxSearch => ({
    view: INBOX_VIEWS.includes(search.view as InboxView) ? (search.view as InboxView) : undefined,
  }),
});
