import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

// import cors from 'cors';
// import helmet from 'helmet';

const app = express();
const saltRounds = 10;


// app.use(cors());
// app.use(helmet());
app.use(express.json());

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post('/api/register', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
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

app.post('/api/driver', async (req, res) => {
 
  const { userId, nome, cpf, cnh, veiculo } = req.body;
  const { modelo, placa, cor } = veiculo;

  if (!userId || !cnh || !modelo || !placa || !cor) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    // Inicia uma transação
    await client.query('BEGIN');

    const driverInsertResult = await client.query(
      'INSERT INTO drivers (user_id, cnh) VALUES ($1, $2) RETURNING id',
      [userId, cnh]
    );
    const newDriverId = driverInsertResult.rows[0].id;

    // 2. Insere na tabela 'vehicles' usando o ID do motorista recém-criado
    await client.query(
      'INSERT INTO vehicles (driver_id, modelo, placa, cor) VALUES ($1, $2, $3, $4)',
      [newDriverId, modelo, placa, cor]
    );

    // Confirma a transação
    await client.query('COMMIT');

    res.status(201).json({ message: 'Cadastro de motorista enviado para análise com sucesso!' });

  } catch (err) {
    // Se der algum erro, desfaz a transação
    await client.query('ROLLBACK');

    if (err.code === '23505') { // Código de erro para violação de constraint UNIQUE
      return res.status(409).json({ message: 'CPF, CNH ou Placa já cadastrados no sistema.' });
    }

    console.error('Erro no cadastro de motorista:', err);
    res.status(500).json({ message: 'Erro interno do servidor ao processar o cadastro.' });
  } finally {
    // Libera o cliente de volta para o pool
    client.release();
  }
});


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
