import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const sqlite3Verbose = sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, 'data');
const primaryDbPath = path.join(dataDir, 'leaves.sqlite');
const fallbackDbPath = path.resolve(__dirname, 'leaves.sqlite');

let dbPath = primaryDbPath;

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // If data/leaves.sqlite does not exist, but initial server/leaves.sqlite exists, seed it!
  if (!fs.existsSync(primaryDbPath) && fs.existsSync(fallbackDbPath)) {
    fs.copyFileSync(fallbackDbPath, primaryDbPath);
    console.log('Seeded database from initial leaves.sqlite into data/leaves.sqlite');
  }
} catch (e) {
  console.warn('Could not initialize data directory, using fallback path', e);
  dbPath = fallbackDbPath;
}

const db = new sqlite3Verbose.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    db.run(`CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        reason TEXT,
        type TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating leaves table', err.message);
        } else {
            console.log('Leaves table ready.');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating settings table', err.message);
        } else {
            console.log('Settings table ready.');
        }
    });
  }
});

export default db;
