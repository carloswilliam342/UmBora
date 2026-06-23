import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';

// Importa as rotas de motorista que criamos
import driverRoutes from './routes/driverRoutes.js';
import passengerRoutes from './routes/passengerRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const saltRounds = 10;
const porta = process.env.PORT || 3000;


app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(helmet());
app.use(express.json());

// Diz ao Express para usar o arquivo de rotas para qualquer URL que comece com /api/drivers
app.use('/api/drivers', driverRoutes);
// Rotas para passageiros (criação, busca de dados)
app.use('/api/passenger', passengerRoutes);
// Rotas para corridas (buscar motoristas próximos, etc)
app.use('/api/rides', rideRoutes);
// Rotas para usuários (perfil, atualização de dados)
app.use('/api/users', userRoutes);
// Rotas de autenticação
app.use('/', authRoutes);

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 'result': result.rows, 'message': 'API online!' });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(porta, () => {
  console.log(`Servidor rodando na porta http://localhost:${porta}`);
});
