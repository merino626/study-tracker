import { HashRouter, Route, Routes } from 'react-router-dom';
import { CompactModeSync } from '@/components/layout/CompactModeSync';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ThemeSync } from '@/components/layout/ThemeSync';
import { CompactLayout } from '@/layouts/CompactLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { CourseDetailPage } from '@/pages/CourseDetailPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { useCompactModeStore } from '@/stores/compact-mode-store';

function AppRoutes() {
  const isCompact = useCompactModeStore((state) => state.isCompact);

  if (isCompact) {
    return <CompactLayout />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId" element={<CourseDetailPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ThemeSync />
      <CompactModeSync />
      <AppRoutes />
    </ThemeProvider>
  );
}
