import { useEffect, useMemo, useState } from 'react';
import type { AbsenceEvent } from '../../shared/types';
import { ABSENCE_TYPES } from '../../shared/constants';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';

const color = {
  Ferias: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Folga: 'bg-sky-100 text-sky-900 border-sky-300',
  Afastamento: 'bg-rose-100 text-rose-900 border-rose-300'
};

export function CalendarPage() {
  const today = new Date();
  const [filters, setFilters] = useState({ month: today.getMonth() + 1, year: today.getFullYear(), employee_id: '', team_id: '', squad_id: '', type: '' });
  const [events, setEvents] = useState<AbsenceEvent[]>([]);
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [squads, setSquads] = useState<Record<string, unknown>[]>([]);

  async function load() {
    const [calendarRows, employeeRows, teamRows, squadRows] = await Promise.all([api.getCalendar(filters), api.list('employees'), api.list('teams'), api.list('squads')]);
    setEvents(calendarRows);
    setEmployees(employeeRows);
    setTeams(teamRows);
    setSquads(squadRows);
  }

  useEffect(() => {
    load();
  }, [filters.month, filters.year, filters.employee_id, filters.team_id, filters.squad_id, filters.type]);

  const days = useMemo(() => new Date(Number(filters.year), Number(filters.month), 0).getDate(), [filters.month, filters.year]);
  const dayItems = (day: number) => {
    const date = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((event) => event.start_date <= date && event.end_date >= date);
  };

  return (
    <section>
      <PageHeader title="Calendario" description="Visao mensal de ferias, folgas e afastamentos." />
      <div className="mb-4 grid grid-cols-2 gap-3 border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <input type="number" min="1" max="12" value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })} />
        <input type="number" value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })} />
        <Select value={filters.employee_id} rows={employees} labelKey="full_name" onChange={(value) => setFilters({ ...filters, employee_id: value })} placeholder="Colaborador" />
        <Select value={filters.team_id} rows={teams} labelKey="name" onChange={(value) => setFilters({ ...filters, team_id: value })} placeholder="Equipe" />
        <Select value={filters.squad_id} rows={squads} labelKey="name" onChange={(value) => setFilters({ ...filters, squad_id: value })} placeholder="Squad" />
        <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">Tipo</option>
          {ABSENCE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-7 overflow-hidden border border-slate-200 bg-white shadow-sm">
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => (
          <div key={day} className="min-h-32 border-b border-r border-slate-200 p-2">
            <div className="mb-2 text-xs font-bold text-slate-500">{day}</div>
            <div className="space-y-1">
              {dayItems(day).map((event) => (
                <div key={`${event.type}-${event.id}`} className={`border px-2 py-1 text-xs ${color[event.type]}`}>
                  <div className="font-semibold">{event.employee_name}</div>
                  <div>{event.team_name || 'Sem equipe'} {event.squad_names ? `- ${event.squad_names}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Select({ value, rows, labelKey, placeholder, onChange }: { value: string; rows: Record<string, unknown>[]; labelKey: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row[labelKey])}</option>)}
    </select>
  );
}
