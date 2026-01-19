import axios from 'axios';

/**
 * Serviço de Geocoding usando OpenStreetMap Nominatim API (gratuito)
 * Documentação: https://nominatim.org/release-docs/latest/api/Search/
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Buscar endereços baseado em texto (autocomplete)
 * @param {string} query - Texto digitado pelo usuário
 * @param {string} countryCode - Código do país (ex: 'br' para Brasil)
 * @returns {Promise<Array>} Lista de endereços encontrados
 */
export const searchAddress = async (query, countryCode = 'br') => {
    if (!query || query.length < 3) {
        return [];
    }

    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 5,
                countrycodes: countryCode,
            },
            headers: {
                'User-Agent': 'UmBora-App/1.0', // Nominatim requer User-Agent
            },
        });

        return response.data.map(item => ({
            displayName: item.display_name,
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: item.type,
            city: item.address?.city || item.address?.town || item.address?.village || '',
            state: item.address?.state || '',
            country: item.address?.country || '',
        }));
    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        return [];
    }
};

/**
 * Geocoding reverso: obter endereço a partir de coordenadas
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Endereço encontrado
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                addressdetails: 1,
            },
            headers: {
                'User-Agent': 'UmBora-App/1.0',
            },
        });

        return {
            displayName: response.data.display_name,
            address: response.data.display_name,
            latitude: parseFloat(response.data.lat),
            longitude: parseFloat(response.data.lon),
            city: response.data.address?.city || response.data.address?.town || '',
            state: response.data.address?.state || '',
            country: response.data.address?.country || '',
        };
    } catch (error) {
        console.error('Erro ao fazer geocoding reverso:', error);
        return null;
    }
};
