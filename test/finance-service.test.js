const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
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
} = require("../finance-service");

let db;
let diretorioTemporario;

beforeEach(() => {
  diretorioTemporario = fs.mkdtempSync(
    path.join(os.tmpdir(), "controle-financeiro-test-"),
  );

  const caminhoBanco = path.join(diretorioTemporario, "test.db");
  db = new Database(caminhoBanco);

  db.exec(`
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('receita', 'despesa')),
      date TEXT NOT NULL
    );
  `);
});

afterEach(() => {
  if (db && db.open) {
    db.close();
  }

  if (diretorioTemporario) {
    fs.rmSync(diretorioTemporario, {
      recursive: true,
      force: true,
    });
  }
});

test("aceita uma data válida", () => {
  assert.equal(validarData("2026-10-29"), true);
});

test("rejeita uma data inexistente", () => {
  assert.equal(validarData("2026-02-30"), false);
});

test("rejeita uma data fora do formato esperado", () => {
  assert.equal(validarData("29/10/2026"), false);
});

test("aceita uma transação válida", () => {
  const resultado = validarTransacao({
    description: "Salário",
    amount: 2500,
    type: "receita",
    date: "2026-10-29",
  });

  assert.deepStrictEqual(resultado, {
    description: "Salário",
    amount: 250000,
    type: "receita",
    date: "2026-10-29",
  });
});

test("rejeita descrição vazia", () => {
  assert.throws(
    () =>
      validarTransacao({
        description: "   ",
        amount: 100,
        type: "receita",
        date: "2026-10-29",
      }),
    /descrição não pode ficar vazia/i,
  );
});

test("rejeita valor zero, negativo ou inválido", () => {
  for (const amount of [0, -10, NaN, Infinity, "abc"]) {
    assert.throws(
      () =>
        validarTransacao({
          description: "Teste",
          amount,
          type: "receita",
          date: "2026-10-29",
        }),
      /valor deve ser positivo e ter no máximo duas casas decimais/i,
    );
  }
});

test("rejeita um tipo de transação inválido", () => {
  assert.throws(
    () =>
      validarTransacao({
        description: "Teste",
        amount: 100,
        type: "transferência",
        date: "2026-10-29",
      }),
    /tipo inválido/i,
  );
});

test("cadastra e recupera uma transação do banco", () => {
  const id = adicionarTransacao(db, {
    description: "Venda",
    amount: 150,
    type: "receita",
    date: "2026-10-29",
  });

  const transacoes = listarTransacoes(db);

  assert.equal(transacoes.length, 1);
  assert.equal(transacoes[0].id, Number(id));
  assert.equal(transacoes[0].description, "Venda");
  assert.equal(transacoes[0].amount, 150);
});

test("armazena valores monetários em centavos inteiros no banco", () => {
  adicionarTransacao(db, {
    description: "Venda",
    amount: 25,
    type: "receita",
    date: "2026-10-29",
  });

  const transacao = db
    .prepare(
      `
      SELECT amount
      FROM transactions
      WHERE description = ?
    `,
    )
    .get("Venda");

  assert.equal(transacao.amount, 2500);
  assert.equal(Number.isInteger(transacao.amount), true);
});

test("não cadastra transação com dados inválidos", () => {
  assert.throws(
    () =>
      adicionarTransacao(db, {
        description: "",
        amount: 100,
        type: "receita",
        date: "2026-10-29",
      }),
    /descrição não pode ficar vazia/i,
  );

  assert.equal(listarTransacoes(db).length, 0);
});

test("calcula corretamente receitas, despesas e saldo", () => {
  adicionarTransacao(db, {
    description: "Salário",
    amount: 2000,
    type: "receita",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Aluguel",
    amount: 750,
    type: "despesa",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Freelance",
    amount: 300,
    type: "receita",
    date: "2026-10-28",
  });

  assert.deepStrictEqual(obterResumoFinanceiro(db), {
    receitas: 2300,
    despesas: 750,
    saldo: 1550,
    quantidadeReceitas: 2,
    quantidadeDespesas: 1,
    maiorReceita: 2000,
    maiorDespesa: 750,
    percentualDespesas: (750 / 2300) * 100,
  });
});

