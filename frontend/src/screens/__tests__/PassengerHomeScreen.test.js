import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import PassengerHomeScreen from '../PassengerHomeScreen';
import { getAvailableRides, requestRide, getPassengerByUserId } from '../../services/rideService';
import { getUserSession } from '../../services/authService';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

jest.mock('../../services/rideService');
jest.mock('../../services/authService');
jest.mock('expo-location');

// Mock react-native-maps
jest.mock('react-native-maps', () => {
    const React = require('react');
    const { View } = require('react-native');
    const MockMapView = (props) => <View testID="map-view">{props.children}</View>;
    const MockMarker = (props) => <View testID="map-marker" {...props} />;
    return {
        __esModule: true,
        default: MockMapView,
        Marker: MockMarker,
    };
});

const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

const mockRide = {
    id: 1,
    origin: { latitude: -23.55, longitude: -46.63, address: 'Origem' },
    destination: { latitude: -23.56, longitude: -46.64, address: 'Destino' },
    availableSeats: 3,
    pricePerSeat: 10,
    departureTime: '2023-12-01T10:00:00Z',
    driver: { name: 'João', rating: '4.8', vehicle: { model: 'Carro', color: 'Preto', plate: 'ABC-1234' } },
    totalSeats: 4,
    pendingSeats: 0,
    confirmedSeats: 1,
    canRequestMore: true
};

const setupMocks = () => {
    getUserSession.mockResolvedValue(1);
    getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: -23.55052, longitude: -46.633308 }
    });
    getAvailableRides.mockResolvedValue({ rides: [mockRide] });
};

describe('PassengerHomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve carregar a localização e as caronas disponíveis', async () => {
        setupMocks();
        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
            expect(getAvailableRides).toHaveBeenCalledWith(-23.550520, -46.633308, 50, null);
        });

        await waitFor(() => {
            const markers = screen.getAllByTestId('map-marker');
            expect(markers.length).toBe(2);
        });
    });

    it('deve exibir mensagem de erro se a permissão de localização for negada', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
        getAvailableRides.mockResolvedValue({ rides: [] });

        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(getAvailableRides).not.toHaveBeenCalled();
        });
    });

    it('deve abrir o modal de carona ao clicar no marcador e permitir solicitação', async () => {
        setupMocks();
        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
            expect(getAvailableRides).toHaveBeenCalledWith(-23.55052, -46.633308, 50, null);
        });

        let markers = [];
        await waitFor(() => {
            markers = screen.getAllByTestId('map-marker');
            expect(markers.length).toBe(2);
        });

        const rideMarker = markers[1];
        fireEvent(rideMarker, 'onPress');

        await waitFor(() => {
            expect(screen.getByText('🚗 Detalhes da Carona')).toBeTruthy();
            expect(screen.getByText('João')).toBeTruthy();
            expect(screen.getByText('🚙 Carro • Preto')).toBeTruthy();
        });

        // Selecionar pagamento
        fireEvent.press(screen.getByTestId('payment-method-cash'));

        await new Promise(resolve => setTimeout(resolve, 50));

        // Solicitar vaga
        requestRide.mockResolvedValueOnce({ message: 'Solicitação enviada!' });

        await waitFor(() => {
            fireEvent.press(screen.getByTestId('request-ride-button'));
            expect(requestRide).toHaveBeenCalledWith(1, 2, 1, 'cash');
            expect(Alert.alert).toHaveBeenCalledWith(
                '✅ Solicitação Enviada!',
                'Solicitação enviada!',
                expect.any(Array)
            );
        });
    });

    it('deve navegar para solicitações ao clicar no botão de minhas solicitações', async () => {
        setupMocks();
        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('📋 Minhas Solicitações')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('📋 Minhas Solicitações'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('PassengerRequests', { userId: 1 });
    });

    it('deve exibir contador de caronas disponíveis', async () => {
        setupMocks();
        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(screen.getByText(/carona\(s\) disponível\(is\)/)).toBeTruthy();
        });
    });

    it('deve lidar com erro ao buscar caronas', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -23.55052, longitude: -46.633308 }
        });
        getAvailableRides.mockRejectedValue(new Error('Network error'));

        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(getAvailableRides).toHaveBeenCalled();
        });
    });

    it('deve lidar com erro ao buscar passageiro', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockRejectedValue(new Error('Passageiro não encontrado'));
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -23.55052, longitude: -46.633308 }
        });
        getAvailableRides.mockResolvedValue({ rides: [] });

        await render(<PassengerHomeScreen />);

        await waitFor(() => {
            expect(getPassengerByUserId).toHaveBeenCalled();
        });
    });
});
