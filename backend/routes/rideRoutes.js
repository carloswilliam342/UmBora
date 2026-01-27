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
 * Buscar caronas disponíveis com busca inteligente (coordenadas + texto)
 */
router.get('/available', async (req, res) => {
    const { lat, lng, radius = 50, searchText = '' } = req.query; // String vazia como padrão

    if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude e longitude são obrigatórias' });
    }

    try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        const searchTerm = searchText || ''; // Garantir que sempre seja string

        console.log('=== BUSCA DE CARONAS ===');
        console.log('Coordenadas:', { latitude, longitude });
        console.log('Raio:', radiusKm, 'km');
        console.log('Texto de busca:', searchTerm || 'N/A');

        // Query híbrida: busca por distância + busca textual
        const query = `
      SELECT * FROM (
        SELECT 
          r.*,
          u.name as driver_name,
          v.modelo as vehicle_model,
          v.placa as vehicle_plate,
          v.cor as vehicle_color,
          d.rating as driver_rating,
          COALESCE((SELECT SUM(number_of_passengers) FROM ride_passengers rp WHERE rp.ride_id = r.id AND rp.status = 'pending'), 0) as pending_seats,
          COALESCE((SELECT SUM(number_of_passengers) FROM ride_passengers rp WHERE rp.ride_id = r.id AND rp.status = 'confirmed'), 0) as confirmed_seats,
          (
            6371 * acos(
              LEAST(1, GREATEST(-1,
                cos(radians($1)) * 
                cos(radians(r.destination_latitude)) * 
                cos(radians(r.destination_longitude) - radians($2)) + 
                sin(radians($1)) * 
                sin(radians(r.destination_latitude))
              ))
            )
          ) AS distance_km,
          CASE 
            WHEN $4::TEXT IS NOT NULL AND $4::TEXT != '' AND LOWER(r.destination_address) LIKE LOWER('%' || $4::TEXT || '%') THEN 1
            ELSE 0
          END AS text_match
        FROM rides r
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN vehicles v ON v.driver_id = d.id
        WHERE r.status = 'available'
          AND r.departure_time > NOW()
      ) AS nearby_rides
      WHERE 
        CASE 
          -- Se tiver texto de busca, mostrar APENAS caronas que batem com o texto
          WHEN $4::TEXT IS NOT NULL AND $4::TEXT != '' THEN text_match = 1
          -- Se não tiver texto, mostrar caronas dentro do raio
          ELSE distance_km <= $3
        END
      ORDER BY 
        text_match DESC,
        distance_km ASC,
        departure_time ASC
      LIMIT 20
    `;

        const result = await pool.query(query, [latitude, longitude, radiusKm, searchTerm]);

        console.log('Total de caronas encontradas:', result.rows.length);

        const rides = result.rows.map(ride => {
            const pendingCount = parseInt(ride.pending_seats) || 0;
            const confirmedCount = parseInt(ride.confirmed_seats) || 0;
            const totalReserved = pendingCount + confirmedCount;
            const actualAvailableSeats = Math.max(0, ride.available_seats - confirmedCount);
            const canRequestMore = totalReserved < ride.available_seats;

            const rideData = {
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
                availableSeats: actualAvailableSeats,
                totalSeats: ride.available_seats,
                pendingSeats: pendingCount,
                confirmedSeats: confirmedCount,
                canRequestMore: canRequestMore,
                pricePerSeat: parseFloat(ride.price_per_seat),
                distance: parseFloat(ride.distance_km).toFixed(2)
            };

            // Indicar se houve match textual
            if (searchTerm && ride.text_match === 1) {
                rideData.textMatch = 'Sim';
            }

            console.log(`Carona ${ride.id}:`, {
                destino: ride.destination_address,
                distancia: rideData.distance + 'km',
                vagasDisponiveis: actualAvailableSeats,
                matchTextual: rideData.textMatch || 'Não'
            });

            return rideData;
        });

        console.log('=== FIM BUSCA ===\n');

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

/**
 * GET /api/rides/:rideId
 * Buscar detalhes completos de uma carona
 */
router.get('/:rideId', async (req, res) => {
    const { rideId } = req.params;

    try {
        // Buscar dados da carona com info do motorista
        const rideResult = await pool.query(
            `SELECT 
                r.*,
                u.name as driver_name,
                u.phone as driver_phone,
                v.modelo as vehicle_model,
                v.placa as vehicle_plate,
                v.cor as vehicle_color,
                d.rating as driver_rating
            FROM rides r
            INNER JOIN drivers d ON r.driver_id = d.id
            INNER JOIN users u ON d.user_id = u.id
            LEFT JOIN vehicles v ON v.driver_id = d.id
            WHERE r.id = $1`,
            [rideId]
        );

        if (rideResult.rows.length === 0) {
            return res.status(404).json({ message: 'Carona não encontrada' });
        }

        const ride = rideResult.rows[0];

        // Contar passageiros confirmados
        const passengersResult = await pool.query(
            `SELECT COUNT(*) as confirmed_count 
            FROM ride_passengers 
            WHERE ride_id = $1 AND status = 'confirmed'`,
            [rideId]
        );

        const confirmedPassengers = parseInt(passengersResult.rows[0].confirmed_count) || 0;
        const actualAvailableSeats = ride.available_seats - confirmedPassengers;

        res.status(200).json({
            success: true,
            ride: {
                id: ride.id,
                driver: {
                    id: ride.driver_id,
                    name: ride.driver_name,
                    phone: ride.driver_phone,
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
                totalSeats: ride.available_seats,
                availableSeats: actualAvailableSeats,
                confirmedPassengers,
                pricePerSeat: parseFloat(ride.price_per_seat),
                status: ride.status,
                createdAt: ride.created_at
            }
        });
    } catch (err) {
        console.error('Erro ao buscar detalhes da carona:', err);
        res.status(500).json({ message: 'Erro ao buscar carona', error: err.message });
    }
});

/**
 * POST /api/rides/:rideId/request
 * Passageiro solicita vaga em uma carona
 */
router.post('/:rideId/request', async (req, res) => {
    const { rideId } = req.params;
    const { passengerId, numberOfPassengers, paymentMethod } = req.body;

    // Validações básicas
    if (!passengerId) {
        return res.status(400).json({ message: 'passengerId é obrigatório' });
    }

    if (!numberOfPassengers || numberOfPassengers < 1) {
        return res.status(400).json({ message: 'numberOfPassengers deve ser pelo menos 1' });
    }

    if (!paymentMethod) {
        return res.status(400).json({ message: 'paymentMethod é obrigatório' });
    }

    // Validar forma de pagamento
    const validPaymentMethods = ['cash', 'pix', 'card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
            message: 'paymentMethod inválido. Valores aceitos: cash, pix, card'
        });
    }

    try {
        // Verificar se a carona existe e está disponível
        // Contar pendentes e confirmados separadamente para modelo híbrido
        const rideResult = await pool.query(
            `SELECT r.*, 
                COALESCE((SELECT SUM(number_of_passengers) FROM ride_passengers WHERE ride_id = r.id AND status = 'pending'), 0) as pending_seats,
                COALESCE((SELECT SUM(number_of_passengers) FROM ride_passengers WHERE ride_id = r.id AND status = 'confirmed'), 0) as confirmed_seats
            FROM rides r 
            WHERE r.id = $1 AND r.status = 'available' AND r.departure_time > NOW()`,
            [rideId]
        );

        if (rideResult.rows.length === 0) {
            return res.status(404).json({ message: 'Carona não encontrada ou não está mais disponível' });
        }

        const ride = rideResult.rows[0];
        const pendingSeats = parseInt(ride.pending_seats) || 0;
        const confirmedSeats = parseInt(ride.confirmed_seats) || 0;
        const totalReserved = pendingSeats + confirmedSeats;
        const remainingSlots = ride.available_seats - totalReserved;

        // Modelo híbrido: bloquear quando pendentes + confirmados >= total
        if (remainingSlots <= 0) {
            return res.status(400).json({
                message: 'Todas as vagas já estão ocupadas ou com solicitações pendentes. Aguarde uma vaga ser liberada.',
                pendingSeats,
                confirmedSeats
            });
        }

        // Validar se a quantidade solicitada não excede as vagas restantes
        if (numberOfPassengers > remainingSlots) {
            return res.status(400).json({
                message: `Apenas ${remainingSlots} vaga(s) disponível(is) para solicitação. Você solicitou ${numberOfPassengers}.`,
                availableForRequest: remainingSlots,
                pendingSeats,
                confirmedSeats
            });
        }

        // Verificar se já existe solicitação deste passageiro
        const existingRequest = await pool.query(
            `SELECT * FROM ride_passengers WHERE ride_id = $1 AND passenger_id = $2`,
            [rideId, passengerId]
        );

        if (existingRequest.rows.length > 0) {
            const status = existingRequest.rows[0].status;
            if (status === 'pending') {
                return res.status(400).json({ message: 'Você já solicitou vaga nesta carona' });
            }
            if (status === 'confirmed') {
                return res.status(400).json({ message: 'Você já está confirmado nesta carona' });
            }
            // Se foi rejeitado ou cancelado, permitir nova solicitação
            await pool.query(
                `UPDATE ride_passengers 
                SET status = 'pending', 
                    requested_at = CURRENT_TIMESTAMP, 
                    responded_at = NULL,
                    number_of_passengers = $3,
                    payment_method = $4
                WHERE ride_id = $1 AND passenger_id = $2`,
                [rideId, passengerId, numberOfPassengers, paymentMethod]
            );
        } else {
            // Criar nova solicitação
            await pool.query(
                `INSERT INTO ride_passengers (ride_id, passenger_id, status, number_of_passengers, payment_method) 
                VALUES ($1, $2, 'pending', $3, $4)`,
                [rideId, passengerId, numberOfPassengers, paymentMethod]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Solicitação enviada! Aguarde a confirmação do motorista.',
            remainingSeats: remainingSlots - numberOfPassengers
        });
    } catch (err) {
        console.error('Erro ao solicitar vaga:', err);
        res.status(500).json({ message: 'Erro ao solicitar vaga', error: err.message });
    }
});

