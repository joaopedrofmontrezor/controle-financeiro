const Database = require("better-sqlite3");
const path = require("node:path");

const dbPath = process.env.FINANCE_DB_PATH
  ? path.resolve(process.env.FINANCE_DB_PATH)
  : path.join(__dirname, "finance.db");

let db;

try {
  db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL CHECK(length(trim(description)) > 0),
      amount INTEGER NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
      date TEXT NOT NULL CHECK(
        date(date) IS NOT NULL
        AND date(date) = date
      )
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
  if (db?.open) {
    db.close();
  }

  throw error;
}

module.exports = db;
