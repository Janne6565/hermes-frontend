import { createFileRoute } from '@tanstack/react-router';
import { AutomationsScreen } from '@/components/automations/AutomationsScreen';

export const Route = createFileRoute('/automations')({ component: AutomationsScreen });
