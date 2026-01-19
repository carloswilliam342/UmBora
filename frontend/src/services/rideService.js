import axios from "axios";
import { API_URL } from "../config";

// Buscar motoristas próximos (já existia)
export const getNearbyDrivers = async (latitude, longitude) => {
    const response = await axios.get(`${API_URL}/api/rides/nearby`, {
        params: { lat: latitude, lng: longitude }
    });
    return response.data;
};

// NOVAS FUNÇÕES PARA GERENCIAMENTO DE CARONAS

/**
 * Cadastrar nova carona
 */
export const createRide = async (rideData) => {
    const response = await axios.post(`${API_URL}/api/rides/create`, rideData);
    return response.data;
};

/**
 * Listar caronas de um motorista
 */
export const getDriverRides = async (driverId) => {
    const response = await axios.get(`${API_URL}/api/rides/driver/${driverId}`);
    return response.data;
};

/**
 * Buscar caronas disponíveis próximas
 */
export const getAvailableRides = async (latitude, longitude, radius = 10) => {
    const response = await axios.get(`${API_URL}/api/rides/available`, {
        params: { lat: latitude, lng: longitude, radius }
    });
    return response.data;
};

/**
 * Atualizar carona
 */
export const updateRide = async (rideId, updates) => {
    const response = await axios.put(`${API_URL}/api/rides/${rideId}`, updates);
    return response.data;
};

/**
 * Cancelar carona
 */
export const cancelRide = async (rideId) => {
    const response = await axios.delete(`${API_URL}/api/rides/${rideId}`);
    return response.data;
};
