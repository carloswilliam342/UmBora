import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/rides/nearby
 * Busca motoristas disponíveis próximos à localização do passageiro
 * Query params: lat (latitude), lng (longitude), radius (raio em km, opcional, padrão 5km)
 */
router.get('/nearby', async (req, res) => {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            message: 'Latitude e longitude são obrigatórias.'
        });
    }

    try {
        // Converter para números
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        // Query para buscar motoristas próximos usando a fórmula de Haversine
        // Usa subquery para permitir filtrar pela distância calculada
        const query = `
      SELECT * FROM (
        SELECT 
          d.id,
          u.name,
          v.modelo as vehicle_model,
          v.placa as vehicle_plate,
          v.cor as vehicle_color,
          d.current_latitude,
          d.current_longitude,
          d.is_available,
          d.rating,
          (
            6371 * acos(
              cos(radians($1)) * 
              cos(radians(d.current_latitude)) * 
              cos(radians(d.current_longitude) - radians($2)) + 
              sin(radians($1)) * 
              sin(radians(d.current_latitude))
            )
          ) AS distance_km
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN vehicles v ON v.driver_id = d.id
        WHERE d.is_available = true
          AND d.current_latitude IS NOT NULL
          AND d.current_longitude IS NOT NULL
      ) AS nearby_drivers
      WHERE distance_km <= $3
      ORDER BY distance_km ASC
      LIMIT 20
    `;

        const result = await pool.query(query, [latitude, longitude, radiusKm]);

        // Formatar resposta
        const drivers = result.rows.map(driver => ({
            id: driver.id,
            name: driver.name,
            vehicle: {
                model: driver.vehicle_model,
                plate: driver.vehicle_plate,
                color: driver.vehicle_color,
            },
            location: {
                latitude: parseFloat(driver.current_latitude),
                longitude: parseFloat(driver.current_longitude),
            },
            rating: driver.rating || 0,
            distance: parseFloat(driver.distance_km).toFixed(2),
        }));

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers,
        });

    } catch (err) {
        console.error('Erro ao buscar motoristas próximos:', err);
        res.status(500).json({
            message: 'Erro interno do servidor.',
            error: err.message
        });
    }
});

/**
 * POST /api/rides/create
 * Cadastrar nova carona
 */
