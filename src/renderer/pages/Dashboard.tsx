import { useEffect, useState } from 'react';
import type { DashboardData } from '../../shared/types';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);
  if (!data) return <div>Carregando...</div>;
  return (
    <section>
      <PageHeader title="Dashboard" description="Indicadores operacionais e conflitos ativos." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Ativos" value={data.totalActiveEmployees} />
        <StatCard label="Ferias hoje" value={data.vacationsToday} />
        <StatCard label="Afastados hoje" value={data.leavesToday} />
        <StatCard label="Folgas no mes" value={data.daysOffThisMonth} />
        <StatCard label="Ferias no mes" value={data.vacationsThisMonth} />
        <StatCard label="Alertas" value={data.activeAlerts} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <List title="Proximas ferias" rows={data.upcomingVacations} columns={['employee_name', 'start_date', 'end_date']} />
        <List title="Proximas folgas" rows={data.upcomingDaysOff} columns={['employee_name', 'date', 'reason']} />
        <List title="Afastamentos em andamento" rows={data.ongoingLeaves} columns={['employee_name', 'type', 'end_date']} />
        <List title="Conflitos por equipe" rows={data.teamConflicts} columns={['message', 'start_date', 'end_date']} />
        <List title="Conflitos por squad" rows={data.squadConflicts} columns={['message', 'start_date', 'end_date']} />
      </div>
    </section>
  );
}

function List({ title, rows, columns }: { title: string; rows: Record<string, unknown>[]; columns: string[] }) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      <div className="space-y-2">
        {rows.length ? rows.map((row, index) => (
          <div key={String(row.id ?? index)} className="border-b border-slate-100 pb-2 text-sm last:border-0">
            {columns.map((column) => <span key={column} className="mr-3 text-slate-700">{String(row[column] ?? '')}</span>)}
          </div>
        )) : <div className="text-sm text-slate-500">Sem registros.</div>}
      </div>
    </div>
  );
}
