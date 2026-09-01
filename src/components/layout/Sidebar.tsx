import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Cursos', icon: GraduationCap },
  { to: '/history', label: 'Histórico', icon: History },
  { to: '/statistics', label: 'Estatísticas', icon: BarChart3 },
  { to: '/settings', label: 'Configurações', icon: Settings },
] as const;

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-60 flex-col border-r">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <BookOpen className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Study Tracker</p>
          <p className="text-muted-foreground text-xs">Foco nos estudos</p>
        </div>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
