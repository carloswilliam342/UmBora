import axios from "axios";
import { API_URL } from "../config";

/**
 * Buscar dados do passageiro pelo userId
 */
export const getPassengerByUserId = async (userId) => {
    const response = await axios.get(`${API_URL}/api/passenger/${userId}`);
    return response.data;
};

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
 * Buscar caronas disponíveis próximas com busca inteligente
 */
export const getAvailableRides = async (latitude, longitude, radius = 10, searchText = null) => {
    const params = { lat: latitude, lng: longitude, radius };

    // Adicionar texto de busca se fornecido
    if (searchText) {
        params.searchText = searchText;
    }

    const response = await axios.get(`${API_URL}/api/rides/available`, { params });
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

/**
 * Buscar detalhes completos de uma carona
 */
export const getRideDetails = async (rideId) => {
    const response = await axios.get(`${API_URL}/api/rides/${rideId}`);
    return response.data;
};

/**
 * Passageiro solicita vaga em uma carona
 */
export const requestRide = async (rideId, passengerId, numberOfPassengers, paymentMethod) => {
    const response = await axios.post(`${API_URL}/api/rides/${rideId}/request`, {
        passengerId,
        numberOfPassengers,
        paymentMethod
    });
    return response.data;
};

/**
 * Cancelar solicitação de vaga (para passageiro)
 */
export const cancelRideRequest = async (rideId, passengerId) => {
    const response = await axios.put(`${API_URL}/api/rides/${rideId}/passengers/${passengerId}`, {
        status: 'cancelled'
    });
    return response.data;
};

/**
 * Buscar solicitações pendentes do motorista
 */
export const getDriverPendingRequests = async (driverId, rideId = null) => {
    const params = {};
    if (rideId) {
        params.rideId = rideId;
    }
    const response = await axios.get(`${API_URL}/api/rides/driver/${driverId}/pending-requests`, { params });
    return response.data;
};

/**
 * Motorista aceita solicitação de passageiro
 */
export const acceptRideRequest = async (rideId, passengerId) => {
    const response = await axios.put(`${API_URL}/api/rides/${rideId}/passengers/${passengerId}`, {
        status: 'confirmed'
    });
    return response.data;
};

/**
 * Motorista rejeita solicitação de passageiro
 */
export const rejectRideRequest = async (rideId, passengerId) => {
    const response = await axios.put(`${API_URL}/api/rides/${rideId}/passengers/${passengerId}`, {
        status: 'rejected'
    });
    return response.data;
};

