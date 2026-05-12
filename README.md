# UmBora 🚗

O **UmBora** é uma plataforma que conecta motoristas e passageiros, facilitando a organização de caronas de forma segura e eficiente. 

Este repositório foi estruturado no formato **Monorepo**, contendo tanto o aplicativo móvel (frontend) quanto o serviço de API e banco de dados (backend) no mesmo projeto.

---

## 🛠 Tecnologias Utilizadas

- **Frontend (Mobile):** React Native, Expo, Styled-Components, React Navigation
- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL, node-postgres (pg)

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/) (versão LTS recomendada - v18 ou v20+)
- [PostgreSQL](https://www.postgresql.org/download/) (para rodar o banco de dados)
- [Expo Go](https://expo.dev/go) (aplicativo de celular para rodar e testar o app em tempo real)

---

## 🚀 Instalação e Execução (Passo a Passo)

### 1. Clonar o Repositório

Primeiro, faça o clone do repositório para a sua máquina:

```bash
git clone https://github.com/SEU_USUARIO/UmBora.git
cd UmBora
```

### 2. Instalar todas as dependências

Como o projeto é um monorepo, você pode instalar as dependências do **frontend** e do **backend** de uma só vez utilizando o script configurado na raiz do projeto:

```bash
npm run install:all
```
*(Isso vai instalar automaticamente os pacotes das pastas `backend` e `frontend`)*

---

### 3. Configuração do Backend (Banco de Dados e API)

O backend é responsável por toda a lógica de negócio e comunicação com o banco de dados.

#### a. Criar o Banco de Dados
Abra o seu PostgreSQL (pode ser pelo pgAdmin ou linha de comando `psql`) e crie o banco de dados:

```sql
CREATE DATABASE umbora_db;
```

#### b. Variáveis de Ambiente do Backend
1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie um arquivo chamado `.env` (você pode se basear no `.env.example` caso exista) e preencha com as credenciais do seu PostgreSQL:
   ```env
   DB_USER=seu_usuario_postgres
   DB_HOST=localhost
   DB_NAME=umbora_db
   DB_PASS=sua_senha_postgres
   DB_PORT=5432
   ```

#### c. Criar as Tabelas (Migrations)
Ainda na pasta `backend`, você precisará criar as tabelas do banco rodando os scripts da pasta `migrations` na ordem correta. Rode os comandos abaixo:
```bash
node migrations/00_create_core_tables.js
node migrations/create_passengers_table.js
node migrations/create_rides_table.js
node migrations/create_ride_passengers_table.js
node migrations/apply_migration.js
```
*(Alternativamente, você pode copiar o conteúdo dos arquivos `.sql` e executar diretamente no seu SGBD/pgAdmin).*

#### d. Voltar para a raiz
```bash
cd ..
```

---

### 4. Configuração do Frontend (Aplicativo Mobile)

O frontend é o aplicativo que será executado no seu celular via Expo.

#### a. Variáveis de Ambiente do Frontend
1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Crie um arquivo chamado `.env`.
3. Adicione a seguinte variável, substituindo `SEU_IP_LOCAL` pelo endereço de **IP da sua máquina** na rede local (a mesma onde o backend vai rodar):
   ```env
   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000/api
   ```
   > **Dica:** No Windows, abra o CMD e digite `ipconfig` (procure por Endereço IPv4). No Linux/Mac, use `ifconfig` ou `ip a`. Exemplo: `EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api`

#### b. Voltar para a raiz
```bash
cd ..
```

---

### 5. Rodando o Projeto 🏃‍♂️

Com tudo configurado, você precisará de **dois terminais abertos** na raiz do projeto (pasta `UmBora`).

**Terminal 1 (Iniciando a API Backend):**
```bash
npm run start:backend
```
*(O servidor estará rodando em `http://localhost:3000`)*

**Terminal 2 (Iniciando o App Frontend):**
```bash
npm run start:frontend
```
Isso abrirá o **Metro Bundler** (provavelmente no seu navegador ou terminal). 

**Para testar no celular:**
1. Certifique-se de que seu celular e seu computador estão conectados na **mesma rede Wi-Fi**.
2. Abra o aplicativo **Expo Go** no seu celular.
3. Escaneie o **QR Code** exibido no terminal. O UmBora será carregado no seu dispositivo!

---

## 💻 Scripts Disponíveis na Raiz

Para facilitar, estes são os atalhos criados no `package.json` principal:

- `npm run install:all` → Instala as dependências de todo o projeto.
- `npm run start:backend` → Inicia o servidor Node/Express usando nodemon.
- `npm run start:frontend` → Inicia o servidor do Expo para o aplicativo mobile.

---

## 🤝 Contribuindo (Membros do Grupo)

Para os membros do grupo que forem baixar o projeto, sigam rigorosamente a seção de **Pré-requisitos** e o passo a passo de **Instalação e Execução**. 
Lembrem-se de sempre conferir o IP da sua máquina na hora de configurar o `.env` do frontend!
