const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../triage.sqlite');
const db = new Database(dbPath);

// Initialize database schema
function initializeDatabase() {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS batch_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tickets_processed INTEGER NOT NULL,
      total_processing_time REAL NOT NULL,
      total_tokens_used INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized successfully');
}

// Initialize on first run
initializeDatabase();

module.exports = db;
