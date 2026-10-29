const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const db = require("./database");
const financeService = require("./finance-service");

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

let encerramentoSolicitado = false;

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fecharRecursos() {
  if (rl) {
    rl.close();
  }

  if (db.open) {
    db.close();
  }
}

rl.on("SIGINT", () => {
  encerramentoSolicitado = true;
  console.log("\nEncerrando aplicação...");
  fecharRecursos();
});

async function adicionarTransacao() {
  try {
    const description = (await rl.question("Descrição: ")).trim();

    const valorInformado = (await rl.question("Valor (ex.: 125,50): ")).trim();

    if (!/^\d+(?:[.,]\d{1,2})?$/.test(valorInformado)) {
      console.log("Erro: informe um valor válido, como 125,50.");
      return;
    }

    const amount = Number(valorInformado.replace(",", "."));

    const type = (await rl.question("Tipo (receita/despesa): ")).trim();

    const date = (await rl.question("Data (AAAA-MM-DD): ")).trim();

    const id = financeService.adicionarTransacao(db, {
      description,
      amount,
      type,
      date,
    });

    console.log(`Transação cadastrada com sucesso! ID: ${id}`);
  } catch (error) {
    if (encerramentoSolicitado) {
      return;
    }

    console.error("Erro ao cadastrar transação:", error.message);
  }
}

function listarTransacoes() {
  try {
    const transacoes = financeService.listarTransacoes(db);

    console.log("\n========== EXTRATO FINANCEIRO ==========");

    if (transacoes.length === 0) {
      console.log("Nenhuma transação cadastrada.");
      console.log("========================================");
      return;
    }

    for (const transacao of transacoes) {
      console.log(
        `ID: ${transacao.id} | ${transacao.date} | ` +
          `${transacao.type.toUpperCase()} | ` +
          `${formatarMoeda(transacao.amount)} | ` +
          `${transacao.description}`,
      );
    }

    console.log("========================================");
  } catch (error) {
    console.error("Erro ao listar transações:", error.message);
  }
}

function calcularSaldo() {
  try {
    const { receitas, despesas, saldo } =
      financeService.obterResumoFinanceiro(db);

    console.log("\n========== RESUMO FINANCEIRO ==========");
    console.log(`Receitas: ${formatarMoeda(receitas)}`);
    console.log(`Despesas: ${formatarMoeda(despesas)}`);
    console.log(`Saldo:    ${formatarMoeda(saldo)}`);
    console.log("=======================================");
  } catch (error) {
    console.error("Erro ao calcular saldo:", error.message);
  }
}

async function iniciarAplicacao() {
  console.log("\n=== CONTROLE FINANCEIRO ===");

  while (!encerramentoSolicitado) {
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
        encerramentoSolicitado = true;
        console.log("Aplicação encerrada.");
        break;

      default:
        console.log("Opção inválida. Tente novamente.");
    }
  }
}

iniciarAplicacao()
  .catch((error) => {
    if (
      encerramentoSolicitado ||
      error.name === "AbortError" ||
      error.code === "ERR_USE_AFTER_CLOSE"
    ) {
      return;
    }

    console.error("Erro inesperado na aplicação:", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    fecharRecursos();
  });
