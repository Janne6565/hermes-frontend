import { createFileRoute } from '@tanstack/react-router';
import { HealthScreen } from '@/components/health/HealthScreen';

export const Route = createFileRoute('/health')({ component: HealthScreen });
