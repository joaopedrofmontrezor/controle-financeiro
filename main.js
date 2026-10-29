
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const db = require("./database");

const rl = readline.createInterface({ input: stdin, output: stdout });

function validarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const dataConvertida = new Date(`${data}T00:00:00.000Z`);

  return (
    !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data
  );
}

async function adicionarTransacao() {
  const description = (
    await rl.question("Descrição: ")
  ).trim();

  if (!description) {
    console.log("Erro: a descrição não pode ficar vazia.");
    return;
  }

  const valorInformado = (
    await rl.question("Valor (ex.: 125,50): ")
  ).trim();

  const amount = Number(valorInformado.replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    console.log("Erro: informe um valor numérico maior que zero.");
    return;
  }

  const type = (
    await rl.question("Tipo (receita/despesa): ")
  ).trim().toLowerCase();

  if (!["receita", "despesa"].includes(type)) {
    console.log("Erro: tipo inválido.");
    return;
  }

  const date = (
    await rl.question("Data (AAAA-MM-DD): ")
  ).trim();

  if (!validarData(date)) {
    console.log("Erro: informe uma data válida no formato AAAA-MM-DD.");
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (description, amount, type, date)
      VALUES (?, ?, ?, ?)
    `);

    const resultado = stmt.run(description, amount, type, date);

    console.log(
      `Transação cadastrada com sucesso! ID: ${resultado.lastInsertRowid}`
    );
  } catch (error) {
    console.error("Erro ao cadastrar transação:", error.message);
  }
}

function listarTransacoes() {
  try {
    const transacoes = db.prepare(`
      SELECT id, description, amount, type, date
      FROM transactions
      ORDER BY date DESC, id DESC
    `).all();

    console.log("\n========== EXTRATO FINANCEIRO ==========");

    if (transacoes.length === 0) {
      console.log("Nenhuma transação cadastrada.");
      return;
    }

    for (const transacao of transacoes) {
      const tipo = transacao.type.toUpperCase();
      const valor = transacao.amount.toFixed(2).replace(".", ",");

      console.log(
        `ID: ${transacao.id} | ${transacao.date} | ` +
        `${tipo} | R$ ${valor} | ${transacao.description}`
      );
    }

    console.log("========================================");
  } catch (error) {
    console.error("Erro ao listar transações:", error.message);
  }
}

function calcularSaldo() {
  try {
    const resultado = db.prepare(`
      SELECT
        COALESCE(SUM(
          CASE WHEN type = 'receita' THEN amount ELSE 0 END
        ), 0) AS receitas,
        COALESCE(SUM(
          CASE WHEN type = 'despesa' THEN amount ELSE 0 END
        ), 0) AS despesas
      FROM transactions
    `).get();

    const saldo = resultado.receitas - resultado.despesas;

    const formatarMoeda = (valor) =>
      valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

    console.log("\n========== RESUMO FINANCEIRO ==========");
    console.log(`Receitas: ${formatarMoeda(resultado.receitas)}`);
    console.log(`Despesas: ${formatarMoeda(resultado.despesas)}`);
    console.log(`Saldo:    ${formatarMoeda(saldo)}`);
    console.log("=======================================");
  } catch (error) {
    console.error("Erro ao calcular saldo:", error.message);
  }
}

async function iniciarAplicacao() {
  let executando = true;

  console.log("\n=== CONTROLE FINANCEIRO ===");

  while (executando) {
    console.log(`
    1 - Cadastrar transação
    2 - Listar transações
    3 - Consultar saldo
    0 - Sair
  `);

    const opcao = (await rl.question("Escolha uma opção: ")).trim();

    switch (opcao) {
      case "1":
        await adicionarTransacao();
        break;

      case "2":
        listarTransacoes();
        break;

      case "3":
        calcularSaldo();
        break;

      case "0":
        executando = false;
        console.log("Aplicação encerrada.");
        break;

      default:
        console.log("Opção inválida. Tente novamente.");
    }
  }
}

iniciarAplicacao()
  .catch((error) => {
    console.error("Erro inesperado na aplicação:", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
    db.close();
  });
