import { useEffect, useState } from 'react';
import type { Alert } from '../../shared/types';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  async function load() {
    setAlerts(await api.recalculateAlerts());
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <section>
      <PageHeader title="Alertas" description="Conflitos e riscos calculados automaticamente." action={<button onClick={load} className="bg-brand px-4 py-2 text-sm font-semibold text-white">Recalcular</button>} />
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
            <div className="font-semibold">{alert.type}</div>
            <div>{alert.message}</div>
            <div className="mt-1 text-xs">{alert.start_date || ''} {alert.end_date ? `ate ${alert.end_date}` : ''}</div>
          </div>
        ))}
        {!alerts.length ? <div className="border border-slate-200 bg-white p-4 text-sm text-slate-500">Sem alertas ativos.</div> : null}
      </div>
    </section>
  );
}
