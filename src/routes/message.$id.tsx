import { createFileRoute } from '@tanstack/react-router';
import { MessageScreen } from '@/components/inbox/MessageScreen';

/** The single-message route the inbox drills into when there is no reader pane on screen. */
export const Route = createFileRoute('/message/$id')({ component: MessageScreen });
