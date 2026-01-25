import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';

// Importa as rotas de motorista que criamos
import driverRoutes from './routes/driverRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const saltRounds = 10;
const porta = process.env.PORT || 3000;


app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(helmet());
app.use(express.json());

// Diz ao Express para usar o arquivo de rotas para qualquer URL que comece com /api/drivers
app.use('/api/drivers', driverRoutes);
// Rotas para corridas (buscar motoristas próximos, etc)
app.use('/api/rides', rideRoutes);
// Rotas para usuários (perfil, atualização de dados)
app.use('/api/users', userRoutes);

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 'result': result.rows, 'message': 'API online!' });

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

// A rota /api/driver foi movida para /routes/driverRoutes.js e agora é acessada via /api/drivers/apply
// A rota /api/passenger pode ser movida para seu próprio arquivo também (ex: /routes/passengerRoutes.js)

app.post('/api/passenger', async (req, res) => {
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

// Buscar dados do passageiro pelo userId
app.get('/api/passenger/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, user_id, cpf FROM passengers WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Passageiro não encontrado.' });
    }

    res.status(200).json({
      success: true,
      passenger: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao buscar passageiro:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.listen(porta, () => {
  console.log(`Servidor rodando na porta http://localhost:${porta}`);
});
