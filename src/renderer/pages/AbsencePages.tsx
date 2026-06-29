import { useEffect, useState } from 'react';
import { Edit2, FileUp, Trash2 } from 'lucide-react';
import { DAY_OFF_STATUSES, LEAVE_TYPES, VACATION_STATUSES } from '../../shared/constants';
import { api } from '../api/client';
import { FormShell } from '../components/FormShell';
import { PageHeader } from '../components/PageHeader';

type AbsenceKind = 'vacations' | 'days_off' | 'leaves';
type Field = {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'attachment';
  options?: { value: string | number; label: string }[];
  wide?: boolean;
};

const config = {
  vacations: {
    title: 'Ferias',
    description: 'Cadastro de ferias com alerta de conflito por equipe e squad.',
    kind: 'Ferias',
    fields: [
      { key: 'employee_id', label: 'Colaborador', type: 'select' },
      { key: 'start_date', label: 'Data de inicio', type: 'date' },
      { key: 'end_date', label: 'Data de fim', type: 'date' },
      { key: 'days_count', label: 'Quantidade de dias', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: VACATION_STATUSES.map((item) => ({ value: item, label: item })) },
      { key: 'notes', label: 'Observacoes', type: 'textarea', wide: true }
    ],
    columns: [
      ['employee_name', 'Colaborador'], ['start_date', 'Inicio'], ['end_date', 'Fim'], ['days_count', 'Dias'], ['status', 'Status']
    ]
  },
  days_off: {
    title: 'Folgas',
    description: 'Cadastro de folgas que entram nos alertas de ausencia.',
    kind: 'Folga',
    fields: [
      { key: 'employee_id', label: 'Colaborador', type: 'select' },
      { key: 'date', label: 'Data da folga', type: 'date' },
      { key: 'reason', label: 'Motivo' },
      { key: 'status', label: 'Status', type: 'select', options: DAY_OFF_STATUSES.map((item) => ({ value: item, label: item })) },
      { key: 'notes', label: 'Observacoes', type: 'textarea', wide: true }
    ],
    columns: [
      ['employee_name', 'Colaborador'], ['date', 'Data'], ['reason', 'Motivo'], ['status', 'Status']
    ]
  },
  leaves: {
    title: 'Afastamentos',
    description: 'Registro de atestados, licencas e afastamentos.',
    kind: 'Afastamento',
    fields: [
      { key: 'employee_id', label: 'Colaborador', type: 'select' },
      { key: 'type', label: 'Tipo', type: 'select', options: LEAVE_TYPES.map((item) => ({ value: item, label: item })) },
      { key: 'start_date', label: 'Data de inicio', type: 'date' },
      { key: 'end_date', label: 'Data de fim', type: 'date' },
      { key: 'days_count', label: 'Quantidade de dias', type: 'number' },
      { key: 'document_path', label: 'Documento local', type: 'attachment', wide: true },
      { key: 'notes', label: 'Observacoes', type: 'textarea', wide: true }
    ],
    columns: [
      ['employee_name', 'Colaborador'], ['type', 'Tipo'], ['start_date', 'Inicio'], ['end_date', 'Fim'], ['days_count', 'Dias']
    ]
  }
} satisfies Record<AbsenceKind, { title: string; description: string; kind: string; fields: Field[]; columns: string[][] }>;

export function AbsencePage({ table }: { table: AbsenceKind }) {
  const meta = config[table];
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  async function load() {
    const [employeeRows, absenceRows] = await Promise.all([api.list('employees'), api.list(table)]);
    setEmployees(employeeRows);
    setRows(absenceRows);
  }

  useEffect(() => {
    load();
  }, [table]);

  async function save() {
    const result = await api.checkAbsenceConflict({ ...form, kind: meta.kind });
    setWarnings(result.warnings);
    await api.save(table, normalize(form));
    setForm({});
    await load();
  }

  async function pickAttachment() {
    const result = await api.pickAttachment();
    if (!result.canceled) setForm((current) => ({ ...current, document_path: result.path }));
  }

  return (
    <section>
      <PageHeader title={meta.title} description={meta.description} />
      {warnings.length ? (
        <div className="mb-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
          <div className="mt-1 font-semibold">Registro salvo com risco destacado.</div>
        </div>
      ) : null}
      <FormShell title={form.id ? 'Editar registro' : 'Novo registro'} onSubmit={save} onCancel={() => setForm({})}>
        {meta.fields.map((field) => (
          <div key={field.key} className={field.wide ? 'md:col-span-2 xl:col-span-3' : ''}>
            <label className="label">{field.label}</label>
            {field.type === 'select' ? (
              <select value={String(form[field.key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                <option value="">Selecione</option>
                {(field.key === 'employee_id' ? employees.map((item) => ({ value: Number(item.id), label: String(item.full_name) })) : field.options || []).map((option) => (
                  <option key={String(option.value)} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea value={String(form[field.key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
            ) : field.type === 'attachment' ? (
              <div className="flex gap-2">
                <input readOnly value={String(form[field.key] ?? '')} />
                <button title="Selecionar documento" onClick={pickAttachment} className="border border-slate-300 px-3 text-slate-700 hover:bg-slate-50"><FileUp size={18} /></button>
              </div>
            ) : (
              <input type={field.type || 'text'} value={String(form[field.key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
            )}
          </div>
        ))}
      </FormShell>
      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {meta.columns.map(([key, label]) => <th key={key} className="table-cell text-left font-semibold">{label}</th>)}
              <th className="table-cell w-24 text-left font-semibold">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-slate-50">
                {meta.columns.map(([key]) => <td key={key} className="table-cell">{String(row[key] ?? '')}</td>)}
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button title="Editar" className="p-2 text-slate-600 hover:bg-slate-100" onClick={() => setForm(row)}><Edit2 size={16} /></button>
                    <button title="Excluir" className="p-2 text-red-700 hover:bg-red-50" onClick={async () => { await api.remove(table, Number(row.id)); await load(); }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function normalize(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]));
}