test("retorna valores zerados quando não há transações", () => {
  assert.deepStrictEqual(obterResumoFinanceiro(db), {
    receitas: 0,
    despesas: 0,
    saldo: 0,
    quantidadeReceitas: 0,
    quantidadeDespesas: 0,
    maiorReceita: 0,
    maiorDespesa: 0,
    percentualDespesas: 0,
  });
});

test("normaliza descrição e tipo da transação", () => {
  const resultado = validarTransacao({
    description: "  Salário mensal  ",
    amount: 2500,
    type: "RECEITA",
    date: "2026-10-29",
  });

  assert.equal(resultado.description, "Salário mensal");
  assert.equal(resultado.type, "receita");
});

test("rejeita valores com mais de duas casas decimais", () => {
  assert.throws(
    () =>
      validarTransacao({
        description: "Compra",
        amount: 10.123,
        type: "despesa",
        date: "2026-10-29",
      }),
    /duas casas decimais/i,
  );
});

test("rejeita valores que ultrapassam o limite seguro de centavos", () => {
  assert.throws(
    () =>
      validarTransacao({
        description: "Valor excessivo",
        amount: Number.MAX_SAFE_INTEGER,
        type: "receita",
        date: "2026-10-29",
      }),
    /valor deve ser positivo e ter no máximo duas casas decimais/i,
  );
});

test("converte valores decimais para centavos corretamente", () => {
  const resultado = validarTransacao({
    description: "Compra pequena",
    amount: 0.29,
    type: "despesa",
    date: "2026-10-29",
  });

  assert.equal(resultado.amount, 29);
});

test("ordena o extrato da data mais recente para a mais antiga", () => {
  adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 20,
    type: "despesa",
    date: "2026-10-20",
  });

  adicionarTransacao(db, {
    description: "Compra recente",
    amount: 30,
    type: "despesa",
    date: "2026-10-28",
  });

  const transacoes = listarTransacoes(db);

  assert.equal(transacoes[0].description, "Compra recente");
  assert.equal(transacoes[1].description, "Compra antiga");
});

test("calcula saldo negativo quando as despesas superam as receitas", () => {
  adicionarTransacao(db, {
    description: "Venda",
    amount: 100,
    type: "receita",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Conta",
    amount: 180,
    type: "despesa",
    date: "2026-10-29",
  });

  const resumo = obterResumoFinanceiro(db);

  assert.equal(resumo.receitas, 100);
  assert.equal(resumo.despesas, 180);
  assert.equal(resumo.saldo, -80);
});

test("rejeita transações que não são objetos válidos", () => {
  for (const transacao of [null, undefined, [], "transação", 123]) {
    assert.throws(
      () => validarTransacao(transacao),
      /transação deve ser um objeto válido/i,
    );
  }
});

test("rejeita descrição que não seja texto", () => {
  for (const description of [123, true, {}, []]) {
    assert.throws(
      () =>
        validarTransacao({
          description,
          amount: 10,
          type: "receita",
          date: "2026-10-29",
        }),
      /descrição não pode ficar vazia/i,
    );
  }
});

test("rejeita tipos de transação que não sejam texto", () => {
  for (const type of [null, undefined, 123, true, {}]) {
    assert.throws(
      () =>
        validarTransacao({
          description: "Teste",
          amount: 10,
          type,
          date: "2026-10-29",
        }),
      /tipo inválido/i,
    );
  }
});

test("rejeita datas que não sejam texto", () => {
  for (const date of [null, undefined, 20261029, true, {}]) {
    assert.throws(
      () =>
        validarTransacao({
          description: "Teste",
          amount: 10,
          type: "receita",
          date,
        }),
      /data inválida/i,
    );
  }
});

test("aceita valor monetário com vírgula decimal", () => {
  const resultado = validarTransacao({
    description: "Compra",
    amount: "10,50",
    type: "despesa",
    date: "2026-10-29",
  });

  assert.equal(resultado.amount, 1050);
});

