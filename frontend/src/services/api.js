// frontend/src/services/api.js (Novo arquivo)
import axios from 'axios';
import { API_URL } from '../config'; // Importa a URL do seu arquivo de configuração

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função que será chamada pelo formulário de cadastro de motorista
export const applyToBeDriver = async (applicationData) => {
  try {
    // applicationData = { userId, cnh, modelo, placa, cor }
    // A URL final será: http://10.0.0.111:3000/api/drivers/apply
    const response = await apiClient.post('/api/drivers/apply', applicationData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Não foi possível conectar ao servidor.';
    throw new Error(errorMessage);
  }
};

// Função para buscar dados do usuário
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Não foi possível buscar dados do usuário.';
    throw new Error(errorMessage);
  }
};

// Função para atualizar dados do usuário
export const updateUserProfile = async (userId, userData) => {
  try {
    // userData = { name, email, phone, password }
    const response = await apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Não foi possível atualizar dados do usuário.';
    throw new Error(errorMessage);
  }
};

