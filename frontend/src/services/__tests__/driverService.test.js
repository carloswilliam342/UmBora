import axios from 'axios';
import {
    getDriverProfile,
    updateDriverProfile,
    applyToBeDriver
} from '../driverService';
import { API_URL } from '../../config';

jest.mock('axios');

describe('driverService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getDriverProfile should call API and return data', async () => {
        const mockData = { id: 1, name: 'Motorista' };
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getDriverProfile(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/drivers/profile/1`);
        expect(result).toEqual(mockData);
    });

    it('getDriverProfile should return null if status is 404', async () => {
        const error = { response: { status: 404 } };
        axios.get.mockRejectedValueOnce(error);

        const result = await getDriverProfile(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/drivers/profile/1`);
        expect(result).toBeNull();
    });

    it('getDriverProfile should throw error if status is not 404', async () => {
        const error = { response: { status: 500 } };
        axios.get.mockRejectedValueOnce(error);

        await expect(getDriverProfile(1)).rejects.toEqual(error);
        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/drivers/profile/1`);
    });

    it('updateDriverProfile should call API and return data', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValueOnce({ data: mockData });

        const updateData = { isAvailable: true };
        const result = await updateDriverProfile(1, updateData);

        expect(axios.put).toHaveBeenCalledWith(`${API_URL}/api/drivers/profile/1`, updateData);
        expect(result).toEqual(mockData);
    });

    it('applyToBeDriver should call API and return data', async () => {
        const mockData = { success: true };
        axios.post.mockResolvedValueOnce({ data: mockData });

        const driverData = { name: 'João' };
        const result = await applyToBeDriver(driverData);

        expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/drivers/apply`, driverData);
        expect(result).toEqual(mockData);
    });
});
