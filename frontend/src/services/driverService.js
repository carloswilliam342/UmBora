import axios from 'axios';
import { API_URL } from '../config';

/**
 * Buscar perfil do motorista por userId
 * @param {number} userId - ID do usuário
 * @returns {Promise} - Dados do motorista ou null se não for motorista
 */
export const getDriverProfile = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/api/drivers/profile/${userId}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Usuário não é motorista
            return null;
        }
        throw error;
    }
};

/**
 * Atualizar perfil do motorista
 * @param {number} userId - ID do usuário
 * @param {object} data - Dados para atualizar (location, isAvailable, vehicle)
 * @returns {Promise} - Resposta da API
 */
export const updateDriverProfile = async (userId, data) => {
    const response = await axios.put(`${API_URL}/api/drivers/profile/${userId}`, data);
    return response.data;
};

/**
 * Cadastrar novo motorista (já existe em api.js, mas vou manter aqui também)
 * @param {object} driverData - Dados do motorista
 * @returns {Promise} - Resposta da API
 */
export const applyToBeDriver = async (driverData) => {
    const response = await axios.post(`${API_URL}/api/drivers/apply`, driverData);
    return response.data;
};
