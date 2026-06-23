import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../db.js', () => ({
    pool: {
        query: mockQuery
    }
}));

const { getPassengerHandler } = await import('../routes/passengerRoutes.js');

describe('GET /api/passenger/:userId - Busca', () => {
    let req, res;

    beforeEach(() => {
        jest.resetAllMocks();

        req = {
            params: { userId: '1' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('Deve retornar 200 e os dados do passageiro se for encontrado', async () => {
        const mockPassenger = { id: 5, user_id: 1, cpf: '111.222.333-44' };
        mockQuery.mockResolvedValueOnce({ rows: [mockPassenger] });

        await getPassengerHandler(req, res);

        expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            passenger: mockPassenger
        });
    });

    test('Deve retornar 404 se o passageiro não for encontrado', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await getPassengerHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Passageiro não encontrado.' });
    });

    test('Deve retornar 500 se ocorrer erro no banco', async () => {
        const dbError = new Error('Falha de conexão');
        mockQuery.mockRejectedValueOnce(dbError);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await getPassengerHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor.' });
        expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar passageiro:', dbError);

        consoleSpy.mockRestore();
    });
});