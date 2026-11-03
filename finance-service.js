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

function validarId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID inválido. Informe um número inteiro positivo.");
  }

  return id;
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

function paginarTransacoes(transacoes, pagina = 1, itensPorPagina = 10) {
  if (!Array.isArray(transacoes)) {
    throw new Error("As transações devem ser fornecidas em um array.");
  }

  if (!Number.isSafeInteger(pagina) || pagina <= 0) {
    throw new Error("Página inválida.");
  }

  if (!Number.isSafeInteger(itensPorPagina) || itensPorPagina <= 0) {
    throw new Error("Quantidade de itens por página inválida.");
  }

  const totalItens = transacoes.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  const paginaAtual = Math.min(pagina, totalPaginas);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  return {
    dados: transacoes.slice(inicio, fim),
    paginaAtual,
    totalPaginas,
    totalItens,
    itensPorPagina,
  };
}

function obterTransacaoPorId(db, id) {
  validarId(id);

  const transacao = db
    .prepare(
      `
      SELECT id, description, amount, type, date
      FROM transactions
      WHERE id = ?
    `,
    )
    .get(id);

  if (!transacao) {
    return null;
  }

  return {
    ...transacao,
    amount: transacao.amount / 100,
  };
}

function atualizarTransacao(db, id, transacao) {
  validarId(id);

  const dados = validarTransacao(transacao);

  const resultado = db
    .prepare(
      `
      UPDATE transactions
      SET description = ?, amount = ?, type = ?, date = ?
      WHERE id = ?
    `,
    )
    .run(dados.description, dados.amount, dados.type, dados.date, id);

  if (resultado.changes === 0) {
    throw new Error("Transação não encontrada.");
  }

  return true;
}

function excluirTransacao(db, id) {
  validarId(id);

  const resultado = db
    .prepare(
      `
      DELETE FROM transactions
      WHERE id = ?
    `,
    )
    .run(id);

  if (resultado.changes === 0) {
    throw new Error("Transação não encontrada.");
  }

  return true;
}

function filtrarTransacoes(db, filtros = {}) {
  if (
    filtros === null ||
    typeof filtros !== "object" ||
    Array.isArray(filtros)
  ) {
    throw new Error("Os filtros devem ser informados em um objeto válido.");
  }

  const { dataInicial, dataFinal, tipo, descricao } = filtros;

  const condicoes = [];
  const parametros = [];

  if (dataInicial !== undefined && dataInicial !== "") {
    if (!validarData(dataInicial)) {
      throw new Error("Data inicial inválida. Use o formato AAAA-MM-DD.");
    }

    condicoes.push("date >= ?");
    parametros.push(dataInicial);
  }

  if (dataFinal !== undefined && dataFinal !== "") {
    if (!validarData(dataFinal)) {
      throw new Error("Data final inválida. Use o formato AAAA-MM-DD.");
    }

    condicoes.push("date <= ?");
    parametros.push(dataFinal);
  }

  if (dataInicial && dataFinal && dataInicial > dataFinal) {
    throw new Error("A data inicial não pode ser posterior à data final.");
  }

  if (tipo !== undefined && tipo !== "") {
    if (typeof tipo !== "string") {
      throw new Error("Tipo inválido. Use receita ou despesa.");
    }

    const tipoNormalizado = tipo.trim().toLowerCase();

    if (!["receita", "despesa"].includes(tipoNormalizado)) {
      throw new Error("Tipo inválido. Use receita ou despesa.");
    }

    condicoes.push("type = ?");
    parametros.push(tipoNormalizado);
  }

  if (descricao !== undefined && descricao !== "") {
    if (typeof descricao !== "string" || !descricao.trim()) {
      throw new Error("A descrição para busca não pode ficar vazia.");
    }

    condicoes.push("description LIKE ?");
    parametros.push(`%${descricao.trim()}%`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const transacoes = db
    .prepare(
      `
      SELECT id, description, amount, type, date
      FROM transactions
      ${where}
      ORDER BY date DESC, id DESC
    `,
    )
    .all(...parametros);

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
        ) AS despesas,

        COUNT(CASE WHEN type = 'receita' THEN 1 END) AS quantidadeReceitas,

        COUNT(CASE WHEN type = 'despesa' THEN 1 END) AS quantidadeDespesas,

        COALESCE(
          MAX(CASE WHEN type = 'receita' THEN amount END),
          0
        ) AS maiorReceita,

        COALESCE(
          MAX(CASE WHEN type = 'despesa' THEN amount END),
          0
        ) AS maiorDespesa

      FROM transactions
    `,
    )
    .get();

  const receitas = resultado.receitas / 100;
  const despesas = resultado.despesas / 100;

  const percentualDespesas = receitas > 0 ? (despesas / receitas) * 100 : 0;

  return {
    receitas,
    despesas,
    saldo: (resultado.receitas - resultado.despesas) / 100,
    quantidadeReceitas: resultado.quantidadeReceitas,
    quantidadeDespesas: resultado.quantidadeDespesas,
    maiorReceita: resultado.maiorReceita / 100,
    maiorDespesa: resultado.maiorDespesa / 100,
    percentualDespesas,
  };
}

function gerarCsvTransacoes(transacoes) {
  if (!Array.isArray(transacoes)) {
    throw new Error("As transações devem ser fornecidas em um array.");
  }

  const cabecalho = ["ID", "Descrição", "Valor", "Tipo", "Data"];

  function escaparCampo(valor) {
    let texto = String(valor ?? "");

    if (/^[\s]*[=+\-@]/.test(texto)) {
      texto = `'${texto}`;
    }

    return `"${texto.replace(/"/g, '""')}"`;
  }

  function formatarValor(valor) {
    return Number(valor).toFixed(2).replace(".", ",");
  }

  const linhas = transacoes.map((transacao) => {
    return [
      transacao.id,
      transacao.description,
      formatarValor(transacao.amount),
      transacao.type,
      transacao.date,
    ]
      .map(escaparCampo)
      .join(";");
  });

  const conteudo = [cabecalho.map(escaparCampo).join(";"), ...linhas].join(
    "\r\n",
  );

  return "\uFEFF" + conteudo;
}

module.exports = {
  validarData,
  validarId,
  validarTransacao,
  adicionarTransacao,
  listarTransacoes,
  paginarTransacoes,
  obterTransacaoPorId,
  atualizarTransacao,
  excluirTransacao,
  filtrarTransacoes,
  obterResumoFinanceiro,
  gerarCsvTransacoes,
};
