import { jest } from '@jest/globals'

const mockQuery = jest.fn()

jest.unstable_mockModule('../db.js', () => ({
  pool: {
    query: mockQuery
  }
}))

const { getDriverProfile } = await import('../routes/driverRoutes.js')

describe('GET /api/drivers/profile/:userId - Perfil do Motorista', () => {
  let req, res

  beforeEach(() => {
    jest.resetAllMocks()

    req = {
      params: {
        userId: '1'
      }
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  test('Deve retornar 200 e o perfil completo se o motorista existir', async () => {
    const mockDbRow = {
      id: 10,
      user_id: 1,
      cnh: '12345678901',
      current_latitude: '-5.0934',
      current_longitude: '-42.8012',
      is_available: true,
      rating: '4.80',
      status: 'active',
      created_at: '2023-10-01T10:00:00Z',
      name: 'João da Silva',
      email: 'joao@email.com',
      vehicle_id: 5,
      modelo: 'Fusca',
      placa: 'ABC-1234',
      cor: 'Azul'
    }

    mockQuery.mockResolvedValueOnce({ rows: [mockDbRow] })

    await getDriverProfile(req, res)

    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1']) 
    
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      isDriver: true,
      driver: {
        id: 10,
        userId: 1,
        name: 'João da Silva',
        email: 'joao@email.com',
        cnh: '12345678901',
        location: {
          latitude: -5.0934,
          longitude: -42.8012
        },
        isAvailable: true,
        rating: '4.80',
        status: 'active',
        vehicle: {
          id: 5,
          modelo: 'Fusca',
          placa: 'ABC-1234',
          cor: 'Azul'
        },
        createdAt: '2023-10-01T10:00:00Z'
      }
    })
  })

  test('Deve retornar 200 com location "null" se o motorista não tiver coordenadas', async () => {
    const mockDbRow = {
      id: 10,
      user_id: 1,
      current_latitude: null,
      current_longitude: null,
    }

    mockQuery.mockResolvedValueOnce({ rows: [mockDbRow] })

    await getDriverProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      driver: expect.objectContaining({
        location: null
      })
    }))
  })

  test('Deve retornar 404 e isDriver: false se o usuário não for motorista', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await getDriverProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Motorista não encontrado.',
      isDriver: false
    })
  })

  test('Deve retornar 500 se o banco de dados falhar', async () => {
    const dbError = new Error('Conexão perdida')
    mockQuery.mockRejectedValueOnce(dbError)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await getDriverProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor.' })
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar perfil do motorista:', dbError)

    consoleSpy.mockRestore()
  })
})