import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div
          key={location.pathname}
          className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-5xl p-8 duration-300"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
