import { jest } from '@jest/globals'

const mockQuery = jest.fn()
jest.unstable_mockModule('../db.js', () => ({
  pool: { query: mockQuery }
}))

const mockHash = jest.fn()
jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: mockHash }
}))

const { getUserHandler, updateUserHandler } = await import('../routes/userRoutes.js')

describe('Rotas de Usuário (User)', () => {
  let req, res

  beforeEach(() => {
    jest.resetAllMocks()

    req = {
      params: { userId: '1' },
      body: {}
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  describe('GET /api/users/:userId - Buscar Usuário', () => {
    test('Deve retornar 200 e os dados se o usuário existir', async () => {
      const dbUser = { id: 1, name: 'Yure', email: 'yure@email.com', phone: '86999999999' }
      mockQuery.mockResolvedValueOnce({ rows: [dbUser] })

      await getUserHandler(req, res)

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1'])
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ user: dbUser })
    })

    test('Deve retornar 404 se o usuário não for encontrado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await getUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' })
    })

    test('Deve retornar 500 para erro no banco', async () => {
      const dbError = new Error('Falha no banco')
      mockQuery.mockRejectedValueOnce(dbError)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await getUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      consoleSpy.mockRestore()
    })
  })

  describe('PUT /api/users/:userId - Atualizar Usuário', () => {
    
    test('Deve retornar 400 para formato de e-mail inválido', async () => {
      req.body = { email: 'emailsemarroba.com' }
      await updateUserHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Formato de e-mail inválido.' })
    })

    test('Deve retornar 400 para telefone com formato inválido', async () => {
      req.body = { phone: '123' }
      await updateUserHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Formato de telefone inválido. Use apenas números (10-11 dígitos).' })
    })

    test('Deve retornar 400 para senha com menos de 6 caracteres', async () => {
      req.body = { password: '12345' }
      await updateUserHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'A senha deve ter no mínimo 6 caracteres.' })
    })

    test('Deve retornar 404 se o usuário não existir', async () => {
      req.body = { name: 'Novo Nome' }
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await updateUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' })
    })

    test('Deve retornar 400 se nenhum campo válido for enviado (ex: strings vazias)', async () => {
      req.body = { name: '   ', password: '      ' }
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }) 

      await updateUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido fornecido para atualização.' })
    })

    test('Deve atualizar NOME, EMAIL e TELEFONE com sucesso (Sem mexer na senha)', async () => {
      req.body = { name: 'Yure Pires', email: 'YURE@EMAIL.COM', phone: '(86) 99999-9999' }
      
      const updatedUser = { id: 1, name: 'Yure Pires', email: 'yure@email.com', phone: '86999999999' }

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [updatedUser] })

      await updateUserHandler(req, res)

      expect(mockHash).not.toHaveBeenCalled() 
      
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dados atualizados com sucesso!',
        user: updatedUser
      })
    })

    test('Deve atualizar a SENHA com sucesso', async () => {
      req.body = { password: 'nova_senha_forte' }
      
      mockHash.mockResolvedValueOnce('hash_da_nova_senha')
      
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })

      await updateUserHandler(req, res)

      expect(mockHash).toHaveBeenCalledWith('nova_senha_forte', expect.any(Number))
      expect(res.status).toHaveBeenCalledWith(200)
    })

    test('Deve retornar 409 se tentar atualizar para um e-mail já existente (Erro 23505)', async () => {
      req.body = { email: 'email.em.uso@teste.com' }

      const dbError = new Error('Unique violation')
      dbError.code = '23505'
      dbError.constraint = 'users_email_key'

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(dbError)

      await updateUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ message: 'Este e-mail já está em uso por outro usuário.' })
    })

    test('Deve retornar 500 em caso de erro no banco de dados', async () => {
      req.body = { name: 'Teste' }
      
      mockQuery.mockRejectedValueOnce(new Error('Falha crítica'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await updateUserHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      consoleSpy.mockRestore()
    })
  })
})