router.post('/create', async (req, res) => {
    const {
        driverId,
        origin,
        destination,
        departureTime,
        availableSeats,
        pricePerSeat = 0
    } = req.body;

    // Validações
    if (!driverId || !origin || !destination || !departureTime || !availableSeats) {
        return res.status(400).json({
            message: 'Campos obrigatórios: driverId, origin, destination, departureTime, availableSeats'
        });
    }

    if (!origin.address || !origin.latitude || !origin.longitude) {
        return res.status(400).json({ message: 'Origem incompleta' });
    }

    if (!destination.address || !destination.latitude || !destination.longitude) {
        return res.status(400).json({ message: 'Destino incompleto' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO rides (
        driver_id, origin_address, origin_latitude, origin_longitude,
        destination_address, destination_latitude, destination_longitude,
        departure_time, available_seats, price_per_seat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
            [
                driverId,
                origin.address, origin.latitude, origin.longitude,
                destination.address, destination.latitude, destination.longitude,
                departureTime,
                availableSeats,
                pricePerSeat
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Carona cadastrada com sucesso!',
            rideId: result.rows[0].id
        });
    } catch (err) {
        console.error('Erro ao cadastrar carona:', err);
        res.status(500).json({ message: 'Erro ao cadastrar carona', error: err.message });
    }
});

/**
 * GET /api/rides/driver/:driverId
 * Listar caronas de um motorista
 */
router.get('/driver/:driverId', async (req, res) => {
    const { driverId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
        r.*,
        u.name as driver_name,
        v.modelo as vehicle_model,
        v.placa as vehicle_plate,
        d.rating as driver_rating
      FROM rides r
      INNER JOIN drivers d ON r.driver_id = d.id
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      WHERE r.driver_id = $1
      ORDER BY r.departure_time DESC`,
            [driverId]
        );

        const rides = result.rows.map(ride => ({
            id: ride.id,
            origin: {
                address: ride.origin_address,
                latitude: parseFloat(ride.origin_latitude),
                longitude: parseFloat(ride.origin_longitude)
            },
            destination: {
                address: ride.destination_address,
                latitude: parseFloat(ride.destination_latitude),
                longitude: parseFloat(ride.destination_longitude)
            },
            departureTime: ride.departure_time,
            availableSeats: ride.available_seats,
            pricePerSeat: parseFloat(ride.price_per_seat),
            status: ride.status,
            createdAt: ride.created_at
        }));

        res.status(200).json({ success: true, rides });
    } catch (err) {
        console.error('Erro ao listar caronas:', err);
        res.status(500).json({ message: 'Erro ao listar caronas', error: err.message });
    }
});

/**
 * GET /api/rides/available
 * Buscar caronas disponíveis próximas
 */
router.get('/available', async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude e longitude são obrigatórias' });
    }

    try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        const query = `
      SELECT * FROM (
        SELECT 
          r.*,
          u.name as driver_name,
          v.modelo as vehicle_model,
          v.placa as vehicle_plate,
          v.cor as vehicle_color,
          d.rating as driver_rating,
          (
            6371 * acos(
              cos(radians($1)) * 
              cos(radians(r.origin_latitude)) * 
              cos(radians(r.origin_longitude) - radians($2)) + 
              sin(radians($1)) * 
              sin(radians(r.origin_latitude))
            )
          ) AS distance_km
        FROM rides r
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN vehicles v ON v.driver_id = d.id
        WHERE r.status = 'available'
          AND r.departure_time > NOW()
      ) AS nearby_rides
      WHERE distance_km <= $3
      ORDER BY distance_km ASC, departure_time ASC
      LIMIT 20
    `;

        const result = await pool.query(query, [latitude, longitude, radiusKm]);

        const rides = result.rows.map(ride => ({
            id: ride.id,
            driver: {
                name: ride.driver_name,
                rating: ride.driver_rating,
                vehicle: {
                    model: ride.vehicle_model,
                    plate: ride.vehicle_plate,
                    color: ride.vehicle_color
                }
            },
            origin: {
                address: ride.origin_address,
                latitude: parseFloat(ride.origin_latitude),
                longitude: parseFloat(ride.origin_longitude)
            },
            destination: {
                address: ride.destination_address,
                latitude: parseFloat(ride.destination_latitude),
                longitude: parseFloat(ride.destination_longitude)
            },
            departureTime: ride.departure_time,
            availableSeats: ride.available_seats,
            pricePerSeat: parseFloat(ride.price_per_seat),
            distance: parseFloat(ride.distance_km).toFixed(2)
        }));

        res.status(200).json({ success: true, count: rides.length, rides });
    } catch (err) {
        console.error('Erro ao buscar caronas disponíveis:', err);
        res.status(500).json({ message: 'Erro ao buscar caronas', error: err.message });
    }
});

/**
 * PUT /api/rides/:rideId
 * Atualizar carona
 */
router.put('/:rideId', async (req, res) => {
    const { rideId } = req.params;
    const updates = req.body;

    try {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (updates.departureTime) {
            fields.push(`departure_time = $${paramIndex++}`);
            values.push(updates.departureTime);
        }
        if (updates.availableSeats !== undefined) {
            fields.push(`available_seats = $${paramIndex++}`);
            values.push(updates.availableSeats);
        }
        if (updates.pricePerSeat !== undefined) {
            fields.push(`price_per_seat = $${paramIndex++}`);
            values.push(updates.pricePerSeat);
        }
        if (updates.status) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'Nenhum campo para atualizar' });
        }

        // Adicionar updated_at (sem parâmetro, usa CURRENT_TIMESTAMP)
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        // Adicionar rideId como último parâmetro
        values.push(rideId);

        const query = `UPDATE rides SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

        console.log('Query:', query);
        console.log('Values:', values);

        const result = await pool.query(query, values);

        console.log('Linhas afetadas:', result.rowCount);

        res.status(200).json({
            success: true,
            message: 'Carona atualizada com sucesso',
            rowsAffected: result.rowCount
        });
    } catch (err) {
        console.error('Erro ao atualizar carona:', err);
        res.status(500).json({ message: 'Erro ao atualizar carona', error: err.message });
    }
});

/**
 * DELETE /api/rides/:rideId
 * Cancelar carona
 */
router.delete('/:rideId', async (req, res) => {
    const { rideId } = req.params;

    try {
        await pool.query(
            `UPDATE rides SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [rideId]
        );

        res.status(200).json({ success: true, message: 'Carona cancelada com sucesso' });
    } catch (err) {
        console.error('Erro ao cancelar carona:', err);
        res.status(500).json({ message: 'Erro ao cancelar carona', error: err.message });
    }
});

export default router;
