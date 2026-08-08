import { createFileRoute } from '@tanstack/react-router';
import { RulesScreen } from '@/components/rules/RulesScreen';

export const Route = createFileRoute('/rules')({ component: RulesScreen });
