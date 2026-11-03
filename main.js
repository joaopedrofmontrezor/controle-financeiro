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

function exibirTransacoes(transacoes, titulo = "EXTRATO FINANCEIRO") {
  console.log(`\n========== ${titulo} ==========`);

  if (transacoes.length === 0) {
    console.log("Nenhuma transação encontrada.");
    console.log("=".repeat(titulo.length + 22));
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

  console.log("=".repeat(titulo.length + 22));
}

async function exibirTransacoesPaginadas(
  transacoes,
  titulo = "EXTRATO FINANCEIRO",
) {
  const itensPorPagina = 10;
  let paginaAtual = 1;

  while (!encerramentoSolicitado) {
    const resultado = financeService.paginarTransacoes(
      transacoes,
      paginaAtual,
      itensPorPagina,
    );

    console.log(
      `\nPágina ${resultado.paginaAtual} de ${resultado.totalPaginas}` +
        ` | Total de registros: ${resultado.totalItens}`,
    );

    exibirTransacoes(resultado.dados, titulo);

    // Não solicita navegação quando existe apenas uma página.
    if (resultado.totalPaginas <= 1) {
      return;
    }

    console.log("\n[n] Próxima página");
    console.log("[p] Página anterior");
    console.log("[s] Sair da consulta");

    const opcao = (await rl.question("Escolha uma opção: "))
      .trim()
      .toLowerCase();

    switch (opcao) {
      case "n":
        if (paginaAtual < resultado.totalPaginas) {
          paginaAtual++;
        } else {
          console.log("Você já está na última página.");
        }
        break;

      case "p":
        if (paginaAtual > 1) {
          paginaAtual--;
        } else {
          console.log("Você já está na primeira página.");
        }
        break;

      case "s":
        return;

      default:
        console.log("Opção inválida. Use n, p ou s.");
    }
  }
}

async function listarTransacoes() {
  try {
    const transacoes = financeService.listarTransacoes(db);

    await exibirTransacoesPaginadas(transacoes, "EXTRATO FINANCEIRO");
  } catch (error) {
    if (encerramentoSolicitado) {
      return;
    }

    console.error("Erro ao listar transações:", error.message);
  }
}

async function filtrarTransacoes() {
  try {
    console.log("\n========== FILTRAR TRANSAÇÕES ==========");
    console.log("Pressione Enter para ignorar um filtro.");

    const dataInicial = (
      await rl.question("Data inicial (AAAA-MM-DD): ")
    ).trim();

    const dataFinal = (await rl.question("Data final (AAAA-MM-DD): ")).trim();

    console.log("\nTipos disponíveis:");
    console.log("1 - Receita");
    console.log("2 - Despesa");

    const opcaoTipo = (
      await rl.question("Tipo (1/2 ou Enter para todos): ")
    ).trim();

    let tipo = "";

    if (opcaoTipo === "1") {
      tipo = "receita";
    } else if (opcaoTipo === "2") {
      tipo = "despesa";
    } else if (opcaoTipo !== "") {
      console.log("Erro: opção de tipo inválida.");
      return;
    }

    const descricao = (await rl.question("Buscar por descrição: ")).trim();

    const transacoes = financeService.filtrarTransacoes(db, {
      dataInicial,
      dataFinal,
      tipo,
      descricao,
    });

    await exibirTransacoesPaginadas(transacoes, "RESULTADO DOS FILTROS");
  } catch (error) {
    if (encerramentoSolicitado) {
      return;
    }

    console.error("Erro ao filtrar transações:", error.message);
  }
}

async function editarTransacao() {
  try {
    console.log("\n========== EDITAR TRANSAÇÃO ==========");

    const idInformado = (
      await rl.question("Informe o ID da transação: ")
    ).trim();

    if (!/^\d+$/.test(idInformado)) {
      console.log("Erro: informe um ID numérico válido.");
      return;
    }

    const id = Number(idInformado);

    const transacao = financeService.obterTransacaoPorId(db, id);

    if (!transacao) {
      console.log("Transação não encontrada.");
      return;
    }

    console.log("\nDados atuais:");
    exibirTransacoes([transacao], "TRANSAÇÃO SELECIONADA");

    console.log("\nPressione Enter para manter o valor atual.");

    const descriptionInformada = (
      await rl.question(`Descrição (${transacao.description}): `)
    ).trim();

    const valorInformado = (
      await rl.question(`Valor (${formatarMoeda(transacao.amount)}): `)
    ).trim();

    let amount = transacao.amount;

    if (valorInformado !== "") {
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(valorInformado)) {
        console.log("Erro: informe um valor válido, como 125,50.");
        return;
      }

      amount = Number(valorInformado.replace(",", "."));
    }

    console.log("\nTipos disponíveis:");
    console.log("1 - Receita");
    console.log("2 - Despesa");

    const tipoInformado = (
      await rl.question(`Tipo atual (${transacao.type}): `)
    ).trim();

    let type = transacao.type;

    if (tipoInformado === "1") {
      type = "receita";
    } else if (tipoInformado === "2") {
      type = "despesa";
    } else if (tipoInformado !== "") {
      console.log("Erro: opção de tipo inválida.");
      return;
    }

    const dateInformada = (
      await rl.question(`Data (${transacao.date}): `)
    ).trim();

    const dadosAtualizados = {
      description: descriptionInformada || transacao.description,
      amount,
      type,
      date: dateInformada || transacao.date,
    };

    financeService.atualizarTransacao(db, id, dadosAtualizados);

    console.log("\nTransação atualizada com sucesso!");

    const transacaoAtualizada = financeService.obterTransacaoPorId(db, id);

    exibirTransacoes([transacaoAtualizada], "TRANSAÇÃO ATUALIZADA");
  } catch (error) {
    if (encerramentoSolicitado) {
      return;
    }

    console.error("Erro ao editar transação:", error.message);
  }
}

async function excluirTransacao() {
  try {
    console.log("\n========== EXCLUIR TRANSAÇÃO ==========");

    const idInformado = (
      await rl.question("Informe o ID da transação: ")
    ).trim();

    if (!/^\d+$/.test(idInformado)) {
      console.log("Erro: informe um ID numérico válido.");
      return;
    }

    const id = Number(idInformado);

    const transacao = financeService.obterTransacaoPorId(db, id);

    if (!transacao) {
      console.log("Transação não encontrada.");
      return;
    }

    exibirTransacoes([transacao], "TRANSAÇÃO SELECIONADA");

    const confirmacao = (
      await rl.question(
        "\nTem certeza que deseja excluir esta transação? (s/n): ",
      )
    )
      .trim()
      .toLowerCase();

    if (confirmacao !== "s") {
      console.log("Exclusão cancelada.");
      return;
    }

    financeService.excluirTransacao(db, id);

    console.log("Transação excluída com sucesso!");
  } catch (error) {
    if (encerramentoSolicitado) {
      return;
    }

    console.error("Erro ao excluir transação:", error.message);
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
4 - Filtrar transações
5 - Editar transação
6 - Excluir transação
0 - Sair
`);

    const opcao = (await rl.question("Escolha uma opção: ")).trim();

    switch (opcao) {
      case "1":
        await adicionarTransacao();
        break;

      case "2":
        await listarTransacoes();
        break;

      case "3":
        calcularSaldo();
        break;

      case "4":
        await filtrarTransacoes();
        break;

      case "5":
        await editarTransacao();
        break;

      case "6":
        await excluirTransacao();
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
