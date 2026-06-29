import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import { getDatabasePath, getDb, now } from '../database/connection.js';
import type { AbsenceEvent, Alert, DashboardData, ReportKind } from '../../shared/types.js';

const tables = {
  employees: ['full_name', 'email', 'role', 'function_type', 'status', 'admission_date', 'notes', 'team_id'],
  teams: ['name', 'description', 'responsible', 'status'],
  squads: ['name', 'product', 'responsible', 'status'],
  employee_squads: ['employee_id', 'squad_id', 'allocation_percent', 'start_date', 'end_date'],
  vacations: ['employee_id', 'start_date', 'end_date', 'days_count', 'status', 'notes'],
  days_off: ['employee_id', 'date', 'reason', 'status', 'notes'],
  leaves: ['employee_id', 'type', 'start_date', 'end_date', 'days_count', 'notes', 'document_path']
} as const;

type TableName = keyof typeof tables;
type Row = Record<string, unknown>;

function ensureTable(table: string): asserts table is TableName {
  if (!(table in tables)) throw new Error(`Tabela nao permitida: ${table}`);
}

function rangeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

function compact<T>(items: (T | null | undefined | false)[]) {
  return items.filter(Boolean) as T[];
}

export function listRecords(table: string) {
  ensureTable(table);
  const db = getDb();
  if (table === 'employees') {
    return db.prepare(`
      SELECT e.*, t.name AS team_name
      FROM employees e
      LEFT JOIN teams t ON t.id = e.team_id
      ORDER BY e.full_name
    `).all();
  }
  if (table === 'employee_squads') {
    return db.prepare(`
      SELECT es.*, e.full_name AS employee_name, s.name AS squad_name
      FROM employee_squads es
      JOIN employees e ON e.id = es.employee_id
      JOIN squads s ON s.id = es.squad_id
      ORDER BY e.full_name, s.name
    `).all();
  }
  if (table === 'vacations' || table === 'days_off' || table === 'leaves') {
    return db.prepare(`
      SELECT a.*, e.full_name AS employee_name
      FROM ${table} a
      JOIN employees e ON e.id = a.employee_id
      ORDER BY ${table === 'days_off' ? 'a.date' : 'a.start_date'} DESC
    `).all();
  }
  return db.prepare(`SELECT * FROM ${table} ORDER BY name`).all();
}

export function saveRecord(table: string, data: Row) {
  ensureTable(table);
  const db = getDb();
  const id = Number(data.id || 0);
  const stamp = now();
  const fields = tables[table].filter((field) => field in data);
  if (id) {
    const setSql = [...fields.map((field) => `${field} = @${field}`), 'updated_at = @updated_at'].join(', ');
    db.prepare(`UPDATE ${table} SET ${setSql} WHERE id = @id`).run({ ...data, id, updated_at: stamp });
  } else {
    const allFields = [...fields, 'created_at', 'updated_at'];
    const placeholders = allFields.map((field) => `@${field}`);
    db.prepare(`INSERT INTO ${table} (${allFields.join(', ')}) VALUES (${placeholders.join(', ')})`).run({
      ...data,
      created_at: stamp,
      updated_at: stamp
    });
  }
  recalculateAlerts();
  return { ok: true };
}

export function deleteRecord(table: string, id: number) {
  ensureTable(table);
  getDb().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  recalculateAlerts();
  return { ok: true };
}

export function getSettings() {
  return getDb().prepare('SELECT key, value FROM settings ORDER BY key').all();
}

export function saveSettings(settings: Record<string, string>) {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  Object.entries(settings).forEach(([key, value]) => stmt.run(key, String(value ?? ''), now()));
  recalculateAlerts();
  return { ok: true };
}