test("rejeita valores monetários com formatos inválidos", () => {
  for (const amount of ["", " ", "1e3", "10.123", true, null, {}, []]) {
    assert.throws(
      () =>
        validarTransacao({
          description: "Teste",
          amount,
          type: "receita",
          date: "2026-10-29",
        }),
      /valor deve ser positivo e ter no máximo duas casas decimais/i,
    );
  }
});

test("aceita data válida com espaços externos", () => {
  const resultado = validarTransacao({
    description: "Teste",
    amount: 10,
    type: "receita",
    date: " 2026-10-29 ",
  });

  assert.equal(resultado.date, "2026-10-29");
});

test("ordena transações da mesma data pelo ID decrescente", () => {
  adicionarTransacao(db, {
    description: "Primeira transação",
    amount: 10,
    type: "receita",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Segunda transação",
    amount: 20,
    type: "receita",
    date: "2026-10-29",
  });

  const transacoes = listarTransacoes(db);

  assert.equal(transacoes[0].description, "Segunda transação");
  assert.equal(transacoes[1].description, "Primeira transação");
});

test("filtra transações por período", () => {
  adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 50,
    type: "despesa",
    date: "2026-09-20",
  });

  adicionarTransacao(db, {
    description: "Compra de outubro",
    amount: 100,
    type: "despesa",
    date: "2026-10-15",
  });

  adicionarTransacao(db, {
    description: "Compra de novembro",
    amount: 80,
    type: "despesa",
    date: "2026-11-05",
  });

  const resultado = filtrarTransacoes(db, {
    dataInicial: "2026-10-01",
    dataFinal: "2026-10-31",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].description, "Compra de outubro");
});

test("filtra transações a partir de uma data inicial", () => {
  adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 50,
    type: "despesa",
    date: "2026-09-20",
  });

  adicionarTransacao(db, {
    description: "Compra recente",
    amount: 100,
    type: "despesa",
    date: "2026-10-15",
  });

  const resultado = filtrarTransacoes(db, {
    dataInicial: "2026-10-01",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].description, "Compra recente");
});

test("filtra transações até uma data final", () => {
  adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 50,
    type: "despesa",
    date: "2026-09-20",
  });

  adicionarTransacao(db, {
    description: "Compra recente",
    amount: 100,
    type: "despesa",
    date: "2026-11-15",
  });

  const resultado = filtrarTransacoes(db, {
    dataFinal: "2026-10-31",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].description, "Compra antiga");
});

test("filtra transações por tipo", () => {
  adicionarTransacao(db, {
    description: "Salário",
    amount: 2000,
    type: "receita",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Aluguel",
    amount: 750,
    type: "despesa",
    date: "2026-10-29",
  });

  const resultado = filtrarTransacoes(db, {
    tipo: "despesa",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].type, "despesa");
});

test("normaliza o tipo informado no filtro", () => {
  adicionarTransacao(db, {
    description: "Salário",
    amount: 2000,
    type: "receita",
    date: "2026-10-29",
  });

  const resultado = filtrarTransacoes(db, {
    tipo: " RECEITA ",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].type, "receita");
});

test("busca transações por parte da descrição", () => {
  adicionarTransacao(db, {
    description: "Compra no supermercado",
    amount: 150,
    type: "despesa",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Pagamento de aluguel",
    amount: 800,
    type: "despesa",
    date: "2026-10-29",
  });

  const resultado = filtrarTransacoes(db, {
    descricao: "supermercado",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].description, "Compra no supermercado");
});

test("combina período, tipo e descrição na mesma consulta", () => {
  adicionarTransacao(db, {
    description: "Compra no mercado",
    amount: 100,
    type: "despesa",
    date: "2026-10-15",
  });

  adicionarTransacao(db, {
    description: "Salário mensal",
    amount: 2000,
    type: "receita",
    date: "2026-10-15",
  });

  adicionarTransacao(db, {
    description: "Compra no mercado",
    amount: 80,
    type: "despesa",
    date: "2026-11-15",
  });

  const resultado = filtrarTransacoes(db, {
    dataInicial: "2026-10-01",
    dataFinal: "2026-10-31",
    tipo: "despesa",
    descricao: "mercado",
  });

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].description, "Compra no mercado");
  assert.equal(resultado[0].amount, 100);
});

