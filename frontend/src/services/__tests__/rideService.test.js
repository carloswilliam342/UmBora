import axios from 'axios';
import {
    getPassengerByUserId,
    getNearbyDrivers,
    createRide,
    getDriverRides,
    getAvailableRides,
    updateRide,
    cancelRide,
    getRideDetails,
    requestRide,
    getDriverPendingRequests,
    acceptRideRequest,
    rejectRideRequest,
    getPassengerRequests,
    cancelRideRequest,
    updateRideStatus
} from '../rideService';
import { API_URL } from '../../config';

jest.mock('axios');

describe('rideService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getPassengerByUserId should call API and return data', async () => {
        const mockData = { id: 1, name: 'Passageiro' };
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getPassengerByUserId(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/passenger/1`);
        expect(result).toEqual(mockData);
    });

    it('getNearbyDrivers should call API and return data', async () => {
        const mockData = [{ id: 1, name: 'Motorista' }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getNearbyDrivers(-23.5, -46.6);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/nearby`, {
            params: { lat: -23.5, lng: -46.6 }
        });
        expect(result).toEqual(mockData);
    });

    it('createRide should call API and return data', async () => {
        const mockData = { id: 1, success: true };
        axios.post.mockResolvedValueOnce({ data: mockData });

        const rideData = { from: 'A', to: 'B' };
        const result = await createRide(rideData);

        expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/rides/create`, rideData);
        expect(result).toEqual(mockData);
    });

    it('getDriverRides should call API and return data', async () => {
        const mockData = [{ id: 1, from: 'A' }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getDriverRides(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/driver/1`);
        expect(result).toEqual(mockData);
    });

    it('getAvailableRides should call API without searchText', async () => {
        const mockData = [{ id: 1 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getAvailableRides(-23.5, -46.6, 15);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/available`, {
            params: { lat: -23.5, lng: -46.6, radius: 15 }
        });
        expect(result).toEqual(mockData);
    });

    it('getAvailableRides should call API with searchText', async () => {
        const mockData = [{ id: 1 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getAvailableRides(-23.5, -46.6, 10, 'Centro');

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/available`, {
            params: { lat: -23.5, lng: -46.6, radius: 10, searchText: 'Centro' }
        });
        expect(result).toEqual(mockData);
    });

    it('updateRide should call API and return data', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValueOnce({ data: mockData });

        const result = await updateRide(1, { seats: 2 });

        expect(axios.put).toHaveBeenCalledWith(`${API_URL}/api/rides/1`, { seats: 2 });
        expect(result).toEqual(mockData);
    });

    it('cancelRide should call API and return data', async () => {
        const mockData = { success: true };
        axios.delete.mockResolvedValueOnce({ data: mockData });

        const result = await cancelRide(1);

        expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/api/rides/1`);
        expect(result).toEqual(mockData);
    });

    it('getRideDetails should call API and return data', async () => {
        const mockData = { id: 1, seats: 4 };
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getRideDetails(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/1`);
        expect(result).toEqual(mockData);
    });

    it('requestRide should call API and return data', async () => {
        const mockData = { success: true };
        axios.post.mockResolvedValueOnce({ data: mockData });

        const result = await requestRide(1, 2, 1, 'PIX');

        expect(axios.post).toHaveBeenCalledWith(`${API_URL}/api/rides/1/request`, {
            passengerId: 2,
            numberOfPassengers: 1,
            paymentMethod: 'PIX'
        });
        expect(result).toEqual(mockData);
    });

    it('getDriverPendingRequests should call API with rideId', async () => {
        const mockData = [{ id: 1 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getDriverPendingRequests(1, 2);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/driver/1/pending-requests`, {
            params: { rideId: 2 }
        });
        expect(result).toEqual(mockData);
    });

    it('getDriverPendingRequests should call API without rideId', async () => {
        const mockData = [{ id: 1 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getDriverPendingRequests(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/driver/1/pending-requests`, {
            params: {}
        });
        expect(result).toEqual(mockData);
    });

    it('acceptRideRequest should call API and return data', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValueOnce({ data: mockData });

        const result = await acceptRideRequest(1, 2);

        expect(axios.put).toHaveBeenCalledWith(`${API_URL}/api/rides/1/passengers/2`, {
            status: 'confirmed'
        });
        expect(result).toEqual(mockData);
    });

    it('rejectRideRequest should call API and return data', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValueOnce({ data: mockData });

        const result = await rejectRideRequest(1, 2);

        expect(axios.put).toHaveBeenCalledWith(`${API_URL}/api/rides/1/passengers/2`, {
            status: 'rejected'
        });
        expect(result).toEqual(mockData);
    });

    it('getPassengerRequests should call API and return data', async () => {
        const mockData = [{ id: 1 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        const result = await getPassengerRequests(2);

        expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/rides/passengers/2/requests`);
        expect(result).toEqual(mockData);
    });

    it('cancelRideRequest should call API and return data', async () => {
        const mockData = { success: true };
        axios.delete.mockResolvedValueOnce({ data: mockData });

        const result = await cancelRideRequest(1, 2);

        expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/api/rides/1/requests/2`);
        expect(result).toEqual(mockData);
    });

    it('updateRideStatus should call API and return data', async () => {
        const mockData = { success: true };
        axios.put.mockResolvedValueOnce({ data: mockData });

        const result = await updateRideStatus(1, 'completed');

        expect(axios.put).toHaveBeenCalledWith(`${API_URL}/api/rides/1/status`, {
            status: 'completed'
        });
        expect(result).toEqual(mockData);
    });
});
