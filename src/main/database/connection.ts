import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { createSchema } from './schema.js';
import { seedDatabase } from './seed.js';

let db: Database.Database | null = null;
let dbPath = '';

export function getDatabasePath() {
  return dbPath;
}

export function getDb() {
  if (db) return db;

  const dataDir = app.getPath('userData');
  fs.mkdirSync(dataDir, { recursive: true });
  dbPath = path.join(dataDir, 'gestao-equipes.sqlite');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  createSchema(db);
  seedDatabase(db);
  return db;
}

export function now() {
  return new Date().toISOString();
}