test("retorna todas as transações quando nenhum filtro é informado", () => {
  adicionarTransacao(db, {
    description: "Salário",
    amount: 2000,
    type: "receita",
    date: "2026-10-29",
  });

  adicionarTransacao(db, {
    description: "Aluguel",
    amount: 750,
    type: "despesa",
    date: "2026-10-28",
  });

  const resultado = filtrarTransacoes(db, {});

  assert.equal(resultado.length, 2);
  assert.equal(resultado[0].description, "Salário");
});

test("retorna lista vazia quando nenhum resultado corresponde aos filtros", () => {
  adicionarTransacao(db, {
    description: "Salário",
    amount: 2000,
    type: "receita",
    date: "2026-10-29",
  });

  const resultado = filtrarTransacoes(db, {
    tipo: "despesa",
  });

  assert.deepEqual(resultado, []);
});

test("rejeita datas inválidas nos filtros", () => {
  assert.throws(
    () =>
      filtrarTransacoes(db, {
        dataInicial: "2026-02-30",
      }),
    /data inicial inválida/i,
  );

  assert.throws(
    () =>
      filtrarTransacoes(db, {
        dataFinal: "29/10/2026",
      }),
    /data final inválida/i,
  );
});

test("rejeita período com data inicial posterior à data final", () => {
  assert.throws(
    () =>
      filtrarTransacoes(db, {
        dataInicial: "2026-11-01",
        dataFinal: "2026-10-01",
      }),
    /data inicial não pode ser posterior à data final/i,
  );
});

test("rejeita tipo inválido nos filtros", () => {
  assert.throws(
    () =>
      filtrarTransacoes(db, {
        tipo: "transferência",
      }),
    /tipo inválido/i,
  );
});

test("rejeita descrição vazia nos filtros", () => {
  assert.throws(
    () =>
      filtrarTransacoes(db, {
        descricao: "   ",
      }),
    /descrição para busca não pode ficar vazia/i,
  );
});

test("rejeita filtros que não sejam um objeto válido", () => {
  for (const filtros of [null, [], "teste", 123]) {
    assert.throws(
      () => filtrarTransacoes(db, filtros),
      /filtros devem ser informados em um objeto válido/i,
    );
  }
});

test("busca uma transação pelo ID", () => {
  const id = adicionarTransacao(db, {
    description: "Compra",
    amount: 50.75,
    type: "despesa",
    date: "2026-10-29",
  });

  const resultado = obterTransacaoPorId(db, Number(id));

  assert.equal(resultado.id, Number(id));
  assert.equal(resultado.description, "Compra");
  assert.equal(resultado.amount, 50.75);
  assert.equal(resultado.type, "despesa");
});

test("retorna null quando o ID não existe", () => {
  assert.equal(obterTransacaoPorId(db, 999), null);
});

test("rejeita IDs inválidos na busca", () => {
  for (const id of [0, -1, 1.5, "1", null, undefined, NaN]) {
    assert.throws(() => obterTransacaoPorId(db, id), /ID inválido/i);
  }
});

test("atualiza todos os campos de uma transação", () => {
  const id = adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 50,
    type: "despesa",
    date: "2026-10-20",
  });

  atualizarTransacao(db, Number(id), {
    description: "Compra atualizada",
    amount: 125.9,
    type: "receita",
    date: "2026-10-29",
  });

  const resultado = obterTransacaoPorId(db, Number(id));

  assert.equal(resultado.description, "Compra atualizada");
  assert.equal(resultado.amount, 125.9);
  assert.equal(resultado.type, "receita");
  assert.equal(resultado.date, "2026-10-29");
});

test("mantém o valor atualizado em centavos inteiros no banco", () => {
  const id = adicionarTransacao(db, {
    description: "Compra",
    amount: 10,
    type: "despesa",
    date: "2026-10-29",
  });

  atualizarTransacao(db, Number(id), {
    description: "Compra atualizada",
    amount: 25.9,
    type: "despesa",
    date: "2026-10-29",
  });

  const resultado = db
    .prepare("SELECT amount FROM transactions WHERE id = ?")
    .get(Number(id));

  assert.equal(resultado.amount, 2590);
  assert.equal(Number.isInteger(resultado.amount), true);
});

