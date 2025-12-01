import express from 'express';
import { pool } from '../db.js';
// import { body, validationResult } from 'express-validator'; // Opcional, mas recomendado
// import authMiddleware from '../middleware/authMiddleware.js'; // Futuramente, para proteger a rota

const router = express.Router();

// ROTA: POST /api/drivers/apply
// Esta rota substitui a lógica que estava em /api/driver no seu server.js
router.post('/apply', async (req, res) => {
  // No futuro, o ID virá do token de autenticação (authMiddleware)
  // Por agora, vamos pegar do corpo da requisição para manter a compatibilidade
  const { userId, cnh, modelo, placa, cor } = req.body;

  if (!userId || !cnh || !modelo || !placa || !cor) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios: userId, cnh, modelo, placa, cor.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verifica se o usuário já é um motorista
    const existingDriver = await client.query('SELECT id FROM drivers WHERE user_id = $1', [userId]);
    if (existingDriver.rows.length > 0) {
      await client.query('ROLLBACK'); // Não precisa manter a transação aberta
      return res.status(409).json({ message: 'Este usuário já possui um cadastro como motorista.' });
    }

    // 2. Insere na tabela 'drivers' e obtém o ID do novo motorista
    const driverInsertResult = await client.query(
      'INSERT INTO drivers (user_id, cnh) VALUES ($1, $2) RETURNING id',
      [userId, cnh]
    );
    const newDriverId = driverInsertResult.rows[0].id;

    // 3. Insere na tabela 'vehicles' usando o ID do motorista recém-criado
    await client.query(
      'INSERT INTO vehicles (driver_id, modelo, placa, cor) VALUES ($1, $2, $3, $4)',
      [newDriverId, modelo, placa, cor]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Cadastro de motorista enviado para análise com sucesso!' });

  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') { // Erro de constraint UNIQUE
      if (err.constraint && err.constraint.includes('cnh')) {
        return res.status(409).json({ message: 'Esta CNH já está cadastrada.' });
      }
      if (err.constraint && err.constraint.includes('placa')) {
        return res.status(409).json({ message: 'Esta placa de veículo já está cadastrada.' });
      }
      return res.status(409).json({ message: 'Dados duplicados. Verifique CNH e placa do veículo.' });
    }

    console.error('Erro no cadastro de motorista:', err);
    res.status(500).json({ message: 'Erro interno do servidor ao processar o cadastro.' });
  } finally {
    client.release();
  }
});

export default router;
