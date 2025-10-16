import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';

const app  = express();
const saltRounds = 10; // Fator de custo para o hash da senha

// Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

app.get('/api/test', async (req, res) => {
  try{
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  }catch(err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Rota de Cadastro (Register)
app.post('/api/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validação básica
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    // Criptografa a senha antes de salvar
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, phone, passwordHash]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso!', user: newUser.rows[0] });
  } catch (err) {
    // Código '23505' é erro de violação de unicidade (e-mail duplicado) no PostgreSQL
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    console.error('Erro no cadastro:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // 1. Buscar o usuário pelo e-mail
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = userResult.rows[0];

    // 2. Comparar a senha enviada com o hash salvo no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    // 3. Login bem-sucedido
    res.status(200).json({ message: `Bem-vindo de volta, ${user.name}!`, userId: user.id });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
})