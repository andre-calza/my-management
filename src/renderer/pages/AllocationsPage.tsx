import { useEffect, useState } from 'react';
import { CrudPage } from './CrudPages';
import { api } from '../api/client';

export function AllocationsPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [squads, setSquads] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    Promise.all([api.list('employees'), api.list('squads')]).then(([employeeRows, squadRows]) => {
      setEmployees(employeeRows);
      setSquads(squadRows);
    });
  }, []);

  return (
    <CrudPage
      title="Alocacoes"
      description="Vinculo de colaboradores com uma ou mais squads."
      table="employee_squads"
      fields={[
        { key: 'employee_id', label: 'Colaborador', type: 'select', options: employees.map((item) => ({ value: Number(item.id), label: String(item.full_name) })) },
        { key: 'squad_id', label: 'Squad', type: 'select', options: squads.map((item) => ({ value: Number(item.id), label: String(item.name) })) },
        { key: 'allocation_percent', label: 'Percentual de alocacao', type: 'number' },
        { key: 'start_date', label: 'Data de inicio', type: 'date' },
        { key: 'end_date', label: 'Data de fim', type: 'date' }
      ]}
      columns={[
        { key: 'employee_name', label: 'Colaborador' },
        { key: 'squad_name', label: 'Squad' },
        { key: 'allocation_percent', label: '%' },
        { key: 'start_date', label: 'Inicio' },
        { key: 'end_date', label: 'Fim' }
      ]}
    />
  );
}
