import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

export const createPassengerHandler = async (req, res) => {
  const { userId, cpf, cep, rua, bairro, numero } = req.body;

  if (!userId || !cpf) {
    return res.status(400).json({ message: 'ID do usuário e CPF são obrigatórios.' });
  }

  try {
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
};

export const getPassengerHandler = async (req, res) => {
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
};

router.post('/', createPassengerHandler);
router.get('/:userId', getPassengerHandler);

export default router;