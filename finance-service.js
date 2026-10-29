
function validarData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`);

  return (
    !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
  );
}

function validarTransacao(transacao) {
  const description = String(transacao.description ?? "").trim();
  const amount = Number(transacao.amount);
  const type = String(transacao.type ?? "").trim().toLowerCase();
  const date = String(transacao.date ?? "").trim();

  if (!description) {
    throw new Error("A descrição não pode ficar vazia.");
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(Math.round(amount * 100)) ||
    Math.round(amount * 100) / 100 !== amount
  ) {
    throw new Error(
      "O valor deve ser positivo e ter no máximo duas casas decimais.",
    );
  }

  if (!["receita", "despesa"].includes(type)) {
    throw new Error("Tipo inválido. Use receita ou despesa.");
  }

  if (!validarData(date)) {
    throw new Error("Data inválida. Use o formato AAAA-MM-DD.");
  }

  return {
    description,
    amount: Math.round(amount * 100),
    type,
    date,
  };
}

function adicionarTransacao(db, transacao) {
  const dados = validarTransacao(transacao);

  const resultado = db
    .prepare(`
      INSERT INTO transactions (description, amount, type, date)
      VALUES (?, ?, ?, ?)
    `)
    .run(dados.description, dados.amount, dados.type, dados.date);

  return resultado.lastInsertRowid;
}

function listarTransacoes(db) {
  const transacoes = db
    .prepare(`
      SELECT id, description, amount, type, date
      FROM transactions
      ORDER BY date DESC, id DESC
    `)
    .all();

  return transacoes.map((transacao) => ({
    ...transacao,
    amount: transacao.amount / 100,
  }));
}

function obterResumoFinanceiro(db) {
  const resultado = db
    .prepare(`
      SELECT
        COALESCE(SUM(
          CASE WHEN type = 'receita' THEN amount ELSE 0 END
        ), 0) AS receitas,
        COALESCE(SUM(
          CASE WHEN type = 'despesa' THEN amount ELSE 0 END
        ), 0) AS despesas
      FROM transactions
    `)
    .get();

  return {
    receitas: resultado.receitas / 100,
    despesas: resultado.despesas / 100,
    saldo: (resultado.receitas - resultado.despesas) / 100,
  };
}

module.exports = {
  validarData,
  validarTransacao,
  adicionarTransacao,
  listarTransacoes,
  obterResumoFinanceiro,
};
