import { jest } from '@jest/globals'

const mockQuery = jest.fn()

jest.unstable_mockModule('../db.js', () => ({
  pool: { query: mockQuery }
}))

const mockHash = jest.fn()
const mockCompare = jest.fn()

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare
  }
}))

const { registerHandler, loginHandler } = await import('../routes/authRoutes.js')

describe('Rotas de Autenticação (Register / Login)', () => {
  let req, res

  beforeEach(() => {
    jest.resetAllMocks()

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  describe('POST /register - Cadastro de Usuário', () => {
    beforeEach(() => {
      req = {
        body: {
          name: 'Yure',
          email: 'yure@email.com',
          phone: '999999999',
          password: 'senha123'
        }
      }
    })

    test('Deve retornar 400 se faltar name, email ou password', async () => {
      req.body.email = undefined

      await registerHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome, e-mail e senha são obrigatórios.' })
      expect(mockHash).not.toHaveBeenCalled()
    })

    test('Deve criar usuário com sucesso e retornar 201', async () => {
      mockHash.mockResolvedValueOnce('hash_falso_gerado_aqui')
      
      const mockDbReturn = { id: 1, name: 'Yure', email: 'yure@email.com' }
      mockQuery.mockResolvedValueOnce({ rows: [mockDbReturn] })

      await registerHandler(req, res)

      expect(mockHash).toHaveBeenCalledWith('senha123', 10)
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['Yure', 'yure@email.com', '999999999', 'hash_falso_gerado_aqui'])
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário criado com sucesso!',
        user: mockDbReturn
      })
    })

    test('Deve retornar 409 se o email já estiver em uso', async () => {
      mockHash.mockResolvedValueOnce('hash')
      
      const dbError = new Error('Unique')
      dbError.code = '23505'
      mockQuery.mockRejectedValueOnce(dbError)

      await registerHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ message: 'Este e-mail já está em uso.' })
    })

    test('Deve retornar 500 para erro interno', async () => {
      mockHash.mockRejectedValueOnce(new Error('Falha no bcrypt'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await registerHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('POST /login - Autenticação', () => {
    beforeEach(() => {
      req = {
        body: { email: 'yure@email.com', password: 'senha123' }
      }
    })

    test('Deve retornar 400 se faltar email ou password', async () => {
      req.body.password = undefined

      await loginHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'E-mail e senha são obrigatórios.' })
    })

    test('Deve retornar 404 se o usuário não existir no banco', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await loginHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' })
    })

    test('Deve retornar 401 se a senha for incorreta', async () => {
      const dbUser = { id: 1, name: 'Yure', email: 'yure@email.com', password_hash: 'hash_do_banco' }
      mockQuery.mockResolvedValueOnce({ rows: [dbUser] })
      
      mockCompare.mockResolvedValueOnce(false) 

      await loginHandler(req, res)

      expect(mockCompare).toHaveBeenCalledWith('senha123', 'hash_do_banco')
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Senha incorreta.' })
    })

    test('Deve retornar 200 e os dados se a senha for correta', async () => {
      const dbUser = { id: 1, name: 'Yure', email: 'yure@email.com', password_hash: 'hash_do_banco' }
      mockQuery.mockResolvedValueOnce({ rows: [dbUser] })
      
      mockCompare.mockResolvedValueOnce(true)

      await loginHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bem-vindo de volta, Yure!',
        user: { id: 1, name: 'Yure', email: 'yure@email.com' }
      })
    })

    test('Deve retornar 500 para erro interno no banco ou bcrypt', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Erro BD'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await loginHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      consoleSpy.mockRestore()
    })
  })
})