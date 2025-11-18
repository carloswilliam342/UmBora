import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';

const app = express();
const saltRounds = 10;
const porta = process.env.PORT || 3000;


app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, phone, passwordHash]
    );

    res.status(201).json({ 
      message: 'Usuário criado com sucesso!', 
      user: newUser.rows[0] // Só retorna id, name, email
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    console.error('Erro no cadastro:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1', 
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    // Não retorna password_hash!
    res.status(200).json({ 
      message: `Bem-vindo de volta, ${user.name}!`,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/driver', async (req, res) => {
  // Extrai os dados que vêm do aplicativo
  const { userId, cpf, cnh, veiculo } = req.body;
  const { modelo, placa, cor } = veiculo; // Desestrutura o objeto veículo

  // Validação básica
  if (!userId || !cpf || !cnh || !modelo || !placa || !cor) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Tenta inserir tudo na tabela 'drivers' de uma vez só
    await pool.query(
      `INSERT INTO drivers 
       (user_id, cpf, cnh, veiculo_modelo, veiculo_placa, veiculo_cor, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'analise')`,
      [userId, cpf, cnh, modelo, placa, cor]
    );

    res.status(201).json({ message: 'Cadastro de motorista enviado para análise com sucesso!' });

  } catch (err) {
    if (err.code === '23505') { // Erro de duplicidade (Unique violation)
      return res.status(409).json({ message: 'CPF, CNH ou Placa já cadastrados.' });
    }

    console.error('Erro no cadastro de motorista:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/passenger', async (req, res) => {
  // 1. Recebendo todos os dados do corpo da requisição
  const { userId, cpf, cep, rua, bairro, numero } = req.body;

  if (!userId || !cpf) {
    return res.status(400).json({ message: 'ID do usuário e CPF são obrigatórios.' });
  }

  try {
    // 2. Atualizamos o INSERT para incluir os campos de endereço
    await pool.query(
      `INSERT INTO passengers 
       (user_id, cpf, cep, endereco_rua, endereco_bairro, endereco_numero) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, cpf, cep, rua, bairro, numero]
    );

    res.status(201).json({ message: 'Passageiro cadastrado com sucesso!' });

  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'CPF ou Usuário já cadastrados.' });
    }
    console.error('Erro no cadastro de passageiro:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`);
});
