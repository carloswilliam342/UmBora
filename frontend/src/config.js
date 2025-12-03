import Constants from 'expo-constants';

// Tenta ler do manifest (expo) e cai para um fallback
const manifest = Constants.manifest || Constants.expoConfig || {};

// Se você usa Expo Go no celular, coloque aqui o IP da sua máquina (ex: http://192.168.1.13:3000)
// Este valor foi extraído do backend/.env como sugestão.
const FALLBACK_API = 'http://192.168.1.3:3000';

export const API_URL = (manifest.extra && manifest.extra.API_URL) || process.env.EXPO_PUBLIC_API_URL || FALLBACK_API;

export default {
  API_URL,
};
