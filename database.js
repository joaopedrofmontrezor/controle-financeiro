
const Database = require("better-sqlite3");
const path = require("node:path");

const dbPath = path.join(__dirname, "finance.db");
const db = new Database(dbPath);

try {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
      date TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date_id
    ON transactions (date DESC, id DESC);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_type
    ON transactions (type);
  `);

  console.log("Banco de dados conectado e inicializado com sucesso.");
} catch (error) {
  if (db.open) {
    db.close();
  }

  throw error;
}

module.exports = db;
