import type Database from 'better-sqlite3';
import { now } from './connection.js';

export function seedDatabase(db: Database.Database) {
  const seeded = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get() as { value?: string } | undefined;
  if (seeded?.value === 'true') return;

  const stamp = now();
  const insertTeam = db.prepare('INSERT INTO teams (name, description, responsible, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  ['QA', 'DevOps', 'BI', 'IA'].forEach((name, index) => {
    insertTeam.run(name, `Equipe de ${name}`, ['Ana Lima', 'Bruno Costa', 'Carla Nunes', 'Diego Alves'][index], 'Ativa', stamp, stamp);
  });

  const teamId = (name: string) => (db.prepare('SELECT id FROM teams WHERE name = ?').get(name) as { id: number }).id;
  const employees = [
    ['Ana Lima', 'ana.lima@local', 'Analista QA Senior', 'QA', teamId('QA')],
    ['Bruno Costa', 'bruno.costa@local', 'Engenheiro DevOps', 'DevOps', teamId('DevOps')],
    ['Carla Nunes', 'carla.nunes@local', 'Analista BI', 'BI', teamId('BI')],
    ['Diego Alves', 'diego.alves@local', 'Especialista IA', 'IA', teamId('IA')],
    ['Elisa Rocha', 'elisa.rocha@local', 'Desenvolvedora Full Stack', 'Desenvolvimento', teamId('QA')],
    ['Felipe Moura', 'felipe.moura@local', 'PO', 'PO', teamId('BI')],
    ['Gabriela Dias', 'gabriela.dias@local', 'Scrum Master', 'Scrum Master', teamId('DevOps')],
    ['Henrique Souza', 'henrique.souza@local', 'Engenheiro ML', 'IA', null]
  ];
  const insertEmployee = db.prepare(`
    INSERT INTO employees (full_name, email, role, function_type, status, admission_date, notes, team_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Ativo', ?, ?, ?, ?, ?)
  `);
  employees.forEach((employee, index) => {
    insertEmployee.run(employee[0], employee[1], employee[2], employee[3], `2023-0${(index % 9) + 1}-10`, 'Registro de exemplo', employee[4], stamp, stamp);
  });

  const insertSquad = db.prepare('INSERT INTO squads (name, product, responsible, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  [
    ['Squad Portal', 'Portal interno', 'Felipe Moura'],
    ['Squad Mobile', 'Aplicativo mobile', 'Gabriela Dias'],
    ['Squad Dados', 'Plataforma de dados', 'Carla Nunes'],
    ['Squad Automacao', 'Esteira CI/CD', 'Bruno Costa'],
    ['Squad IA Labs', 'Produtos de IA', 'Diego Alves']
  ].forEach((squad) => insertSquad.run(...squad, 'Ativa', stamp, stamp));

  const employeeId = (email: string) => (db.prepare('SELECT id FROM employees WHERE email = ?').get(email) as { id: number }).id;
  const squadId = (name: string) => (db.prepare('SELECT id FROM squads WHERE name = ?').get(name) as { id: number }).id;
  const insertAllocation = db.prepare(`
    INSERT INTO employee_squads (employee_id, squad_id, allocation_percent, start_date, end_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['ana.lima@local', 'Squad Portal', 60], ['ana.lima@local', 'Squad Mobile', 50],
    ['bruno.costa@local', 'Squad Automacao', 80], ['carla.nunes@local', 'Squad Dados', 100],
    ['diego.alves@local', 'Squad IA Labs', 100], ['elisa.rocha@local', 'Squad Portal', 70],
    ['felipe.moura@local', 'Squad Dados', 40], ['gabriela.dias@local', 'Squad Mobile', 50]
  ].forEach(([email, squad, percent]) => insertAllocation.run(employeeId(String(email)), squadId(String(squad)), percent, '2026-01-01', null, stamp, stamp));

  const insertVacation = db.prepare('INSERT INTO vacations (employee_id, start_date, end_date, days_count, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertVacation.run(employeeId('ana.lima@local'), '2026-07-08', '2026-07-18', 11, 'Aprovada', 'Conflito na equipe QA e Squad Portal', stamp, stamp);
  insertVacation.run(employeeId('elisa.rocha@local'), '2026-07-12', '2026-07-20', 9, 'Planejada', 'Conflito proposital', stamp, stamp);
  insertVacation.run(employeeId('carla.nunes@local'), '2026-08-04', '2026-08-14', 11, 'Planejada', 'Ferias planejadas', stamp, stamp);

  const insertDayOff = db.prepare('INSERT INTO days_off (employee_id, date, reason, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertDayOff.run(employeeId('felipe.moura@local'), '2026-08-06', 'Banco de horas', 'Aprovada', 'Conflito com BI/Squad Dados', stamp, stamp);
  insertDayOff.run(employeeId('gabriela.dias@local'), '2026-07-15', 'Compensacao', 'Planejada', '', stamp, stamp);

  const insertLeave = db.prepare('INSERT INTO leaves (employee_id, type, start_date, end_date, days_count, notes, document_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertLeave.run(employeeId('bruno.costa@local'), 'Atestado medico', '2026-07-14', '2026-07-16', 3, 'Atestado de exemplo', '', stamp, stamp);
  insertLeave.run(employeeId('diego.alves@local'), 'Licenca', '2026-09-01', '2026-09-10', 10, 'Licenca planejada', '', stamp, stamp);

  db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run('seeded', 'true', stamp);
}