test("rejeita atualização com dados inválidos", () => {
  const id = adicionarTransacao(db, {
    description: "Compra",
    amount: 50,
    type: "despesa",
    date: "2026-10-29",
  });

  assert.throws(
    () =>
      atualizarTransacao(db, Number(id), {
        description: "",
        amount: 100,
        type: "receita",
        date: "2026-10-29",
      }),
    /descrição não pode ficar vazia/i,
  );

  assert.equal(obterTransacaoPorId(db, Number(id)).description, "Compra");
});

test("rejeita atualização de uma transação inexistente", () => {
  assert.throws(
    () =>
      atualizarTransacao(db, 999, {
        description: "Teste",
        amount: 100,
        type: "receita",
        date: "2026-10-29",
      }),
    /transação não encontrada/i,
  );
});

test("rejeita IDs inválidos na atualização e exclusão", () => {
  for (const id of [0, -1, 1.5, "1", null, undefined]) {
    assert.throws(
      () =>
        atualizarTransacao(db, id, {
          description: "Teste",
          amount: 100,
          type: "receita",
          date: "2026-10-29",
        }),
      /ID inválido/i,
    );

    assert.throws(() => excluirTransacao(db, id), /ID inválido/i);
  }
});

test("exclui uma transação existente", () => {
  const id = adicionarTransacao(db, {
    description: "Compra para excluir",
    amount: 50,
    type: "despesa",
    date: "2026-10-29",
  });

  const resultado = excluirTransacao(db, Number(id));

  assert.equal(resultado, true);
  assert.equal(obterTransacaoPorId(db, Number(id)), null);
});

test("não exclui outras transações ao excluir uma específica", () => {
  const idExcluir = adicionarTransacao(db, {
    description: "Compra para excluir",
    amount: 50,
    type: "despesa",
    date: "2026-10-28",
  });

  adicionarTransacao(db, {
    description: "Compra que deve permanecer",
    amount: 100,
    type: "despesa",
    date: "2026-10-29",
  });

  excluirTransacao(db, Number(idExcluir));

  const transacoes = listarTransacoes(db);

  assert.equal(transacoes.length, 1);
  assert.equal(transacoes[0].description, "Compra que deve permanecer");
});

test("rejeita exclusão de uma transação inexistente", () => {
  assert.throws(() => excluirTransacao(db, 999), /transação não encontrada/i);
});

test("retorna os primeiros 10 registros da primeira página", () => {
  const transacoes = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    description: `Transação ${i + 1}`,
  }));

  const resultado = paginarTransacoes(transacoes);

  assert.equal(resultado.dados.length, 10);
  assert.equal(resultado.dados[0].id, 1);
  assert.equal(resultado.dados[9].id, 10);
  assert.equal(resultado.paginaAtual, 1);
});

test("retorna os registros corretos da segunda página", () => {
  const transacoes = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes, 2);

  assert.equal(resultado.dados.length, 10);
  assert.equal(resultado.dados[0].id, 11);
  assert.equal(resultado.dados[9].id, 20);
  assert.equal(resultado.paginaAtual, 2);
});

test("retorna apenas os registros restantes na última página", () => {
  const transacoes = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes, 3);

  assert.equal(resultado.dados.length, 5);
  assert.equal(resultado.dados[0].id, 21);
  assert.equal(resultado.dados[4].id, 25);
});

test("calcula corretamente o total de páginas", () => {
  const transacoes = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes);

  assert.equal(resultado.totalPaginas, 3);
  assert.equal(resultado.totalItens, 25);
  assert.equal(resultado.itensPorPagina, 10);
});

test("retorna uma página vazia quando não existem transações", () => {
  const resultado = paginarTransacoes([]);

  assert.deepEqual(resultado.dados, []);
  assert.equal(resultado.totalItens, 0);
  assert.equal(resultado.totalPaginas, 1);
  assert.equal(resultado.paginaAtual, 1);
});

