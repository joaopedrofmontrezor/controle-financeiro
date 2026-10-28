const db = require('./database');


function adicionarTransacao(description, amount, type, date) {
  try {
    
    if (type !== 'receita' && type !== 'despesa') {
      console.log("[Erro] O tipo deve ser obrigatoriamente 'receita' ou 'despesa'.");
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (description, amount, type, date)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(description, amount, type, date);
    console.log(`[Sucesso] Transação '${description}' cadastrada com ID: ${info.lastInsertRowid}`);
  } catch (error) {
    console.error("[Erro ao cadastrar transação]:", error.message);
  }
}


adicionarTransacao("Salário", 4500.00, "receita", "2026-06-01");
adicionarTransacao("Supermercado", 350.50, "despesa", "2026-06-03");
adicionarTransacao("Conta de Luz", 180.00, "despesa", "2026-06-05");