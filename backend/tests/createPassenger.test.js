import { jest } from '@jest/globals'

const mockQuery = jest.fn()

jest.unstable_mockModule('../db.js', () => ({
    pool: {
        query: mockQuery
    }
}))

const { createPassengerHandler } = await import('../routes/passengerRoutes.js')

describe('POST /api/passenger - Cadastro', () => {
    let req, res

    beforeEach(() => {
        jest.resetAllMocks()

        req = {
            body: {
                userId: 1,
                cpf: '111.222.333-44',
                cep: '65620-000',
                rua: 'Rua A',
                bairro: 'Centro',
                numero: '10'
            }
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    })

    test('Deve retornar 400 se faltar userId ou cpf', async () => {
        req.body.cpf = undefined

        await createPassengerHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'ID do usuário e CPF são obrigatórios.' })
        expect(mockQuery).not.toHaveBeenCalled()
    })

    test('Deve retornar 201 e cadastrar com sucesso', async () => {
        mockQuery.mockResolvedValueOnce({ rowCount: 1 })

        await createPassengerHandler(req, res)

        expect(mockQuery).toHaveBeenCalledWith(
            expect.any(String),
            [1, '111.222.333-44', '65620-000', 'Rua A', 'Centro', '10']
        )
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({ message: 'Passageiro cadastrado com sucesso!' })
    })

    test('Deve retornar 409 se CPF ou Usuário já existirem (Erro 23505)', async () => {
        const dbError = new Error('Unique violation')
        dbError.code = '23505'
        mockQuery.mockRejectedValueOnce(dbError)

        await createPassengerHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({ message: 'CPF ou Usuário já cadastrados.' })
    })

    test('Deve retornar 500 para outros erros do banco', async () => {
        const dbError = new Error('Falha de conexão')
        mockQuery.mockRejectedValueOnce(dbError)
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        await createPassengerHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor.' })
        expect(consoleSpy).toHaveBeenCalledWith('Erro no cadastro de passageiro:', dbError)

        consoleSpy.mockRestore()
    })
})