test("funciona quando existem menos registros que o limite da página", () => {
  const transacoes = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const resultado = paginarTransacoes(transacoes);

  assert.equal(resultado.dados.length, 3);
  assert.equal(resultado.totalPaginas, 1);
});

test("permite personalizar a quantidade de itens por página", () => {
  const transacoes = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes, 1, 5);

  assert.equal(resultado.dados.length, 5);
  assert.equal(resultado.itensPorPagina, 5);
  assert.equal(resultado.totalPaginas, 3);
});

test("ajusta a página quando o número informado ultrapassa o total", () => {
  const transacoes = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes, 99);

  assert.equal(resultado.paginaAtual, 2);
  assert.equal(resultado.dados.length, 5);
  assert.equal(resultado.dados[0].id, 11);
});

test("rejeita valores que não sejam arrays de transações", () => {
  for (const transacoes of [null, undefined, {}, "teste", 123]) {
    assert.throws(
      () => paginarTransacoes(transacoes),
      /transações devem ser fornecidas em um array/i,
    );
  }
});

test("rejeita números de página inválidos", () => {
  for (const pagina of [0, -1, 1.5, "2", null, NaN, Infinity]) {
    assert.throws(() => paginarTransacoes([], pagina), /página inválida/i);
  }
});

test("rejeita quantidades inválidas de itens por página", () => {
  for (const quantidade of [0, -1, 1.5, "10", null, NaN, Infinity]) {
    assert.throws(
      () => paginarTransacoes([], 1, quantidade),
      /quantidade de itens por página inválida/i,
    );
  }
});

test("preserva a ordem original das transações", () => {
  const transacoes = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
  }));

  const resultado = paginarTransacoes(transacoes, 2, 5);

  assert.deepEqual(
    resultado.dados.map((transacao) => transacao.id),
    [6, 7, 8, 9, 10],
  );
});

test("gera CSV com cabeçalho e transações formatadas", () => {
  const transacoes = [
    {
      id: 1,
      description: "Salário",
      amount: 2500.5,
      type: "receita",
      date: "2026-10-29",
    },
    {
      id: 2,
      description: "Aluguel",
      amount: 850.75,
      type: "despesa",
      date: "2026-10-28",
    },
  ];

  const resultado = gerarCsvTransacoes(transacoes);

  assert.equal(
    resultado,
    '\uFEFF"ID";"Descrição";"Valor";"Tipo";"Data"\r\n' +
      '"1";"Salário";"2500,50";"receita";"2026-10-29"\r\n' +
      '"2";"Aluguel";"850,75";"despesa";"2026-10-28"',
  );
});

test("gera CSV com BOM UTF-8", () => {
  const resultado = gerarCsvTransacoes([]);

  assert.equal(resultado.charCodeAt(0), 0xfeff);
});

test("gera CSV mesmo quando não existem transações", () => {
  const resultado = gerarCsvTransacoes([]);

  assert.equal(resultado, '\uFEFF"ID";"Descrição";"Valor";"Tipo";"Data"');
});

test("escapa aspas e separadores na descrição", () => {
  const transacoes = [
    {
      id: 1,
      description: 'Compra de "arroz"; mercado',
      amount: 25.9,
      type: "despesa",
      date: "2026-10-29",
    },
  ];

  const resultado = gerarCsvTransacoes(transacoes);

  assert.ok(resultado.includes('"Compra de ""arroz""; mercado"'));
});

test("protege descrições que poderiam ser interpretadas como fórmulas", () => {
  const transacoes = [
    {
      id: 1,
      description: "=SOMA(A1:A10)",
      amount: 10,
      type: "despesa",
      date: "2026-10-29",
    },
  ];

  const resultado = gerarCsvTransacoes(transacoes);

  assert.ok(resultado.includes('"\'=SOMA(A1:A10)"'));
});

test("rejeita valores que não sejam arrays", () => {
  for (const transacoes of [null, undefined, {}, "teste", 123]) {
    assert.throws(
      () => gerarCsvTransacoes(transacoes),
      /transações devem ser fornecidas em um array/i,
    );
  }
});
