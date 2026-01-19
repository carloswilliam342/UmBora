// frontend/src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SESSION_KEY = '@umbora:userId';

/**
 * Salva o ID do usuário no AsyncStorage após login bem-sucedido
 * @param {number} userId - ID do usuário
 */
export const saveUserSession = async (userId) => {
    try {
        await AsyncStorage.setItem(USER_SESSION_KEY, userId.toString());
        return true;
    } catch (error) {
        console.error('Erro ao salvar sessão do usuário:', error);
        return false;
    }
};

/**
 * Recupera o ID do usuário salvo no AsyncStorage
 * @returns {Promise<number|null>} - ID do usuário ou null se não houver sessão
 */
export const getUserSession = async () => {
    try {
        const userId = await AsyncStorage.getItem(USER_SESSION_KEY);
        return userId ? parseInt(userId, 10) : null;
    } catch (error) {
        console.error('Erro ao recuperar sessão do usuário:', error);
        return null;
    }
};

/**
 * Limpa a sessão do usuário (logout)
 */
export const clearUserSession = async () => {
    try {
        await AsyncStorage.removeItem(USER_SESSION_KEY);
        return true;
    } catch (error) {
        console.error('Erro ao limpar sessão do usuário:', error);
        return false;
    }
};

/**
 * Verifica se existe uma sessão ativa
 * @returns {Promise<boolean>} - true se houver sessão ativa
 */
export const isLoggedIn = async () => {
    const userId = await getUserSession();
    return userId !== null;
};
