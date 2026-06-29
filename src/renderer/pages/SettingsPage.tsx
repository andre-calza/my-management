import { useEffect, useState } from 'react';
import { DatabaseBackup } from 'lucide-react';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  async function load() {
    const rows = await api.getSettings();
    setSettings(Object.fromEntries(rows.map((row: { key: string; value: string }) => [row.key, row.value])));
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await api.saveSettings(settings);
    setMessage('Configuracoes salvas.');
  }

  async function backup() {
    const result = await api.backupDatabase();
    setMessage(result.canceled ? 'Backup cancelado.' : `Backup criado em ${result.path}`);
  }

  return (
    <section>
      <PageHeader title="Configuracoes" description="Parametros de alerta, anexos e backup local." />
      {message ? <div className="mb-4 border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{message}</div> : null}
      <div className="border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Maximo de pessoas ausentes por equipe" value={settings.max_absent_per_team} onChange={(value) => setSettings({ ...settings, max_absent_per_team: value })} />
          <Field label="Maximo de pessoas ausentes por squad" value={settings.max_absent_per_squad} onChange={(value) => setSettings({ ...settings, max_absent_per_squad: value })} />
          <div>
            <label className="label">Alertas consideram</label>
            <select value={settings.absence_alert_scope || 'any_absence'} onChange={(event) => setSettings({ ...settings, absence_alert_scope: event.target.value })}>
              <option value="any_absence">Qualquer ausencia</option>
              <option value="vacations_only">Apenas ferias</option>
            </select>
          </div>
          <Field label="Caminho local para anexos" value={settings.attachments_path} onChange={(value) => setSettings({ ...settings, attachments_path: value })} />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="bg-brand px-4 py-2 text-sm font-semibold text-white">Salvar</button>
          <button onClick={backup} className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <DatabaseBackup size={17} /> Backup manual
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
