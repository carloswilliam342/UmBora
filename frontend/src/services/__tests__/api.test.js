import axios from 'axios';

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  };
  return {
    create: jest.fn(() => mockInstance),
    __mockInstance: mockInstance,
  };
});

import * as api from '../api';

describe('API Service', () => {
  const mockAxios = axios.__mockInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyToBeDriver', () => {
    it('deve chamar o endpoint correto com os dados fornecidos e retornar sucesso', async () => {
      const applicationData = { userId: 1, cnh: '123' };
      const responseData = { success: true, message: 'Sucesso' };
      
      mockAxios.post.mockResolvedValueOnce({ data: responseData });

      const result = await api.applyToBeDriver(applicationData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/drivers/apply', applicationData);
      expect(result).toEqual(responseData);
    });

    it('deve lançar erro com a mensagem do servidor em caso de falha', async () => {
      const errorMessage = 'Erro ao cadastrar';
      mockAxios.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      await expect(api.applyToBeDriver({})).rejects.toThrow(errorMessage);
    });

    it('deve lançar erro genérico quando o servidor não responder com mensagem', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.applyToBeDriver({})).rejects.toThrow('Não foi possível conectar ao servidor.');
    });
  });

  describe('getUserProfile', () => {
    it('deve chamar o endpoint correto e retornar os dados do usuário', async () => {
      const userId = 123;
      const responseData = { id: 123, name: 'João' };
      
      mockAxios.get.mockResolvedValueOnce({ data: responseData });

      const result = await api.getUserProfile(userId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/users/${userId}`);
      expect(result).toEqual(responseData);
    });

    it('deve lançar erro se a busca falhar', async () => {
      const errorMessage = 'Usuário não encontrado';
      mockAxios.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      await expect(api.getUserProfile(999)).rejects.toThrow(errorMessage);
    });
  });

  describe('updateUserProfile', () => {
    it('deve chamar o endpoint correto com os dados e retornar sucesso', async () => {
      const userId = 123;
      const userData = { name: 'João Atualizado' };
      const responseData = { success: true };
      
      mockAxios.put.mockResolvedValueOnce({ data: responseData });

      const result = await api.updateUserProfile(userId, userData);

      expect(mockAxios.put).toHaveBeenCalledWith(`/api/users/${userId}`, userData);
      expect(result).toEqual(responseData);
    });

    it('deve lançar erro se a atualização falhar', async () => {
      const errorMessage = 'Erro ao atualizar';
      mockAxios.put.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      await expect(api.updateUserProfile(1, {})).rejects.toThrow(errorMessage);
    });
  });
});
