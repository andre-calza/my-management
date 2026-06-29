import { useEffect, useState } from 'react';
import type { ReportKind } from '../../shared/types';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';

const reports: { kind: ReportKind; label: string }[] = [
  { kind: 'absencesByEmployee', label: 'Ausencias por colaborador' },
  { kind: 'absencesByTeam', label: 'Ausencias por equipe' },
  { kind: 'absencesBySquad', label: 'Ausencias por squad' },
  { kind: 'plannedVacationsByMonth', label: 'Ferias planejadas por mes' },
  { kind: 'leavesByPeriod', label: 'Afastamentos por periodo' },
  { kind: 'employeesBySquad', label: 'Colaboradores por squad' }
];

export function ReportsPage() {
  const [kind, setKind] = useState<ReportKind>('absencesByEmployee');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  async function load() {
    setRows(await api.getReport(kind, {}));
  }

  useEffect(() => {
    load();
  }, [kind]);

  const headers = Object.keys(rows[0] || {});

  return (
    <section>
      <PageHeader title="Relatorios" description="Consultas simples com exportacao CSV." />
      <div className="mb-4 flex gap-3 border border-slate-200 bg-white p-4 shadow-sm">
        <select value={kind} onChange={(event) => setKind(event.target.value as ReportKind)}>
          {reports.map((report) => <option key={report.kind} value={report.kind}>{report.label}</option>)}
        </select>
        <button onClick={() => api.exportReportCsv(kind, {})} className="shrink-0 bg-brand px-4 py-2 text-sm font-semibold text-white">Exportar CSV</button>
      </div>
      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{headers.map((header) => <th key={header} className="table-cell text-left font-semibold">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50">
                {headers.map((header) => <td key={header} className="table-cell">{String(row[header] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
