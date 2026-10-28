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


function listarTransacoes() {
  try {
    
    const stmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC');
    const transacoes = stmt.all();

    console.log("\n================ EXTRATO FINANCEIRO ================");
    if (transacoes.length === 0) {
      console.log("Nenhuma transação registrada até o momento.");
      console.log("=====================================================");
      return;
    }

    transacoes.forEach(t => {
      const tipoFormatado = t.type === 'receita' ? '🟢 RECEITA' : '🔴 DESPESA';
      console.log(`[ID: ${t.id}] ${t.date} | ${tipoFormatado} | R$ ${t.amount.toFixed(2)} - ${t.description}`);
    });
    console.log("=====================================================");
  } catch (error) {
    console.error("[Erro ao listar transações]:", error.message);
  }
}


function calcularSaldo() {
  try {
    
    const stmtReceitas = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'receita'");
    const totalReceitas = stmtReceitas.get().total || 0;

    
    const stmtDespesas = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'despesa'");
    const totalDespesas = stmtDespesas.get().total || 0;

    
    const saldoFinal = totalReceitas - totalDespesas;

    console.log("\n================ RESUMO DE SALDO ================");
    console.log(`Total de Receitas : R$ ${totalReceitas.toFixed(2)}`);
    console.log(`Total de Despesas : R$ ${totalDespesas.toFixed(2)}`);
    console.log(`-------------------------------------------------`);
    console.log(`Saldo Atual       : R$ ${saldoFinal.toFixed(2)}`);
    console.log("=================================================");
  } catch (error) {
    console.error("[Erro ao calcular saldo]:", error.message);
  }
}


adicionarTransacao("Venda de Item Usado", 300.00, "receita", "2026-06-14");


adicionarTransacao("Jantar fora", 95.50, "despesa", "2026-06-14");
listarTransacoes();
calcularSaldo();