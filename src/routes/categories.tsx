import { createFileRoute } from '@tanstack/react-router';
import { CategoriesScreen } from '@/components/categories/CategoriesScreen';

export const Route = createFileRoute('/categories')({ component: CategoriesScreen });
