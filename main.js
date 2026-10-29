const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const db = require("./database");
const financeService = require("./finance-service");

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

async function adicionarTransacao() {
  try {
    const description = await rl.question("Descrição: ");

    const valorInformado = (await rl.question("Valor (ex.: 125,50): ")).trim();

    if (!/^\d+(?:[.,]\d{1,2})?$/.test(valorInformado)) {
      console.log("Erro: informe um valor válido, como 125,50.");
      return;
    }

    const amount = Number(valorInformado.replace(",", "."));

    const type = await rl.question("Tipo (receita/despesa): ");

    const date = await rl.question("Data (AAAA-MM-DD): ");

    const id = financeService.adicionarTransacao(db, {
      description,
      amount,
      type,
      date,
    });

    console.log(`Transação cadastrada com sucesso! ID: ${id}`);
  } catch (error) {
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
      const tipo = transacao.type.toUpperCase();
      const valor = transacao.amount.toFixed(2).replace(".", ",");

      console.log(
        `ID: ${transacao.id} | ${transacao.date} | ` +
          `${tipo} | R$ ${valor} | ${transacao.description}`,
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

    const formatarMoeda = (valor) =>
      valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

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

  let executando = true;

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

    if (db.open) {
      db.close();
    }
  });
