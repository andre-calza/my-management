import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import {
  backupDatabase,
  checkAbsenceConflict,
  deleteRecord,
  exportReportCsv,
  getAbsenceEvents,
  getDashboard,
  getReport,
  getSettings,
  listAlerts,
  listRecords,
  pickAttachment,
  recalculateAlerts,
  saveRecord,
  saveSettings
} from './services/appService.js';
import { getDb } from './database/connection.js';

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    title: 'Gestao de Equipes',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    window.loadURL(devUrl);
  } else {
    window.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('records:list', (_event, table: string) => listRecords(table));
  ipcMain.handle('records:save', (_event, table: string, data: Record<string, unknown>) => saveRecord(table, data));
  ipcMain.handle('records:delete', (_event, table: string, id: number) => deleteRecord(table, id));
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_event, settings: Record<string, string>) => saveSettings(settings));
  ipcMain.handle('alerts:list', () => listAlerts());
  ipcMain.handle('alerts:recalculate', () => recalculateAlerts());
  ipcMain.handle('alerts:checkAbsence', (_event, payload: Record<string, unknown>) => checkAbsenceConflict(payload));
  ipcMain.handle('dashboard:get', () => getDashboard());
  ipcMain.handle('calendar:list', (_event, filters: Record<string, unknown>) => getAbsenceEvents(filters));
  ipcMain.handle('reports:get', (_event, kind, filters) => getReport(kind, filters));
  ipcMain.handle('reports:exportCsv', (_event, kind, filters) => exportReportCsv(kind, filters));
  ipcMain.handle('backup:database', () => backupDatabase());
  ipcMain.handle('files:pickAttachment', () => pickAttachment());
}

app.whenReady().then(() => {
  getDb();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
