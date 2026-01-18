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

export default router;
