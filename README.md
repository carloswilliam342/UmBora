# UmBora

##  sobre o projeto

O UmBora é uma plataforma que conecta motoristas e passageiros, facilitando a organização de caronas de forma segura e eficiente. O projeto é composto por um aplicativo móvel (frontend) desenvolvido em React Native e um serviço de backend que gerencia os dados e a lógica de negócio.

## Tecnologias Utilizadas

- **Frontend (Mobile):** React Native, Expo
- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL

## Pré-requisitos

Antes de começar, certifique-se de que você tem as seguintes ferramentas instaladas em sua máquina:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/) (versão LTS recomendada)
- [Yarn](https://classic.yarnpkg.com/en/docs/install) ou [NPM](https://www.npmjs.com/get-npm) (gerenciador de pacotes)
- [PostgreSQL](https://www.postgresql.org/download/) (banco de dados)
- [Expo Go](https://expo.dev/go) (aplicativo para celular para rodar o projeto)

## 🚀 Instalação e Execução

Siga os passos abaixo para configurar e rodar o projeto em seu ambiente local.

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/UmBora.git
cd UmBora
```

### 2. Configuração do Backend

O backend é responsável por toda a lógica de negócio e comunicação com o banco de dados.

**a. Instalar Dependências:**


npm install
# ou
yarn install
```

**b. Configurar Banco de Dados:**

1.  Abra o PostgreSQL e crie um novo banco de dados.
    ```sql
    CREATE DATABASE umbora_db;
    ```
2.  **Importante:** Você precisará executar o script SQL para criar as tabelas do projeto. (Ex: `tabelas.sql`).

**c. Variáveis de Ambiente:**

1.  Na pasta do backend, crie um arquivo chamado `.env`.
2.  Copie o conteúdo do arquivo `.env.example` (se existir) ou use o modelo abaixo e preencha com suas credenciais do PostgreSQL.

    ```env
    DB_USER=seu_usuario_postgres
    DB_HOST=localhost
    DB_NAME=umbora_db
    DB_PASS=sua_senha_postgres
    DB_PORT=5432
    ```

**d. Iniciar o Servidor Backend:**

```bash
npm start
```
O servidor estará rodando em `http://localhost:3000`.

### 3. Configuração do Frontend (Aplicativo Mobile)

O frontend é o aplicativo que será executado no seu celular.

**a. Instalar Dependências:**

```bash
# Na pasta raiz do projeto (UmBora)
npm install
# ou
yarn install
```

**b. Variáveis de Ambiente:**

1.  Na pasta raiz do projeto, crie um arquivo chamado `.env`.
2.  Adicione a seguinte linha, substituindo `SEU_IP_LOCAL` pelo endereço de IP da sua máquina na rede local (a mesma onde o backend está rodando).

    ```env
    EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000/api
    ```
    > **Dica:** No Windows, você pode encontrar seu IP local executando `ipconfig` no terminal. No Linux ou macOS, use `ifconfig` ou `ip a`.

**c. Iniciar o Aplicativo:**

```bash
npx expo start
```

Isso abrirá o Metro Bundler no seu navegador. Escaneie o QR Code exibido usando o aplicativo **Expo Go** no seu celular para abrir o UmBora.

---

Feito com ❤️ para a comunidade de desenvolvedores.
