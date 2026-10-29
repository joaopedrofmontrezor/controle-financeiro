# 💰 Controle Financeiro

Aplicação de linha de comando para gerenciamento de finanças pessoais, desenvolvida com **Node.js, JavaScript e SQLite**.

O sistema permite cadastrar receitas e despesas, consultar o extrato financeiro e acompanhar o resumo das movimentações, incluindo receitas, despesas e saldo.

O projeto foi desenvolvido para praticar conceitos importantes de desenvolvimento de software, como separação de responsabilidades, validação de dados, persistência em banco de dados e testes automatizados.

## ✨ Funcionalidades

- Cadastro de receitas e despesas.
- Validação de descrição, valor, tipo e data.
- Normalização de descrições e tipos de transação.
- Persistência local utilizando SQLite.
- Consulta do extrato ordenado da data mais recente para a mais antiga.
- Cálculo dos totais de receitas, despesas e saldo.
- Suporte a valores monetários com até duas casas decimais.
- Armazenamento de valores monetários em centavos inteiros.
- Testes automatizados com o módulo nativo `node:test`.

## 🛠️ Tecnologias

- **Node.js** — ambiente de execução JavaScript.
- **JavaScript** — implementação das funcionalidades e regras de negócio.
- **SQLite** — banco de dados relacional local.
- **better-sqlite3** — integração entre Node.js e SQLite.
- **node:test** — execução dos testes automatizados.

## 📋 Pré-requisitos

Antes de começar, instale:

- Node.js 22 ou outra versão compatível com as dependências do projeto.
- npm, incluído na instalação do Node.js.
- Git, para clonar o repositório.

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/joaopedrofmontrezor/controle-financeiro.git
```

### 2. Entre na pasta do projeto

```bash
cd controle-financeiro
```

### 3. Instale as dependências

```bash
npm ci
```

Caso não tenha o arquivo `package-lock.json`, utilize `npm install`.

## ▶️ Como executar

Inicie a aplicação com:

```bash
npm start
```

O sistema apresentará um menu interativo com as seguintes opções:

```text
1 - Cadastrar transação
2 - Listar transações
3 - Consultar saldo
0 - Sair
```

Ao cadastrar uma transação, informe a descrição, o valor, o tipo e a data.

Exemplo:

```text
Descrição: Salário
Valor: 2500,00
Tipo: receita
Data: 2026-10-29
```

O valor aceita vírgula ou ponto como separador decimal, com até duas casas decimais. A data deve seguir o formato `AAAA-MM-DD`.

## 🧪 Testes automatizados

Execute a suíte de testes com:

```bash
npm test
```

Os testes utilizam o módulo nativo `node:test` e um banco SQLite temporário, isolado do banco utilizado pela aplicação.

A suíte verifica, entre outros aspectos:

- Validação de datas e dados de entrada.
- Rejeição de valores inválidos ou com mais de duas casas decimais.
- Conversão de valores para centavos inteiros.
- Cadastro e recuperação de transações.
- Ordenação do extrato.
- Cálculo de receitas, despesas e saldo.
- Tratamento de saldo negativo.
- Comportamento quando não existem transações.

**Status atual:** 18 testes automatizados passando.

## 🏗️ Arquitetura e estrutura do projeto

O projeto separa a interface de linha de comando, as regras de negócio e o acesso ao banco de dados.

```text
controle-financeiro/
├── test/
│   └── finance-service.test.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── database.js
├── finance-service.js
├── main.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

### Responsabilidade dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `main.js` | Interface de linha de comando e interação com o usuário. |
| `finance-service.js` | Validação dos dados, regras de negócio e operações financeiras. |
| `database.js` | Inicialização e configuração da conexão com o SQLite. |
| `test/finance-service.test.js` | Testes automatizados das regras de negócio e operações financeiras. |
| `.github/workflows/ci.yml` | Execução automatizada dos testes no GitHub Actions. |
| `package.json` | Dependências e scripts do projeto. |
| `package-lock.json` | Registro das versões resolvidas das dependências. |

## 💾 Armazenamento de dados

O sistema utiliza o SQLite para persistir as transações localmente no arquivo `finance.db`, criado na pasta do projeto durante a inicialização.

Os valores monetários são armazenados em **centavos inteiros**, em vez de números decimais. Por exemplo:

| Valor apresentado | Valor armazenado |
|---|---:|
| R$ 25,00 | `2500` |
| R$ 10,50 | `1050` |
| R$ 0,29 | `29` |

Essa estratégia reduz problemas de precisão em operações financeiras com números de ponto flutuante.

O banco também utiliza índices para apoiar consultas por data e tipo de transação.

> **Importante:** o arquivo `finance.db` contém os dados locais da aplicação e não deve ser enviado ao GitHub. Mantenha backups se precisar preservar suas transações.

## 🔄 Integração contínua

O projeto possui um fluxo de integração contínua com **GitHub Actions**, configurado para executar os testes automatizados em eventos de envio de código e abertura ou atualização de pull requests.

Isso ajuda a identificar regressões antes que alterações sejam incorporadas ao projeto.

## 🗺️ Melhorias futuras

- Edição e exclusão de transações.
- Filtros por período e categoria.
- Relatórios mensais.
- Exportação de dados para CSV.
- Categorias personalizadas.
- Interface gráfica.
- Melhorias adicionais na cobertura de testes.

## 👨‍💻 Autor

**João Pedro Ferreira Montrezor**

- GitHub: [@joaopedrofmontrezor](https://github.com/joaopedrofmontrezor)
- Repositório: [controle-financeiro](https://github.com/joaopedrofmontrezor/controle-financeiro)

---

Projeto desenvolvido para fins de aprendizado, prática de desenvolvimento de software e construção de portfólio profissional.
