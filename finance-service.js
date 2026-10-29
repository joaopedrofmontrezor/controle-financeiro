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

function converterParaCentavos(valor) {
  if (typeof valor !== "number" && typeof valor !== "string") {
    throw new Error(
      "O valor deve ser positivo e ter no máximo duas casas decimais.",
    );
  }

  const valorTexto = String(valor).trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(valorTexto)) {
    throw new Error(
      "O valor deve ser positivo e ter no máximo duas casas decimais.",
    );
  }

  const [reais, centavos = ""] = valorTexto.split(".");
  const valorEmCentavos = Number(reais) * 100 + Number(centavos.padEnd(2, "0"));

  if (!Number.isSafeInteger(valorEmCentavos) || valorEmCentavos <= 0) {
    throw new Error(
      "O valor deve ser positivo e ter no máximo duas casas decimais.",
    );
  }

  return valorEmCentavos;
}

function validarTransacao(transacao) {
  if (
    transacao === null ||
    typeof transacao !== "object" ||
    Array.isArray(transacao)
  ) {
    throw new Error("A transação deve ser um objeto válido.");
  }

  const { description, amount, type, date } = transacao;

  if (typeof description !== "string" || !description.trim()) {
    throw new Error("A descrição não pode ficar vazia.");
  }

  const valorEmCentavos = converterParaCentavos(amount);

  if (typeof type !== "string") {
    throw new Error("Tipo inválido. Use receita ou despesa.");
  }

  const tipoNormalizado = type.trim().toLowerCase();

  if (!["receita", "despesa"].includes(tipoNormalizado)) {
    throw new Error("Tipo inválido. Use receita ou despesa.");
  }

  if (typeof date !== "string" || !validarData(date.trim())) {
    throw new Error("Data inválida. Use o formato AAAA-MM-DD.");
  }

  return {
    description: description.trim(),
    amount: valorEmCentavos,
    type: tipoNormalizado,
    date: date.trim(),
  };
}

function adicionarTransacao(db, transacao) {
  const dados = validarTransacao(transacao);

  const resultado = db
    .prepare(
      `
      INSERT INTO transactions (description, amount, type, date)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(dados.description, dados.amount, dados.type, dados.date);

  return resultado.lastInsertRowid;
}

function listarTransacoes(db) {
  const transacoes = db
    .prepare(
      `
      SELECT id, description, amount, type, date
      FROM transactions
      ORDER BY date DESC, id DESC
    `,
    )
    .all();

  return transacoes.map((transacao) => ({
    ...transacao,
    amount: transacao.amount / 100,
  }));
}

function obterResumoFinanceiro(db) {
  const resultado = db
    .prepare(
      `
      SELECT
        COALESCE(
          SUM(CASE WHEN type = 'receita' THEN amount ELSE 0 END),
          0
        ) AS receitas,
        COALESCE(
          SUM(CASE WHEN type = 'despesa' THEN amount ELSE 0 END),
          0
        ) AS despesas
      FROM transactions
    `,
    )
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
