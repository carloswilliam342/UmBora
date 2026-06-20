import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// ROTA: POST /api/drivers/apply
// Cadastrar novo motorista com localização e disponibilidade
export const applyDriverHandler = async (req, res) => {
  const {
    userId,
    cnh,
    modelo,
    placa,
    cor,
    current_latitude,    // NOVO: localização opcional
    current_longitude,   // NOVO: localização opcional
    is_available = false // NOVO: disponibilidade (padrão: false)
  } = req.body;

  if (!userId || !cnh || !modelo || !placa || !cor) {
    return res.status(400).json({
      message: 'Campos obrigatórios: userId, cnh, modelo, placa, cor.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verifica se o usuário já é um motorista
    const existingDriver = await client.query(
      'SELECT id FROM drivers WHERE user_id = $1',
      [userId]
    );

    if (existingDriver.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'Este usuário já possui um cadastro como motorista.'
      });
    }

    // 2. Insere na tabela 'drivers' com localização e disponibilidade
    const driverInsertResult = await client.query(
      `INSERT INTO drivers 
       (user_id, cnh, current_latitude, current_longitude, is_available, rating) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [userId, cnh, current_latitude, current_longitude, is_available, 0.00]
    );
    const newDriverId = driverInsertResult.rows[0].id;

    // 3. Insere na tabela 'vehicles'
    await client.query(
      'INSERT INTO vehicles (driver_id, modelo, placa, cor) VALUES ($1, $2, $3, $4)',
      [newDriverId, modelo, placa, cor]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Cadastro de motorista enviado para análise com sucesso!',
      driverId: newDriverId
    });

  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') {
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
};

// ROTA: GET /api/drivers/profile/:userId
// Buscar dados do motorista por userId
export const getDriverProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        d.id,
        d.user_id,
        d.cnh,
        d.current_latitude,
        d.current_longitude,
        d.is_available,
        d.rating,
        d.status,
        d.created_at,
        u.name,
        u.email,
        v.id as vehicle_id,
        v.modelo,
        v.placa,
        v.cor
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      WHERE d.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Motorista não encontrado.',
        isDriver: false
      });
    }

    const driver = result.rows[0];

    res.status(200).json({
      isDriver: true,
      driver: {
        id: driver.id,
        userId: driver.user_id,
        name: driver.name,
        email: driver.email,
        cnh: driver.cnh,
        location: driver.current_latitude && driver.current_longitude ? {
          latitude: parseFloat(driver.current_latitude),
          longitude: parseFloat(driver.current_longitude)
        } : null,
        isAvailable: driver.is_available,
        rating: driver.rating,
        status: driver.status,
        vehicle: {
          id: driver.vehicle_id,
          modelo: driver.modelo,
          placa: driver.placa,
          cor: driver.cor
        },
        createdAt: driver.created_at
      }
    });

  } catch (err) {
    console.error('Erro ao buscar perfil do motorista:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ROTA: PUT /api/drivers/profile/:userId
// Atualizar dados do motorista
router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const {
    current_latitude,
    current_longitude,
    is_available,
    modelo,
    placa,
    cor
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar se o motorista existe
    const driverResult = await client.query(
      'SELECT id FROM drivers WHERE user_id = $1',
      [userId]
    );

    if (driverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Motorista não encontrado.' });
    }

    const driverId = driverResult.rows[0].id;

    // 2. Atualizar dados do motorista (localização e disponibilidade)
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (current_latitude !== undefined) {
      updateFields.push(`current_latitude = $${paramIndex++}`);
      updateValues.push(current_latitude);
    }
    if (current_longitude !== undefined) {
      updateFields.push(`current_longitude = $${paramIndex++}`);
      updateValues.push(current_longitude);
    }
    if (is_available !== undefined) {
      updateFields.push(`is_available = $${paramIndex++}`);
      updateValues.push(is_available);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await client.query(
        `UPDATE drivers SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`,
        updateValues
      );
    }

    // 3. Atualizar dados do veículo (se fornecidos)
    const vehicleUpdateFields = [];
    const vehicleUpdateValues = [];
    let vehicleParamIndex = 1;

    if (modelo) {
      vehicleUpdateFields.push(`modelo = $${vehicleParamIndex++}`);
      vehicleUpdateValues.push(modelo);
    }
    if (placa) {
      vehicleUpdateFields.push(`placa = $${vehicleParamIndex++}`);
      vehicleUpdateValues.push(placa);
    }
    if (cor) {
      vehicleUpdateFields.push(`cor = $${vehicleParamIndex++}`);
      vehicleUpdateValues.push(cor);
    }

    if (vehicleUpdateFields.length > 0) {
      vehicleUpdateValues.push(driverId);
      await client.query(
        `UPDATE vehicles SET ${vehicleUpdateFields.join(', ')} WHERE driver_id = $${vehicleParamIndex}`,
        vehicleUpdateValues
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Dados do motorista atualizados com sucesso!'
    });

  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505' && err.constraint && err.constraint.includes('placa')) {
      return res.status(409).json({ message: 'Esta placa de veículo já está cadastrada.' });
    }

    console.error('Erro ao atualizar perfil do motorista:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
});

router.post('/apply', applyDriverHandler);
router.get('/profile/:userId', getDriverProfile);

export default router;