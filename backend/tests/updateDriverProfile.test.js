import { jest } from '@jest/globals'


const mockQuery = jest.fn()
const mockRelease = jest.fn()

jest.unstable_mockModule('../db.js', () => ({
  pool: {
    connect: jest.fn()
  }
}))

const { pool } = await import('../db.js')
const { updateDriverProfile } = await import('../routes/driverRoutes.js')

describe('PUT /api/drivers/profile/:userId - Atualizar Perfil', () => {
  let req, res

  beforeEach(() => {
    jest.resetAllMocks()

    pool.connect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease
    })

    req = {
      params: { userId: '1' },
      body: {} 
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  
  test('Deve retornar 404 e dar ROLLBACK se o motorista não for encontrado', async () => {
    mockQuery
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({ rows: [] })

    await updateDriverProfile(req, res)

    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Motorista não encontrado.' })
    expect(mockRelease).toHaveBeenCalled()
  })

  
  test('Deve atualizar dados do motorista e do veículo com sucesso (200)', async () => {
    req.body = {
      is_available: true,    
      modelo: 'Honda Civic' 
    }

    mockQuery
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) 
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({}) 

    await updateDriverProfile(req, res)

    expect(mockQuery).toHaveBeenCalledWith('COMMIT')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Dados do motorista atualizados com sucesso!' })
  })

  
  test('Deve atualizar APENAS o motorista se não enviar dados do veículo', async () => {
    req.body = { current_latitude: '-5.0', current_longitude: '-42.0' }

    mockQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({})

    await updateDriverProfile(req, res)

    const calls = mockQuery.mock.calls.map(call => call[0])
    const vehicleUpdateCall = calls.find(query => query.includes('UPDATE vehicles'))
    expect(vehicleUpdateCall).toBeUndefined()

    expect(mockQuery).toHaveBeenCalledWith('COMMIT')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('Deve atualizar APENAS o veículo se não enviar dados do motorista', async () => {
    req.body = { cor: 'Preto' }

    mockQuery
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({})

    await updateDriverProfile(req, res)

    const calls = mockQuery.mock.calls.map(call => call[0])
    const driverUpdateCall = calls.find(query => query.includes('UPDATE drivers'))
    expect(driverUpdateCall).toBeUndefined()

    expect(mockQuery).toHaveBeenCalledWith('COMMIT')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('Deve retornar 409 se a nova placa já existir em outro veículo', async () => {
    req.body = { placa: 'XYZ-9876' }

    const dbError = new Error('Erro de BD')
    dbError.code = '23505'
    dbError.constraint = 'vehicles_placa_key'

    mockQuery
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockRejectedValueOnce(dbError)

    await updateDriverProfile(req, res)

    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ message: 'Esta placa de veículo já está cadastrada.' })
  })

  test('Deve retornar 500 em caso de erro interno', async () => {
    req.body = { is_available: true }
    const dbError = new Error('Falha catastrófica')
    mockQuery.mockRejectedValueOnce(dbError)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await updateDriverProfile(req, res)

    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao atualizar perfil do motorista:', dbError)

    consoleSpy.mockRestore()
  })
})