import { Outlet, createRootRoute } from '@tanstack/react-router';
import { NavRail } from '@/components/layout/NavRail';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { CommandPalette } from '@/components/search/CommandPalette';

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  return (
    <>
      <div className="flex h-full bg-void">
        <NavRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
          <MobileTabBar />
        </div>
      </div>
      {/* Outside the <main>, because it belongs to the application rather than to any one route. */}
      <CommandPalette />
    </>
  );
}
