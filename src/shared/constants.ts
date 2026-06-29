export const FUNCTION_TYPES = ['QA', 'DevOps', 'BI', 'IA', 'Desenvolvimento', 'PO', 'Scrum Master', 'Outro'] as const;
export const EMPLOYEE_STATUSES = ['Ativo', 'Inativo', 'Ferias', 'Afastado'] as const;
export const ACTIVE_STATUSES = ['Ativa', 'Inativa'] as const;
export const VACATION_STATUSES = ['Planejada', 'Aprovada', 'Cancelada', 'Concluida'] as const;
export const DAY_OFF_STATUSES = ['Planejada', 'Aprovada', 'Cancelada'] as const;
export const LEAVE_TYPES = ['Atestado medico', 'Licenca', 'Afastamento INSS', 'Outro'] as const;
export const ABSENCE_TYPES = ['Ferias', 'Folga', 'Afastamento'] as const;

export const DEFAULT_SETTINGS = {
  max_absent_per_team: '1',
  max_absent_per_squad: '1',
  absence_alert_scope: 'any_absence',
  attachments_path: ''
};