export function getAbsenceEvents(filters: Row = {}) {
  const db = getDb();
  const events = db.prepare(`
    SELECT v.id, 'Ferias' AS type, v.employee_id, e.full_name AS employee_name, e.team_id, t.name AS team_name,
      v.start_date, v.end_date, v.status, v.notes,
      (SELECT GROUP_CONCAT(s.name, ', ') FROM employee_squads es JOIN squads s ON s.id = es.squad_id WHERE es.employee_id = e.id) AS squad_names
    FROM vacations v JOIN employees e ON e.id = v.employee_id LEFT JOIN teams t ON t.id = e.team_id
    WHERE v.status <> 'Cancelada'
    UNION ALL
    SELECT d.id, 'Folga' AS type, d.employee_id, e.full_name, e.team_id, t.name,
      d.date, d.date, d.status, d.notes,
      (SELECT GROUP_CONCAT(s.name, ', ') FROM employee_squads es JOIN squads s ON s.id = es.squad_id WHERE es.employee_id = e.id)
    FROM days_off d JOIN employees e ON e.id = d.employee_id LEFT JOIN teams t ON t.id = e.team_id
    WHERE d.status <> 'Cancelada'
    UNION ALL
    SELECT l.id, 'Afastamento' AS type, l.employee_id, e.full_name, e.team_id, t.name,
      l.start_date, l.end_date, l.type, l.notes,
      (SELECT GROUP_CONCAT(s.name, ', ') FROM employee_squads es JOIN squads s ON s.id = es.squad_id WHERE es.employee_id = e.id)
    FROM leaves l JOIN employees e ON e.id = l.employee_id LEFT JOIN teams t ON t.id = e.team_id
    ORDER BY start_date
  `).all() as AbsenceEvent[];

  return events.filter((event) => {
    const month = filters.month ? Number(filters.month) : 0;
    const year = filters.year ? Number(filters.year) : 0;
    const monthStart = month && year ? `${year}-${String(month).padStart(2, '0')}-01` : '';
    const monthEnd = month && year ? `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}` : '';
    return compact([
      filters.employee_id ? event.employee_id === Number(filters.employee_id) : true,
      filters.team_id ? event.team_id === Number(filters.team_id) : true,
      filters.type ? event.type === filters.type : true,
      filters.squad_id ? employeeHasSquad(event.employee_id, Number(filters.squad_id)) : true,
      month && year ? rangeOverlaps(event.start_date, event.end_date, monthStart, monthEnd) : true
    ]).every(Boolean);
  });
}

function employeeHasSquad(employeeId: number, squadId: number) {
  const row = getDb().prepare('SELECT 1 FROM employee_squads WHERE employee_id = ? AND squad_id = ? LIMIT 1').get(employeeId, squadId);
  return Boolean(row);
}

