# 💰 Controle Financeiro

Aplicação de linha de comando para gerenciamento de finanças pessoais, desenvolvida com **Node.js, JavaScript e SQLite**.

O sistema permite cadastrar, consultar, filtrar, editar e excluir receitas e despesas, acompanhar indicadores financeiros por meio de um dashboard no terminal e exportar movimentações para arquivos CSV.

O projeto foi desenvolvido com foco em boas práticas de engenharia de software, incluindo separação de responsabilidades, validação de dados, persistência em banco de dados, tratamento de erros, testes automatizados e integração contínua.

## ✨ Funcionalidades

### Gerenciamento de transações
- Cadastro de receitas e despesas.
- Listagem do extrato financeiro, ordenado da movimentação mais recente para a mais antiga.
- Paginação do extrato, com navegação entre páginas.
- Edição de transações existentes por ID.
- Exclusão de transações com confirmação.
- Consulta de transações individuais.

### Filtros
- Filtro por data inicial.
- Filtro por data final.
- Filtro por tipo de transação: receita ou despesa.
- Busca por descrição.
- Combinação de diferentes filtros em uma única consulta.

### Dashboard financeiro
- Total de receitas.
- Total de despesas.
- Saldo atual.
- Quantidade de receitas e despesas.
- Maior receita registrada.
- Maior despesa registrada.
- Percentual de despesas em relação às receitas.

### Exportação de dados
- Exportação de todas as transações para CSV.
- Exportação de transações utilizando filtros.
- Cabeçalhos em português.
- Formatação de valores monetários.
- Compatibilidade com Excel, incluindo BOM UTF-8.
- Proteção contra fórmulas maliciosas em campos exportados.

### Validações e segurança
- Validação de descrição, valor, tipo e data.
- Verificação de datas reais no formato `AAAA-MM-DD`.
- Aceitação de vírgula ou ponto como separador decimal.
- Limitação de valores a duas casas decimais.
- Normalização de descrições e tipos de transação.
- Utilização de consultas parametrizadas para operações no SQLite.
- Armazenamento de valores monetários em centavos inteiros.

## 🛠️ Tecnologias

| Tecnologia | Utilização |
|---|---|
| **Node.js** | Ambiente de execução JavaScript. |
| **JavaScript** | Implementação das funcionalidades e regras de negócio. |
| **SQLite** | Banco de dados relacional local. |
| **better-sqlite3** | Integração entre Node.js e SQLite. |
| **node:test** | Execução dos testes automatizados. |
| **Git e GitHub** | Versionamento e hospedagem do código. |
| **GitHub Actions** | Integração contínua e execução automatizada dos testes. |

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

Caso não tenha o arquivo `package-lock.json`, utilize:

```bash
npm install
```

## ▶️ Como executar

Inicie a aplicação:

```bash
npm start
```

O sistema apresentará um menu interativo com as seguintes opções:

```text
1 - Cadastrar transação
2 - Listar transações
3 - Consultar saldo
4 - Filtrar transações
5 - Editar transação
6 - Excluir transação
7 - Exportar transações para CSV
0 - Sair
```

### Exemplo de cadastro

```text
Descrição: Salário
Valor: 2500,00
Tipo: receita
Data: 2026-10-29
```

O valor aceita vírgula ou ponto como separador decimal, com até duas casas decimais.

A data deve seguir o formato `AAAA-MM-DD`.

## 📊 Dashboard financeiro

A opção de consulta de saldo apresenta um painel com os principais indicadores financeiros:

```text
========== DASHBOARD FINANCEIRO ==========

RESUMO GERAL
------------------------------------------
Total de receitas:       R$ 5.000,00
Total de despesas:       R$ 2.300,00
Saldo atual:             R$ 2.700,00

ESTATÍSTICAS
------------------------------------------
Quantidade de receitas:  12
Quantidade de despesas:  8
Maior receita:            R$ 2.500,00
Maior despesa:            R$ 800,00

INDICADORES
------------------------------------------
Despesas sobre receitas: 46,00%

==========================================
```

*Os valores apresentados são ilustrativos.*

## 📄 Exportação CSV

O sistema permite exportar as transações cadastradas para arquivos CSV.

Existem duas modalidades:

