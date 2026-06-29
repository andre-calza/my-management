import { contextBridge, ipcRenderer } from 'electron';
import type { ReportKind } from '../shared/types.js';

const api = {
  list: (table: string) => ipcRenderer.invoke('records:list', table),
  save: (table: string, data: Record<string, unknown>) => ipcRenderer.invoke('records:save', table, data),
  remove: (table: string, id: number) => ipcRenderer.invoke('records:delete', table, id),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Record<string, string>) => ipcRenderer.invoke('settings:save', settings),
  getAlerts: () => ipcRenderer.invoke('alerts:list'),
  recalculateAlerts: () => ipcRenderer.invoke('alerts:recalculate'),
  checkAbsenceConflict: (payload: Record<string, unknown>) => ipcRenderer.invoke('alerts:checkAbsence', payload),
  getDashboard: () => ipcRenderer.invoke('dashboard:get'),
  getCalendar: (filters: Record<string, unknown>) => ipcRenderer.invoke('calendar:list', filters),
  getReport: (kind: ReportKind, filters: Record<string, unknown>) => ipcRenderer.invoke('reports:get', kind, filters),
  exportReportCsv: (kind: ReportKind, filters: Record<string, unknown>) => ipcRenderer.invoke('reports:exportCsv', kind, filters),
  backupDatabase: () => ipcRenderer.invoke('backup:database'),
  pickAttachment: () => ipcRenderer.invoke('files:pickAttachment')
};

contextBridge.exposeInMainWorld('gestaoApi', api);

export type GestaoApi = typeof api;