export function recalculateAlerts() {
  const db = getDb();
  db.prepare('DELETE FROM alerts').run();
  const settings = Object.fromEntries((getSettings() as { key: string; value: string }[]).map((item) => [item.key, item.value]));
  const maxTeam = Number(settings.max_absent_per_team || 1);
  const maxSquad = Number(settings.max_absent_per_squad || 1);
  const scope = settings.absence_alert_scope || 'any_absence';
  const events = getAbsenceEvents().filter((event) => scope === 'any_absence' || event.type === 'Ferias');
  const alertStmt = db.prepare(`
    INSERT INTO alerts (type, severity, message, entity_type, entity_id, start_date, end_date, resolved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  const add = (type: string, message: string, entityType?: string, entityId?: number, start?: string, end?: string) => {
    alertStmt.run(type, 'Risco', message, entityType, entityId, start, end, now());
  };

  for (const employee of db.prepare('SELECT * FROM employees').all() as Row[]) {
    if (!employee.team_id) add('COLLABORATOR_WITHOUT_TEAM', `Colaborador ${employee.full_name} esta sem equipe principal.`, 'employee', Number(employee.id));
    const total = db.prepare(`
      SELECT COALESCE(SUM(allocation_percent), 0) AS total FROM employee_squads
      WHERE employee_id = ? AND (end_date IS NULL OR end_date >= date('now'))
    `).get(employee.id) as { total: number };
    if (total.total > 100) add('ALLOCATION_OVER_100', `Colaborador ${employee.full_name} esta alocado em ${total.total}% nas squads.`, 'employee', Number(employee.id));
  }

  for (const squad of db.prepare('SELECT * FROM squads').all() as Row[]) {
    const count = db.prepare('SELECT COUNT(*) AS total FROM employee_squads WHERE squad_id = ?').get(squad.id) as { total: number };
    if (count.total === 0) add('SQUAD_WITHOUT_EMPLOYEES', `Squad ${squad.name} nao possui colaboradores vinculados.`, 'squad', Number(squad.id));
  }

  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i];
      const b = events[j];
      if (!rangeOverlaps(a.start_date, a.end_date, b.start_date, b.end_date)) continue;
      const start = a.start_date > b.start_date ? a.start_date : b.start_date;
      const end = a.end_date < b.end_date ? a.end_date : b.end_date;
      if (a.employee_id === b.employee_id) {
        add('EMPLOYEE_ABSENCE_OVERLAP', `Colaborador ${a.employee_name} possui ausencias sobrepostas.`, 'employee', a.employee_id, start, end);
      }
      if (a.team_id && a.team_id === b.team_id && maxTeam <= 1) {
        add('TEAM_ABSENCE_CONFLICT', `Atencao: ja existe outro colaborador da equipe ${a.team_name} ausente neste periodo.`, 'team', Number(a.team_id), start, end);
      }
      const sharedSquads = sharedSquadNames(a.employee_id, b.employee_id);
      sharedSquads.forEach((squad) => {
        if (maxSquad <= 1) add('SQUAD_ABSENCE_CONFLICT', `Atencao: a squad ${squad.name} tera mais de um colaborador ausente neste periodo.`, 'squad', squad.id, start, end);
      });
    }
  }
  return listAlerts();
}

function sharedSquadNames(employeeA: number, employeeB: number) {
  return getDb().prepare(`
    SELECT s.id, s.name
    FROM employee_squads a
    JOIN employee_squads b ON b.squad_id = a.squad_id AND b.employee_id = ?
    JOIN squads s ON s.id = a.squad_id
    WHERE a.employee_id = ?
  `).all(employeeB, employeeA) as { id: number; name: string }[];
}

export function listAlerts() {
  return getDb().prepare('SELECT * FROM alerts WHERE resolved = 0 ORDER BY created_at DESC').all();
}

export function checkAbsenceConflict(payload: Row) {
  const type = String(payload.kind || 'Ferias');
  const employeeId = Number(payload.employee_id);
  const start = String(payload.start_date || payload.date);
  const end = String(payload.end_date || payload.date);
  const warnings: string[] = [];
  const events = getAbsenceEvents().filter((event) => event.employee_id !== employeeId && rangeOverlaps(start, end, event.start_date, event.end_date));
  const employee = getDb().prepare('SELECT e.*, t.name AS team_name FROM employees e LEFT JOIN teams t ON t.id = e.team_id WHERE e.id = ?').get(employeeId) as Row;
  events.forEach((event) => {
    if (employee?.team_id && event.team_id === employee.team_id) warnings.push(`Atencao: ja existe outro colaborador da equipe ${employee.team_name} em ${type.toLowerCase()} neste periodo.`);
    sharedSquadNames(employeeId, event.employee_id).forEach((squad) => warnings.push(`Atencao: a squad ${squad.name} tera mais de um colaborador ausente neste periodo.`));
  });
  return { warnings: [...new Set(warnings)], alerts: listAlerts() };
}

export function getDashboard(): DashboardData {
  recalculateAlerts();
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const monthEnd = today.slice(0, 8) + '31';
  const scalar = (sql: string, params: unknown[] = []) => (db.prepare(sql).get(...params) as { total: number }).total;
  return {
    totalActiveEmployees: scalar("SELECT COUNT(*) AS total FROM employees WHERE status = 'Ativo'"),
    vacationsToday: scalar("SELECT COUNT(*) AS total FROM vacations WHERE status <> 'Cancelada' AND ? BETWEEN start_date AND end_date", [today]),
    leavesToday: scalar('SELECT COUNT(*) AS total FROM leaves WHERE ? BETWEEN start_date AND end_date', [today]),
    daysOffThisMonth: scalar("SELECT COUNT(*) AS total FROM days_off WHERE status <> 'Cancelada' AND date BETWEEN ? AND ?", [monthStart, monthEnd]),
    vacationsThisMonth: scalar("SELECT COUNT(*) AS total FROM vacations WHERE status <> 'Cancelada' AND start_date <= ? AND end_date >= ?", [monthEnd, monthStart]),
    activeAlerts: scalar('SELECT COUNT(*) AS total FROM alerts WHERE resolved = 0'),
    upcomingVacations: db.prepare("SELECT v.*, e.full_name AS employee_name FROM vacations v JOIN employees e ON e.id = v.employee_id WHERE v.status <> 'Cancelada' AND v.start_date >= ? ORDER BY v.start_date LIMIT 6").all(today) as never,
    upcomingDaysOff: db.prepare("SELECT d.*, e.full_name AS employee_name FROM days_off d JOIN employees e ON e.id = d.employee_id WHERE d.status <> 'Cancelada' AND d.date >= ? ORDER BY d.date LIMIT 6").all(today) as never,
    ongoingLeaves: db.prepare('SELECT l.*, e.full_name AS employee_name FROM leaves l JOIN employees e ON e.id = l.employee_id WHERE ? BETWEEN l.start_date AND l.end_date ORDER BY l.end_date').all(today) as never,
    teamConflicts: db.prepare("SELECT * FROM alerts WHERE type = 'TEAM_ABSENCE_CONFLICT' ORDER BY start_date LIMIT 6").all() as Alert[],
    squadConflicts: db.prepare("SELECT * FROM alerts WHERE type = 'SQUAD_ABSENCE_CONFLICT' ORDER BY start_date LIMIT 6").all() as Alert[]
  };
}

export function getReport(kind: ReportKind, filters: Row = {}) {
  const db = getDb();
  if (kind === 'absencesByEmployee') {
    return getAbsenceEvents(filters).map((event) => ({ colaborador: event.employee_name, tipo: event.type, inicio: event.start_date, fim: event.end_date, equipe: event.team_name, squads: event.squad_names }));
  }
  if (kind === 'absencesByTeam') {
    const totals = new Map<string, number>();
    getAbsenceEvents(filters).forEach((event) => {
      const key = event.team_name || 'Sem equipe';
      totals.set(key, (totals.get(key) || 0) + 1);
    });
    return [...totals.entries()].map(([equipe, total]) => ({ equipe, total }));
  }
  if (kind === 'absencesBySquad') {
    return getAbsenceEvents(filters).flatMap((event) => String(event.squad_names || 'Sem squad').split(', ').map((squad) => ({ squad, colaborador: event.employee_name, tipo: event.type, inicio: event.start_date, fim: event.end_date })));
  }
  if (kind === 'plannedVacationsByMonth') {
    return db.prepare("SELECT substr(start_date, 1, 7) AS mes, COUNT(*) AS total FROM vacations WHERE status IN ('Planejada', 'Aprovada') GROUP BY substr(start_date, 1, 7) ORDER BY mes").all();
  }
  if (kind === 'leavesByPeriod') {
    return db.prepare('SELECT e.full_name AS colaborador, l.type AS tipo, l.start_date AS inicio, l.end_date AS fim, l.days_count AS dias FROM leaves l JOIN employees e ON e.id = l.employee_id ORDER BY l.start_date').all();
  }
  return db.prepare('SELECT s.name AS squad, e.full_name AS colaborador, es.allocation_percent AS percentual FROM employee_squads es JOIN squads s ON s.id = es.squad_id JOIN employees e ON e.id = es.employee_id ORDER BY s.name, e.full_name').all();
}

export async function exportReportCsv(kind: ReportKind, filters: Row = {}) {
  const result = await dialog.showSaveDialog({ defaultPath: `${kind}.csv`, filters: [{ name: 'CSV', extensions: ['csv'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const rows = getReport(kind, filters) as Row[];
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(';'), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  fs.writeFileSync(result.filePath, csv, 'utf8');
  return { canceled: false, path: result.filePath };
}

export async function backupDatabase() {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const source = getDatabasePath();
  const target = path.join(result.filePaths[0], `gestao-equipes-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
  fs.copyFileSync(source, target);
  return { canceled: false, path: target };
}

export async function pickAttachment() {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Documentos', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'] }] });
  return { canceled: result.canceled, path: result.filePaths[0] || '' };
}