/**
 * GET /api/rides/driver/:driverId/pending-requests
 * Buscar todas as solicitações pendentes de passageiros para as caronas do motorista
 */
router.get('/driver/:driverId/pending-requests', async (req, res) => {
    const { driverId } = req.params;
    const { rideId } = req.query; // Filtro opcional por carona específica

    try {
        let query = `
            SELECT 
                rp.id,
                rp.ride_id,
                rp.passenger_id,
                rp.number_of_passengers,
                rp.payment_method,
                rp.requested_at,
                u.name as passenger_name,
                u.phone as passenger_phone,
                r.origin_address,
                r.origin_latitude,
                r.origin_longitude,
                r.destination_address,
                r.destination_latitude,
                r.destination_longitude,
                r.departure_time
            FROM ride_passengers rp
            INNER JOIN rides r ON rp.ride_id = r.id
            INNER JOIN passengers p ON rp.passenger_id = p.id
            INNER JOIN users u ON p.user_id = u.id
            WHERE r.driver_id = $1 AND rp.status = 'pending'
        `;

        const params = [driverId];

        // Filtrar por carona específica se fornecido
        if (rideId) {
            query += ` AND rp.ride_id = $2`;
            params.push(rideId);
        }

        query += ` ORDER BY rp.requested_at DESC`;

        const result = await pool.query(query, params);

        const requests = result.rows.map(req => ({
            id: req.id,
            rideId: req.ride_id,
            passengerId: req.passenger_id,
            passengerName: req.passenger_name,
            passengerPhone: req.passenger_phone,
            numberOfPassengers: req.number_of_passengers,
            paymentMethod: req.payment_method,
            requestedAt: req.requested_at,
            ride: {
                origin: {
                    address: req.origin_address,
                    latitude: parseFloat(req.origin_latitude),
                    longitude: parseFloat(req.origin_longitude)
                },
                destination: {
                    address: req.destination_address,
                    latitude: parseFloat(req.destination_latitude),
                    longitude: parseFloat(req.destination_longitude)
                },
                departureTime: req.departure_time
            }
        }));

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (err) {
        console.error('Erro ao buscar solicitações pendentes:', err);
        res.status(500).json({ message: 'Erro ao buscar solicitações', error: err.message });
    }
});

/**
 * GET /api/rides/:rideId/passengers
 * Listar passageiros de uma carona (para o motorista)
 */
router.get('/:rideId/passengers', async (req, res) => {
    const { rideId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                rp.*,
                u.name as passenger_name,
                u.phone as passenger_phone
            FROM ride_passengers rp
            INNER JOIN passengers p ON rp.passenger_id = p.id
            INNER JOIN users u ON p.user_id = u.id
            WHERE rp.ride_id = $1
            ORDER BY rp.requested_at DESC`,
            [rideId]
        );

        const passengers = result.rows.map(p => ({
            id: p.id,
            passengerId: p.passenger_id,
            name: p.passenger_name,
            phone: p.passenger_phone,
            status: p.status,
            requestedAt: p.requested_at,
            respondedAt: p.responded_at
        }));

        res.status(200).json({ success: true, passengers });
    } catch (err) {
        console.error('Erro ao listar passageiros:', err);
        res.status(500).json({ message: 'Erro ao listar passageiros', error: err.message });
    }
});

/**
 * PUT /api/rides/:rideId/passengers/:passengerId
 * Motorista responde solicitação (confirma ou rejeita)
 */
router.put('/:rideId/passengers/:passengerId', async (req, res) => {
    const { rideId, passengerId } = req.params;
    const { status } = req.body; // 'confirmed' ou 'rejected'

    if (!['confirmed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status deve ser "confirmed" ou "rejected"' });
    }

    try {
        // Se confirmando, verificar se ainda há vagas
        if (status === 'confirmed') {
            const rideResult = await pool.query(
                `SELECT r.available_seats,
                    (SELECT COUNT(*) FROM ride_passengers WHERE ride_id = r.id AND status = 'confirmed') as confirmed_count
                FROM rides r WHERE r.id = $1`,
                [rideId]
            );

            if (rideResult.rows.length === 0) {
                return res.status(404).json({ message: 'Carona não encontrada' });
            }

            const ride = rideResult.rows[0];
            const confirmedCount = parseInt(ride.confirmed_count) || 0;

            if (confirmedCount >= ride.available_seats) {
                return res.status(400).json({ message: 'Não há mais vagas disponíveis' });
            }
        }

        const result = await pool.query(
            `UPDATE ride_passengers 
            SET status = $1, responded_at = CURRENT_TIMESTAMP 
            WHERE ride_id = $2 AND passenger_id = $3
            RETURNING *`,
            [status, rideId, passengerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitação não encontrada' });
        }

        res.status(200).json({
            success: true,
            message: status === 'confirmed' ? 'Passageiro confirmado!' : 'Solicitação rejeitada',
            passenger: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao atualizar status do passageiro:', err);
        res.status(500).json({ message: 'Erro ao processar solicitação', error: err.message });
    }
});

/**
 * GET /api/passengers/:passengerId/requests
 * Busca todas as solicitações de caronas de um passageiro
 */
router.get('/passengers/:passengerId/requests', async (req, res) => {
    const { passengerId } = req.params;

    try {
        const query = `
            SELECT 
                rp.id,
                rp.ride_id,
                rp.passenger_id,
                rp.status,
                rp.number_of_passengers,
                rp.payment_method,
                rp.requested_at,
                rp.responded_at,
                r.origin_address,
                r.origin_latitude,
                r.origin_longitude,
                r.destination_address,
                r.destination_latitude,
                r.destination_longitude,
                r.departure_time,
                r.price_per_seat,
                r.status as ride_status,
                d.id as driver_id,
                u.name as driver_name,
                u.phone as driver_phone
            FROM ride_passengers rp
            INNER JOIN rides r ON rp.ride_id = r.id
            INNER JOIN drivers d ON r.driver_id = d.id
            INNER JOIN users u ON d.user_id = u.id
            WHERE rp.passenger_id = $1
            ORDER BY rp.requested_at DESC
        `;

        const result = await pool.query(query, [passengerId]);

        const requests = result.rows.map(req => ({
            id: req.id,
            rideId: req.ride_id,
            status: req.status,
            numberOfPassengers: req.number_of_passengers,
            paymentMethod: req.payment_method,
            requestedAt: req.requested_at,
            respondedAt: req.responded_at,
            ride: {
                origin: {
                    address: req.origin_address,
                    latitude: parseFloat(req.origin_latitude),
                    longitude: parseFloat(req.origin_longitude)
                },
                destination: {
                    address: req.destination_address,
                    latitude: parseFloat(req.destination_latitude),
                    longitude: parseFloat(req.destination_longitude)
                },
                departureTime: req.departure_time,
                pricePerSeat: parseFloat(req.price_per_seat),
                status: req.ride_status
            },
            driver: {
                id: req.driver_id,
                name: req.driver_name,
                phone: req.driver_phone
            }
        }));

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (err) {
        console.error('Erro ao buscar solicitações do passageiro:', err);
        res.status(500).json({ message: 'Erro ao buscar solicitações', error: err.message });
    }
});

/**
 * DELETE /api/rides/:rideId/requests/:passengerId
 * Passageiro cancela sua solicitação de carona
 */
router.delete('/:rideId/requests/:passengerId', async (req, res) => {
    const { rideId, passengerId } = req.params;

    try {
        // Verificar se a solicitação existe
        const checkResult = await pool.query(
            `SELECT * FROM ride_passengers WHERE ride_id = $1 AND passenger_id = $2`,
            [rideId, passengerId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitação não encontrada' });
        }

        const request = checkResult.rows[0];

        // Só pode cancelar se estiver pendente
        if (request.status !== 'pending') {
            return res.status(400).json({
                message: `Não é possível cancelar uma solicitação ${request.status === 'confirmed' ? 'confirmada' : 'já rejeitada'}`
            });
        }

        // Atualizar status para 'cancelled'
        const result = await pool.query(
            `UPDATE ride_passengers 
            SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP 
            WHERE ride_id = $1 AND passenger_id = $2
            RETURNING *`,
            [rideId, passengerId]
        );

        res.status(200).json({
            success: true,
            message: 'Solicitação cancelada com sucesso',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao cancelar solicitação:', err);
        res.status(500).json({ message: 'Erro ao cancelar solicitação', error: err.message });
    }
});

/**
 * PUT /api/rides/:rideId/status
 * Motorista atualiza o status da carona (in_progress, completed, cancelled)
 */
router.put('/:rideId/status', async (req, res) => {
    const { rideId } = req.params;
    const { status } = req.body;

    // Validar status permitidos
    const validStatuses = ['available', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Status inválido. Use: ${validStatuses.join(', ')}`
        });
    }

    try {
        // Verificar se a carona existe
        const rideCheck = await pool.query(
            `SELECT * FROM rides WHERE id = $1`,
            [rideId]
        );

        if (rideCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Carona não encontrada' });
        }

        const currentRide = rideCheck.rows[0];

        // Validações de transição de estado
        if (status === 'in_progress' && currentRide.status !== 'available') {
            return res.status(400).json({
                message: 'Só é possível iniciar caronas com status "available"'
            });
        }

        if (status === 'completed' && currentRide.status !== 'in_progress') {
            return res.status(400).json({
                message: 'Só é possível finalizar caronas que estão "in_progress"'
            });
        }

        // Atualizar status
        const result = await pool.query(
            `UPDATE rides 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
            RETURNING *`,
            [status, rideId]
        );

        res.status(200).json({
            success: true,
            message: `Carona ${status === 'in_progress' ? 'iniciada' : status === 'completed' ? 'finalizada' : 'atualizada'} com sucesso`,
            ride: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao atualizar status da carona:', err);
        res.status(500).json({ message: 'Erro ao atualizar status', error: err.message });
    }
});

export default router;

