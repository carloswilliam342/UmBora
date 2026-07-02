import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

export const pool  = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASS),
    port: Number.parseInt(process.env.DB_PORT, 10),
});

pool.connect()
  .then(() => console.log('Conectado ao banco de dados...'))
  .catch(err => console.error('Falha na conexão ao DB: ', err))
  
