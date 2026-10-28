const Database = require('better-sqlite3');
const path = require('path');


const dbPath = path.resolve(__dirname, 'finance.db');
const db = new Database(dbPath, { verbose: console.log });


db.pragma('journal_mode = WAL');


db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
    date TEXT NOT NULL
  )
`);

console.log("Banco de dados SQLite conectado e tabela 'transactions' verificada/criada com sucesso!");


module.exports = db;