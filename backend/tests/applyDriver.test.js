import { jest } from '@jest/globals'

const mockQuery = jest.fn()
const mockRelease = jest.fn()
jest.unstable_mockModule('../db.js', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: mockQuery,
      release: mockRelease
    })
  }
}))

const { applyDriverHandler } = await import('../routes/driverRoutes.js')

describe('POST /apply - Cadastro de Motorista', () => {
    let req, res

    beforeEach(() => {
        jest.clearAllMocks()

        req = {
            body: {
                userId: 1,
                cnh: '12345678901',
                modelo: 'Fusca',
                placa: 'ABC-1234',
                cor: 'Azul'
            }
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    })

    test('Deve retornar 400 se faltarem campos obrigatórios', async () => {
        
        req.body.cnh = undefined

        await applyDriverHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        
        expect(res.json).toHaveBeenCalledWith({ message:'Campos obrigatórios: userId, cnh, modelo, placa, cor.'})
    })

    test('Deve cadastrar o motorista e o veículo com sucesso retornando 201', async () => {
        
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 99 }] })
            .mockResolvedValueOnce({})

        await applyDriverHandler(req, res)
        
        expect(mockQuery).toHaveBeenCalledWith('BEGIN')
        expect(mockQuery).toHaveBeenCalledWith('COMMIT')
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Cadastro de motorista enviado para análise com sucesso!',
            driverId: 99
        })
        expect(mockRelease).toHaveBeenCalled()
    })

    test('Deve retornar 409 e fazer ROLLBACK se o usuário já for motorista', async () => {

        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rows: [{ id: 10 }] })

        await applyDriverHandler(req, res)

        expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({message: 'Este usuário já possui um cadastro como motorista.'})
        expect(mockRelease).toHaveBeenCalled()
    })

    test.each([
        [
            'drivers_cnh_key',
            [mockResolvedValueOnce => {}, { rows: [] }],
            'Esta CNH já está cadastrada.'
        ],
        [
            'vehicles_placa_key',
            [mockResolvedValueOnce => {}, { rows: [] }, { rows: [{ id: 99 }] }],
            'Esta placa de veículo já está cadastrada.'
        ],
        [
            'outra_constraint_qualquer',
            [mockResolvedValueOnce => {}, { rows: [] }],
            'Dados duplicados. Verifique CNH e placa do veículo.'
        ],
    ])('Deve retornar 409 para violação de unicidade na constraint "%s"', async (constraint, _resolvedValues, expectedMessage) => {
        const dbError = new Error('Erro de BD')
        dbError.code = '23505'
        dbError.constraint = constraint

        if (constraint === 'drivers_cnh_key' || constraint === 'outra_constraint_qualquer') {
            mockQuery
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [] })
                .mockRejectedValueOnce(dbError)
        } else {
            mockQuery
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ id: 99 }] })
                .mockRejectedValueOnce(dbError)
        }

        await applyDriverHandler(req, res)

        expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({ message: expectedMessage })
        expect(mockRelease).toHaveBeenCalled()
    })

    test('Deve retornar 500 se ocorrer um erro interno e logar o erro', async () => {
        const dbError = new Error('Banco de dados pegou fogo')
        
        mockQuery.mockRejectedValueOnce(dbError) 

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        await applyDriverHandler(req, res)

        expect(mockQuery).toHaveBeenCalledWith('ROLLBACK')
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor ao processar o cadastro.' })
        expect(consoleSpy).toHaveBeenCalledWith('Erro no cadastro de motorista:', dbError)
        expect(mockRelease).toHaveBeenCalled()

        consoleSpy.mockRestore()
    })
})