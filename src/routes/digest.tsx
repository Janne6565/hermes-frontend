import { createFileRoute } from '@tanstack/react-router';
import { DigestScreen } from '@/components/digest/DigestScreen';

export const Route = createFileRoute('/digest')({ component: DigestScreen });
