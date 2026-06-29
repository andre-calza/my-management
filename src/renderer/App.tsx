import { useState } from 'react';
import { Sidebar, type PageKey } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { EmployeesPage, SquadsPage, TeamsPage } from './pages/CrudPages';
import { AllocationsPage } from './pages/AllocationsPage';
import { AbsencePage } from './pages/AbsencePages';
import { CalendarPage } from './pages/CalendarPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [page, setPage] = useState<PageKey>('dashboard');
  return (
    <div className="flex min-h-screen">
      <Sidebar current={page} onChange={setPage} />
      <main className="h-screen flex-1 overflow-y-auto bg-panel p-6">
        {page === 'dashboard' && <Dashboard />}
        {page === 'employees' && <EmployeesPage />}
        {page === 'teams' && <TeamsPage />}
        {page === 'squads' && <SquadsPage />}
        {page === 'allocations' && <AllocationsPage />}
        {page === 'vacations' && <AbsencePage table="vacations" />}
        {page === 'daysOff' && <AbsencePage table="days_off" />}
        {page === 'leaves' && <AbsencePage table="leaves" />}
        {page === 'calendar' && <CalendarPage />}
        {page === 'alerts' && <AlertsPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
