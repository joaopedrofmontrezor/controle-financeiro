const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  validarData,
  validarTransacao,
  adicionarTransacao,
  listarTransacoes,
  obterResumoFinanceiro,
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
      amount REAL NOT NULL,
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

  assert.deepEqual(resultado, {
    description: "Salário",
    amount: 2500,
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

  assert.deepEqual(obterResumoFinanceiro(db), {
    receitas: 2300,
    despesas: 750,
    saldo: 1550,
  });
});

test("retorna valores zerados quando não há transações", () => {
  assert.deepEqual(obterResumoFinanceiro(db), {
    receitas: 0,
    despesas: 0,
    saldo: 0,
  });
});

test("normaliza descrição e tipo da transação", () => {
  const resultado = validarTransacao({
    description: "  Salário mensal  ",
    amount: 2500,
    type: "RECEITA",
    date: "2026-10-29"
  });

  assert.equal(resultado.description, "Salário mensal");
  assert.equal(resultado.type, "receita");
});

test("rejeita valores com mais de duas casas decimais", () => {
  assert.throws(
    () => validarTransacao({
      description: "Compra",
      amount: 10.123,
      type: "despesa",
      date: "2026-10-29"
    }),
    /duas casas decimais/i
  );
});

test("ordena o extrato da data mais recente para a mais antiga", () => {
  adicionarTransacao(db, {
    description: "Compra antiga",
    amount: 20,
    type: "despesa",
    date: "2026-10-20"
  });

  adicionarTransacao(db, {
    description: "Compra recente",
    amount: 30,
    type: "despesa",
    date: "2026-10-28"
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
    date: "2026-10-29"
  });

  adicionarTransacao(db, {
    description: "Conta",
    amount: 180,
    type: "despesa",
    date: "2026-10-29"
  });

  const resumo = obterResumoFinanceiro(db);

  assert.equal(resumo.receitas, 100);
  assert.equal(resumo.despesas, 180);
  assert.equal(resumo.saldo, -80);
});
