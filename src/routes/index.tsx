import { createFileRoute } from '@tanstack/react-router';
import { InboxScreen } from '@/components/inbox/InboxScreen';

export const Route = createFileRoute('/')({ component: InboxScreen });
