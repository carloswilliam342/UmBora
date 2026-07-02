import { jest } from '@jest/globals'

const mockQuery = jest.fn()

jest.unstable_mockModule('../db.js', () => ({
    pool: { query: mockQuery }
}))

const { 
    getDriversNearbyHandler, 
    createRideHandler, 
    getDriverRidesHandler, 
    getAvailableRidesHandler, 
    updateRideHandler,
    cancelRideHandler,
    getRideDetailsHandler,
    requestRideHandler, 
    getPendingRequestsHandler,
    getPassengersHandler,
    responseRideHandler,
    getPassengerRequestsHandler,
    cancelRideRequestHandler,
    updateRideStatusHandler 
} = await import('../routes/rideRoutes.js')

describe('Rotas de Caronas (Rides)', () => {
    let req, res
    let consoleErrorSpy, consoleLogSpy

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterAll(() => {
        consoleErrorSpy.mockRestore()
        consoleLogSpy.mockRestore()
    })
    
    beforeEach(() => {
        jest.clearAllMocks()
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    })

    describe('GET /nearby - getDriversNearbyHandler', () => {
        beforeEach(() => {
            req = {
                query: { lat: '-23.5', lng: '-46.6', radius: '10' }
            }
        })

        test('Deve retornar 400 se faltar lat ou lng', async () => {
            req.query.lat = undefined
            await getDriversNearbyHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Latitude e longitude são obrigatórias.' })
        })

        test('Deve retornar 200 com a lista de motoristas próximos', async () => {
            const mockDbResult = {
                rows: [
                    {
                        id: 1, name: 'João', vehicle_model: 'Gol', vehicle_plate: 'ABC-1234',
                        vehicle_color: 'Preto', current_latitude: '-23.51', current_longitude: '-46.61',
                        rating: '4.8', distance_km: '1.5'
                    }
                ]
            }
            mockQuery.mockResolvedValueOnce(mockDbResult)

            await getDriversNearbyHandler(req, res)

            expect(mockQuery).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                drivers: [{
                    id: 1, name: 'João',
                    vehicle: { model: 'Gol', plate: 'ABC-1234', color: 'Preto' },
                    location: { latitude: -23.51, longitude: -46.61 },
                    rating: '4.8', distance: '1.50'
                }]
            })
        })

        test('Deve retornar 500 em caso de erro no banco', async () => {
            mockQuery.mockRejectedValueOnce(new Error('DB Error'))
            await getDriversNearbyHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('POST /create - createRideHandler', () => {
        beforeEach(() => {
            req = {
                body: {
                    driverId: 1,
                    origin: { address: 'Rua A', latitude: -23.5, longitude: -46.6 },
                    destination: { address: 'Rua B', latitude: -23.6, longitude: -46.7 },
                    departureTime: '2023-12-01T10:00:00Z',
                    availableSeats: 3,
                    pricePerSeat: 15.5
                }
            }
        })

        test('Deve retornar 400 se faltarem campos obrigatórios', async () => {
            req.body.driverId = undefined
            await createRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se origem incompleta', async () => {
            req.body.origin.address = undefined
            await createRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Origem incompleta' })
        })

        test('Deve retornar 400 se destino incompleto', async () => {
            req.body.destination.address = undefined
            await createRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ message: 'Destino incompleto' })
        })

        test('Deve retornar 201 e criar a carona com sucesso', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] })

            await createRideHandler(req, res)

            expect(mockQuery).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Carona cadastrada com sucesso!',
                rideId: 42
            })
        })

        test('Deve retornar 500 em caso de erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('DB Error'))
            await createRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /driver/:driverId - getDriverRidesHandler', () => {
        beforeEach(() => {
            req = {
                params: { driverId: '1' }
            }
        })

        test('Deve retornar 200 e a lista de caronas do motorista', async () => {
            const mockRides = [
                {
                    id: 42,
                    origin_address: 'A', origin_latitude: '0', origin_longitude: '0',
                    destination_address: 'B', destination_latitude: '1', destination_longitude: '1',
                    departure_time: '2023-12-01T10:00:00Z', available_seats: 4, price_per_seat: '10.0',
                    status: 'available', created_at: '2023-11-01T10:00:00Z'
                }
            ]
            mockQuery.mockResolvedValueOnce({ rows: mockRides })

            await getDriverRidesHandler(req, res)

            expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1'])
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getDriverRidesHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /available - getAvailableRidesHandler', () => {
        beforeEach(() => {
            req = {
                query: { lat: '-23.5', lng: '-46.6', radius: '50' }
            }
        })

        test('Deve retornar 400 se faltar lat ou lng', async () => {
            req.query.lat = undefined
            await getAvailableRidesHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 200 e as caronas disponíveis sem searchText', async () => {
            const mockRides = [
                {
                    id: 42, driver_name: 'João', driver_rating: '5',
                    vehicle_model: 'Gol', vehicle_plate: 'ABC-1234', vehicle_color: 'Preto',
                    origin_address: 'A', origin_latitude: '0', origin_longitude: '0',
                    destination_address: 'B', destination_latitude: '1', destination_longitude: '1',
                    departure_time: '2023-12-01T10:00:00Z', available_seats: 4,
                    pending_seats: '0', confirmed_seats: '1', price_per_seat: '10.0', distance_km: '5.5',
                    text_match: 0
                }
            ]
            mockQuery.mockResolvedValueOnce({ rows: mockRides })

            await getAvailableRidesHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 200 cobrindo match textual e searchText', async () => {
            req.query.searchText = 'teste'
            const mockRides = [
                {
                    id: 42, driver_name: 'João', driver_rating: '5',
                    vehicle_model: 'Gol', vehicle_plate: 'ABC-1234', vehicle_color: 'Preto',
                    origin_address: 'A', origin_latitude: '0', origin_longitude: '0',
                    destination_address: 'B', destination_latitude: '1', destination_longitude: '1',
                    departure_time: '2023-12-01T10:00:00Z', available_seats: 4,
                    pending_seats: '0', confirmed_seats: '1', price_per_seat: '10.0', distance_km: '5.5',
                    text_match: 1
                }
            ]
            mockQuery.mockResolvedValueOnce({ rows: mockRides })

            await getAvailableRidesHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getAvailableRidesHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('PUT /:rideId - updateRideHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42' }, body: {} } })
        
        test('Deve retornar 400 se nenhum campo para atualizar', async () => {
            await updateRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })
        
        test('Deve atualizar os campos fornecidos e retornar 200', async () => {
            req.body = { departureTime: '2024-01-01', availableSeats: 3, pricePerSeat: 10, status: 'available' }
            mockQuery.mockResolvedValueOnce({ rowCount: 1 })
            await updateRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })
        
        test('Deve retornar 500 em erro', async () => {
            req.body = { availableSeats: 3 }
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await updateRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('DELETE /:rideId - cancelRideHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42' } } })
        
        test('Deve cancelar a carona', async () => {
            mockQuery.mockResolvedValueOnce({})
            await cancelRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })
        
        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await cancelRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /:rideId - getRideDetailsHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42' } } })
        
        test('Deve retornar 404 se a carona não existir', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await getRideDetailsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })
        
        test('Deve retornar os detalhes da carona', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4 }] })
                .mockResolvedValueOnce({ rows: [{ confirmed_count: '1' }] })
            await getRideDetailsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })
        
        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getRideDetailsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('POST /:rideId/request - requestRideHandler', () => {
        beforeEach(() => {
            req = {
                params: { rideId: '42' },
                body: { passengerId: 2, numberOfPassengers: 1, paymentMethod: 'pix' }
            }
        })

        test('Deve retornar 400 se faltarem campos', async () => {
            req.body.passengerId = undefined
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se numberOfPassengers < 1', async () => {
            req.body.numberOfPassengers = 0
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se paymentMethod is undefined', async () => {
            req.body.paymentMethod = undefined
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se o paymentMethod for inválido', async () => {
            req.body.paymentMethod = 'invalid'
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 404 se a carona não existir ou não estiver disponível', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })

        test('Deve retornar 400 se as vagas estiverem ocupadas (remainingSlots <= 0)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4, pending_seats: 2, confirmed_seats: 2 }] })
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se as numberOfPassengers > remainingSlots', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4, pending_seats: 1, confirmed_seats: 1 }] })
            req.body.numberOfPassengers = 3
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test.each([
            ['pending'],
            ['confirmed'],
        ])('Deve retornar 400 se solicitação já existe como %s', async (status) => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4, pending_seats: 0, confirmed_seats: 0 }] })
                .mockResolvedValueOnce({ rows: [{ status }] })
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve atualizar e retornar 201 se solicitação era rejected ou cancelled', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4, pending_seats: 0, confirmed_seats: 0 }] })
                .mockResolvedValueOnce({ rows: [{ status: 'rejected' }] })
                .mockResolvedValueOnce({})
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(201)
        })

        test('Deve retornar 201 e criar a solicitação (insert)', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 42, available_seats: 4, pending_seats: 0, confirmed_seats: 0 }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rowCount: 1 })
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(201)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await requestRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /driver/:driverId/pending-requests - getPendingRequestsHandler', () => {
        beforeEach(() => { req = { params: { driverId: '1' }, query: {} } })
        
        test('Deve buscar pendentes sem rideId', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, origin_latitude: '0', origin_longitude: '0', destination_latitude: '0', destination_longitude: '0' }] })
            await getPendingRequestsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve buscar pendentes com rideId', async () => {
            req.query.rideId = '42'
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await getPendingRequestsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getPendingRequestsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /:rideId/passengers - getPassengersHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42' } } })

        test('Deve buscar passageiros', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] })
            await getPassengersHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getPassengersHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('PUT /:rideId/passengers/:passengerId - responseRideHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42', passengerId: '2' }, body: { status: 'confirmed' } } })

        test('Deve retornar 400 para status invalido', async () => {
            req.body.status = 'invalid'
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 404 se a carona nao existe ao confirmar', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })

        test('Deve retornar 400 se nao ha mais vagas', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ available_seats: 4, confirmed_count: '4' }] })
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 404 se a solicitacao nao existe', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ available_seats: 4, confirmed_count: '2' }] })
                .mockResolvedValueOnce({ rows: [] })
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })

        test('Deve confirmar com sucesso', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ available_seats: 4, confirmed_count: '2' }] })
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve rejeitar com sucesso', async () => {
            req.body.status = 'rejected'
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] })
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await responseRideHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('GET /passengers/:passengerId/requests - getPassengerRequestsHandler', () => {
        beforeEach(() => { req = { params: { passengerId: '2' } } })

        test('Deve buscar requisicoes', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ origin_latitude: '0', origin_longitude: '0', destination_latitude: '0', destination_longitude: '0', price_per_seat: '10' }] })
            await getPassengerRequestsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await getPassengerRequestsHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('DELETE /:rideId/requests/:passengerId - cancelRideRequestHandler', () => {
        beforeEach(() => { req = { params: { rideId: '42', passengerId: '2' } } })

        test('Deve retornar 404 se a solicitacao nao existe', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await cancelRideRequestHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })

        test('Deve retornar 400 se o status for confirmed', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ status: 'confirmed' }] })
            await cancelRideRequestHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve cancelar se estiver pending', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ status: 'pending' }] })
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
            await cancelRideRequestHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await cancelRideRequestHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })

    describe('PUT /:rideId/status - updateRideStatusHandler', () => {
        beforeEach(() => {
            req = {
                params: { rideId: '42' },
                body: { status: 'in_progress' }
            }
        })

        test('Deve retornar 400 se o status for inválido', async () => {
            req.body.status = 'invalid_status'
            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 404 se a carona não existir', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] })
            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
        })

        test('Deve retornar 400 se tentar in_progress mas corrida não for available', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, status: 'completed' }] })
            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 400 se tentar completed mas corrida não for in_progress', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, status: 'available' }] })
            req.body.status = 'completed'
            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
        })

        test('Deve retornar 200 e atualizar o status', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 42, status: 'available' }] })
                .mockResolvedValueOnce({ rows: [{ id: 42, status: 'in_progress' }] })

            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
        })

        test('Deve retornar 500 em erro', async () => {
            mockQuery.mockRejectedValueOnce(new Error('error'))
            await updateRideStatusHandler(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
        })
    })
})