- **Exportar todas as transações:** gera um arquivo com todas as movimentações registradas.
- **Exportar transações com filtros:** permite selecionar um período, tipo de transação e descrição antes da exportação.

Os arquivos são gerados no diretório `exports/`, criado automaticamente quando necessário.

O CSV utiliza ponto e vírgula como separador de campos, valores monetários com vírgula decimal e codificação UTF-8 com BOM para facilitar a abertura no Excel.

## 🧪 Testes automatizados

Execute a suíte de testes com:

```bash
npm test
```

Os testes utilizam o módulo nativo `node:test` e um banco SQLite temporário, isolado do banco utilizado pela aplicação.

A suíte contempla testes relacionados a:

- Validação de datas e dados de entrada.
- Rejeição de valores inválidos ou com mais de duas casas decimais.
- Conversão de valores monetários para centavos inteiros.
- Cadastro e recuperação de transações.
- Ordenação do extrato.
- Paginação e navegação entre páginas.
- Filtragem por diferentes critérios.
- Edição e exclusão de transações.
- Cálculo de receitas, despesas e saldo.
- Indicadores do dashboard financeiro.
- Geração e formatação de arquivos CSV.
- Proteção contra injeção de fórmulas em arquivos exportados.
- Tratamento de cenários sem transações cadastradas.

## 🏗️ Arquitetura e estrutura do projeto

O projeto utiliza uma organização que separa a interface de linha de comando, as regras de negócio e o acesso ao banco de dados.

```text
controle-financeiro/
├── .github/
│   └── workflows/
│       └── ci.yml
├── test/
│   └── finance-service.test.js
├── exports/
│   └── arquivos CSV gerados localmente
├── database.js
├── finance-service.js
├── main.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

### Responsabilidade dos arquivos

| Arquivo ou diretório | Responsabilidade |
|---|---|
| `main.js` | Interface de linha de comando e interação com o usuário. |
| `finance-service.js` | Validação dos dados, regras de negócio e operações financeiras. |
| `database.js` | Inicialização e configuração da conexão com o SQLite. |
| `test/finance-service.test.js` | Testes automatizados das regras de negócio e operações financeiras. |
| `.github/workflows/ci.yml` | Execução automatizada dos testes no GitHub Actions. |
| `package.json` | Dependências e scripts do projeto. |
| `package-lock.json` | Registro das versões resolvidas das dependências. |
| `exports/` | Armazenamento local dos arquivos CSV gerados pela aplicação. |

## 💾 Armazenamento de dados

O sistema utiliza SQLite para persistir as transações localmente no arquivo `finance.db`, criado na pasta do projeto durante a inicialização.

Os valores monetários são armazenados em **centavos inteiros**, em vez de números decimais.

Exemplos:

| Valor apresentado | Valor armazenado |
|---|---:|
| R$ 25,00 | `2500` |
| R$ 10,50 | `1050` |
| R$ 0,29 | `29` |

Essa estratégia reduz problemas de precisão em operações financeiras com números de ponto flutuante.

O banco também utiliza índices para apoiar consultas por data e tipo de transação.

> **Importante:** os arquivos `finance.db` e `exports/` contêm dados locais da aplicação e não devem ser enviados ao GitHub. Mantenha backups caso precise preservar suas movimentações.

## 🔄 Integração contínua

O projeto possui um fluxo de integração contínua com **GitHub Actions**.

O pipeline executa os testes automatizados em eventos de envio de código e abertura ou atualização de pull requests, ajudando a identificar regressões antes da incorporação de alterações ao projeto.

## 🗺️ Melhorias futuras

- Relatórios financeiros mensais.
- Comparação de receitas e despesas entre períodos.
- Evolução financeira ao longo dos meses.
- Categorias personalizadas para transações.
- Exportação para planilhas XLSX.
- Interface gráfica para gerenciamento financeiro.
- Melhorias adicionais na cobertura de testes.

## 👨‍💻 Autor

**João Pedro Ferreira Montrezor**

- GitHub: [@joaopedrofmontrezor](https://github.com/joaopedrofmontrezor)
- Repositório: [controle-financeiro](https://github.com/joaopedrofmontrezor/controle-financeiro)

---

Projeto desenvolvido para fins de aprendizado, prática de desenvolvimento de software e construção de portfólio profissional.
