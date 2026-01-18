import axios from "axios";
import { API_URL } from "../config";

export const getNearbyDrivers = async (latitude, longitude) => {
    const response = await axios.get(`${API_URL}/api/rides/nearby`, {
        params: { lat: latitude, lng: longitude }
    });
    return response.data;
};
