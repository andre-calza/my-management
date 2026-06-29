import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { ACTIVE_STATUSES, EMPLOYEE_STATUSES, FUNCTION_TYPES } from '../../shared/constants';
import { api } from '../api/client';
import { FormShell } from '../components/FormShell';
import { PageHeader } from '../components/PageHeader';

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';
  options?: { value: string | number; label: string }[];
  wide?: boolean;
};

type Props = {
  title: string;
  description: string;
  table: string;
  fields: Field[];
  columns: { key: string; label: string }[];
};

const empty = (fields: Field[]) => Object.fromEntries(fields.map((field) => [field.key, '']));

export function CrudPage({ title, description, table, fields, columns }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(empty(fields));

  async function load() {
    setRows(await api.list(table));
  }

  useEffect(() => {
    load();
  }, [table]);

  async function save() {
    await api.save(table, normalize(form));
    setForm(empty(fields));
    await load();
  }

  async function remove(id: number) {
    await api.remove(table, id);
    await load();
  }

  return (
    <section>
      <PageHeader title={title} description={description} />
      <FormShell title={form.id ? 'Editar registro' : 'Novo registro'} onSubmit={save} onCancel={() => setForm(empty(fields))}>
        {fields.map((field) => (
          <div key={field.key} className={field.wide ? 'md:col-span-2 xl:col-span-3' : ''}>
            <label className="label">{field.label}</label>
            <Editor field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />
          </div>
        ))}
      </FormShell>
      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="table-cell text-left font-semibold text-slate-600">
                  {column.label}
                </th>
              ))}
              <th className="table-cell w-24 text-left font-semibold text-slate-600">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="table-cell">
                    {String(row[column.key] ?? '')}
                  </td>
                ))}
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button title="Editar" className="p-2 text-slate-600 hover:bg-slate-100" onClick={() => setForm(row)}>
                      <Edit2 size={16} />
                    </button>
                    <button title="Excluir" className="p-2 text-red-700 hover:bg-red-50" onClick={() => remove(Number(row.id))}>
                      <Trash2 size={16} />
                    </button>
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

function Editor({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: string) => void }) {
  if (field.type === 'textarea') return <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === 'select') {
    return (
      <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {field.options?.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return <input type={field.type || 'text'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />;
}

function normalize(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]));
}

export function EmployeesPage() {
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    api.list('teams').then(setTeams);
  }, []);
  return (
    <CrudPage
      title="Colaboradores"
      description="Cadastro, consulta e manutencao de colaboradores."
      table="employees"
      fields={[
        { key: 'full_name', label: 'Nome completo' },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'role', label: 'Cargo' },
        { key: 'function_type', label: 'Tipo de funcao', type: 'select', options: FUNCTION_TYPES.map((item) => ({ value: item, label: item })) },
        { key: 'status', label: 'Status', type: 'select', options: EMPLOYEE_STATUSES.map((item) => ({ value: item, label: item })) },
        { key: 'admission_date', label: 'Data de admissao', type: 'date' },
        { key: 'team_id', label: 'Equipe principal', type: 'select', options: teams.map((team) => ({ value: Number(team.id), label: String(team.name) })) },
        { key: 'notes', label: 'Observacoes', type: 'textarea', wide: true }
      ]}
      columns={[
        { key: 'full_name', label: 'Nome' },
        { key: 'email', label: 'E-mail' },
        { key: 'role', label: 'Cargo' },
        { key: 'function_type', label: 'Funcao' },
        { key: 'status', label: 'Status' },
        { key: 'team_name', label: 'Equipe' }
      ]}
    />
  );
}

export function TeamsPage() {
  return (
    <CrudPage
      title="Equipes"
      description="Cadastro das equipes principais."
      table="teams"
      fields={[
        { key: 'name', label: 'Nome da equipe' },
        { key: 'responsible', label: 'Responsavel' },
        { key: 'status', label: 'Status', type: 'select', options: ACTIVE_STATUSES.map((item) => ({ value: item, label: item })) },
        { key: 'description', label: 'Descricao', type: 'textarea', wide: true }
      ]}
      columns={[
        { key: 'name', label: 'Equipe' },
        { key: 'responsible', label: 'Responsavel' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Descricao' }
      ]}
    />
  );
}

export function SquadsPage() {
  return (
    <CrudPage
      title="Squads"
      description="Cadastro das squads e produtos relacionados."
      table="squads"
      fields={[
        { key: 'name', label: 'Nome da squad' },
        { key: 'product', label: 'Produto ou sistema' },
        { key: 'responsible', label: 'Responsavel' },
        { key: 'status', label: 'Status', type: 'select', options: ACTIVE_STATUSES.map((item) => ({ value: item, label: item })) }
      ]}
      columns={[
        { key: 'name', label: 'Squad' },
        { key: 'product', label: 'Produto' },
        { key: 'responsible', label: 'Responsavel' },
        { key: 'status', label: 'Status' }
      ]}
    />
  );
}
