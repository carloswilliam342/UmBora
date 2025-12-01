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
