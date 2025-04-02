import { drizzle } from 'drizzle-orm/better-sqlite3';
// @ts-ignore
import Database from 'better-sqlite3';
// Add type declaration for better-sqlite3
// Import type definitions from @types/better-sqlite3 instead of declaring module
import 'better-sqlite3';
import * as schema from '@shared/schema.sqlite';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a SQLite database file in the data directory
const dbPath = path.join(dataDir, 'chatbot.db');
const sqlite = new Database(dbPath);

// For better performance
sqlite.pragma('journal_mode = WAL');

// Create a Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the SQLite instance for session store
export const sqliteInstance = sqlite;