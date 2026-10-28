# 💰 Sistema de Controle Financeiro (CLI)

> Um sistema de controle financeiro robusto baseado em linha de comando (CLI), desenvolvido em Node.js e SQLite para o gerenciamento eficiente de receitas, despesas e saldo mensal em tempo real.

---

## 🚀 Funcionalidades

- **Cadastro de Transações:** Registre receitas e despesas informando descrição, valor, tipo e data de forma validada.
- **Extrato Detalhado:** Visualize todas as movimentações financeiras ordenadas da mais recente para a mais antiga, com identificadores visuais para receitas e despesas.
- **Cálculo de Saldo Automatizado:** Consulta instantânea ao banco de dados para calcular o total de receitas, total de despesas e o saldo líquido atualizado.
- **Persistência Local (SQLite):** Utiliza um banco de dados relacional leve e integrado (`better-sqlite3`), garantindo que seus dados fiquem seguros localmente sem necessidade de servidores externos.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** (Ambiente de execução JavaScript backend)
- **SQLite3 / `better-sqlite3`** (Banco de dados relacional rápido e síncrono)
- **JavaScript (ES6+)** (Lógica de negócios e manipulação de dados)

---

## 📦 Como Instalar e Executar

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU-USUARIO/controle-financeiro-node.git](https://github.com/SEU-USUARIO/controle-financeiro-node.git)
   cd controle-financeiro-node

2. **Instale as dependências:**

```bash
    npm install
```

3. **Execute a aplicação:**

```bash
    node main.js   
```    

## 🗂️ Estrutura do Projeto

```

controle-financeiro-node/
│
├── database.js        # Configuração da conexão SQLite e criação do schema da tabela
├── main.js            # Lógica principal (cadastro, listagem de extrato e cálculo de saldo)
├── finance.db         # Banco de dados local SQLite (gerado automaticamente)
├── .gitignore         # Arquivos e pastas ignorados pelo Git (node_modules, finance.db)
├── package.json       # Configurações e dependências do projeto Node.js
└── README.md          # Documentação oficial do projeto

```