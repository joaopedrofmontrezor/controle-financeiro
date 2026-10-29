# 💰 Controle Financeiro

Aplicação de linha de comando para gerenciamento de finanças pessoais, desenvolvida com Node.js e SQLite. O projeto permite registrar receitas e despesas, consultar o extrato financeiro e acompanhar o saldo.

O objetivo é demonstrar conhecimentos em JavaScript, persistência de dados, organização de código, validação de entradas e testes automatizados.

## ✨ Funcionalidades

- Cadastro de receitas e despesas.
- Validação de descrição, valor, tipo e data.
- Persistência de transações em banco de dados SQLite.
- Consulta do extrato financeiro, ordenado por data.
- Cálculo do total de receitas, despesas e saldo.
- Testes automatizados com o executor nativo do Node.js.

## 🛠️ Tecnologias

- **Node.js** — execução do JavaScript no ambiente de servidor.
- **JavaScript** — implementação das regras e funcionalidades.
- **SQLite** — armazenamento local das transações.
- **better-sqlite3** — integração entre Node.js e SQLite.
- **node:test** — execução dos testes automatizados.

## 📋 Pré-requisitos

- Node.js instalado em uma versão compatível com as dependências do projeto.
- npm, instalado junto com o Node.js.

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/joaopedrofmontrezor/controle-financeiro.git
```

Entre na pasta:

```bash
cd controle-financeiro
```

Instale as dependências:

```bash
npm install
```

## ▶️ Como executar

Inicie a aplicação:

```bash
npm start
```

O sistema apresentará um menu interativo com as seguintes opções:

1. Cadastrar transação.
2. Listar transações.
3. Consultar saldo.
0. Sair.

Ao cadastrar uma transação, informe a descrição, o valor, o tipo e a data no formato `AAAA-MM-DD`.

Exemplo de transação:

```text
Descrição: Salário
Valor: 2500,00
Tipo: receita
Data: 2026-10-29
```

O banco de dados local é criado e inicializado automaticamente pelo módulo de banco de dados quando a aplicação é executada.

## 🧪 Testes automatizados

Execute os testes com:

```bash
npm test
```

Os testes utilizam o executor nativo `node:test` e um banco SQLite temporário para verificar as regras de validação, o cadastro e a listagem de transações, a ordenação do extrato e o cálculo do saldo.

O banco de testes é separado do banco de dados utilizado pela aplicação.

## 📁 Estrutura do projeto

```text
controle-financeiro/
├── test/
│   └── finance-service.test.js
├── database.js
├── finance-service.js
├── main.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## 🔒 Armazenamento de dados

As transações são armazenadas localmente no arquivo `finance.db`, gerado na pasta do projeto.

Esse arquivo contém dados financeiros locais e não deve ser publicado no repositório. Para preservar os dados existentes, mantenha uma cópia de segurança antes de realizar operações que alterem o banco.

## 🗺️ Melhorias futuras

- Edição e exclusão de transações.
- Filtros por período e categoria.
- Relatórios mensais.
- Exportação de dados para CSV.
- Interface gráfica para facilitar a utilização.
- Aprimoramento do tratamento de valores monetários.

## 👨‍💻 Autor

João Pedro Ferreira Montrezor

- GitHub: [@joaopedrofmontrezor](https://github.com/joaopedrofmontrezor)

---

Projeto desenvolvido para fins de aprendizado, prática de desenvolvimento de software e composição de portfólio profissional.