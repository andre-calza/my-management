export type EntityId = number;

export type Employee = {
  id: EntityId;
  full_name: string;
  email: string;
  role: string;
  function_type: string;
  status: string;
  admission_date: string;
  notes?: string;
  team_id?: EntityId | null;
  team_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type Team = {
  id: EntityId;
  name: string;
  description?: string;
  responsible?: string;
  status: string;
};

export type Squad = {
  id: EntityId;
  name: string;
  product?: string;
  responsible?: string;
  status: string;
};

export type EmployeeSquad = {
  id: EntityId;
  employee_id: EntityId;
  squad_id: EntityId;
  allocation_percent: number;
  start_date: string;
  end_date?: string | null;
  employee_name?: string;
  squad_name?: string;
};

export type Vacation = {
  id: EntityId;
  employee_id: EntityId;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  notes?: string;
  employee_name?: string;
};

export type DayOff = {
  id: EntityId;
  employee_id: EntityId;
  date: string;
  reason: string;
  status: string;
  notes?: string;
  employee_name?: string;
};

export type Leave = {
  id: EntityId;
  employee_id: EntityId;
  type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  notes?: string;
  document_path?: string;
  employee_name?: string;
};

export type Alert = {
  id: EntityId;
  type: string;
  severity: string;
  message: string;
  entity_type?: string;
  entity_id?: EntityId;
  start_date?: string;
  end_date?: string;
  resolved: number;
  created_at: string;
};

export type Setting = {
  key: string;
  value: string;
  updated_at?: string;
};

export type DashboardData = {
  totalActiveEmployees: number;
  vacationsToday: number;
  leavesToday: number;
  daysOffThisMonth: number;
  vacationsThisMonth: number;
  activeAlerts: number;
  upcomingVacations: Vacation[];
  upcomingDaysOff: DayOff[];
  ongoingLeaves: Leave[];
  teamConflicts: Alert[];
  squadConflicts: Alert[];
};

export type AbsenceEvent = {
  id: number;
  type: 'Ferias' | 'Folga' | 'Afastamento';
  employee_id: number;
  employee_name: string;
  team_id?: number | null;
  team_name?: string | null;
  squad_names?: string;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
};

export type AlertCheckResult = {
  warnings: string[];
  alerts: Alert[];
};

export type ReportKind =
  | 'absencesByEmployee'
  | 'absencesByTeam'
  | 'absencesBySquad'
  | 'plannedVacationsByMonth'
  | 'leavesByPeriod'
  | 'employeesBySquad';
