import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveUserSession,
  getUserSession,
  clearUserSession,
  isLoggedIn,
} from '../authService';

describe('authService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveUserSession', () => {
    it('deve salvar o ID do usuario como string', async () => {
      const success = await saveUserSession(123);
      expect(success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@umbora:userId', '123');
    });

    it('deve retornar false se ocorrer um erro', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Erro de escrita'));
      const success = await saveUserSession(123);
      expect(success).toBe(false);
    });
  });

  describe('getUserSession', () => {
    it('deve retornar o ID do usuario como numero se estiver salvo', async () => {
      await AsyncStorage.setItem('@umbora:userId', '456');
      const userId = await getUserSession();
      expect(userId).toBe(456);
    });

    it('deve retornar null se nao houver sessao', async () => {
      const userId = await getUserSession();
      expect(userId).toBeNull();
    });

    it('deve retornar null se ocorrer um erro', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Erro de leitura'));
      const userId = await getUserSession();
      expect(userId).toBeNull();
    });
  });

  describe('clearUserSession', () => {
    it('deve remover a chave do usuario do AsyncStorage', async () => {
      await AsyncStorage.setItem('@umbora:userId', '123');
      const success = await clearUserSession();
      expect(success).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@umbora:userId');
      
      const userId = await getUserSession();
      expect(userId).toBeNull();
    });

    it('deve retornar false se ocorrer um erro', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Erro ao remover'));
      const success = await clearUserSession();
      expect(success).toBe(false);
    });
  });

  describe('isLoggedIn', () => {
    it('deve retornar true se o usuario estiver logado', async () => {
      await AsyncStorage.setItem('@umbora:userId', '123');
      const logged = await isLoggedIn();
      expect(logged).toBe(true);
    });

    it('deve retornar false se o usuario nao estiver logado', async () => {
      const logged = await isLoggedIn();
      expect(logged).toBe(false);
    });
  });
});
