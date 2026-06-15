const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../triage.sqlite');

let db;
let SQL;

// Initialize database
async function initializeDatabase() {
  SQL = await initSqlJs();
  
  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS triage_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      confidence REAL,
      processing_time REAL,
      tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      triage_id INTEGER NOT NULL,
      ai_category TEXT NOT NULL,
      ai_priority TEXT NOT NULL,
      human_category TEXT NOT NULL,
      human_priority TEXT NOT NULL,
      is_match INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (triage_id) REFERENCES triage_results(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS batch_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tickets_processed INTEGER NOT NULL,
      total_processing_time REAL NOT NULL,
      total_tokens_used INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Save to file
  saveDatabase();

  console.log('Database initialized successfully');
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = {
  initializeDatabase,
  getDb,
  saveDatabase
};
