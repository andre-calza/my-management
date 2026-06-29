import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Users,
  Workflow
} from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'employees'
  | 'teams'
  | 'squads'
  | 'allocations'
  | 'vacations'
  | 'daysOff'
  | 'leaves'
  | 'calendar'
  | 'alerts'
  | 'reports'
  | 'settings';

const items = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['employees', 'Colaboradores', Users],
  ['teams', 'Equipes', BriefcaseBusiness],
  ['squads', 'Squads', Workflow],
  ['allocations', 'Alocacoes', ClipboardList],
  ['vacations', 'Ferias', CalendarDays],
  ['daysOff', 'Folgas', Coffee],
  ['leaves', 'Afastamentos', ShieldAlert],
  ['calendar', 'Calendario', CalendarDays],
  ['alerts', 'Alertas', AlertTriangle],
  ['reports', 'Relatorios', BarChart3],
  ['settings', 'Configuracoes', Settings]
] as const;

type Props = {
  current: PageKey;
  onChange: (page: PageKey) => void;
};

export function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="text-lg font-bold text-ink">Gestao de Equipes</div>
        <div className="text-xs text-slate-500">Operacao local offline</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(([key, label, Icon]) => (
          <button
            key={key}
            title={label}
            onClick={() => onChange(key)}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium ${
              current === key ? 'bg-teal-50 text-brand' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
