import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import DriverRidesScreen from '../DriverRidesScreen';
import { getDriverRides, updateRideStatus } from '../../services/rideService';
import { getDriverProfile } from '../../services/driverService';
import { Alert } from 'react-native';

// Mocks
jest.mock('../../services/rideService');
jest.mock('../../services/driverService');

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

const mockRoute = {
    params: {
        userId: 1,
    },
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
    useRoute: () => mockRoute,
}));

describe('DriverRidesScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    const mockProfile = {
        isDriver: true,
        driver: { id: 1 },
    };

    const mockRidesResponse = {
        rides: [
            {
                id: 101,
                status: 'available',
                origin: { address: 'Origem A' },
                destination: { address: 'Destino A' },
                departureTime: '2023-12-01T10:00:00Z',
                availableSeats: 3,
                pricePerSeat: 15,
            },
            {
                id: 102,
                status: 'in_progress',
                origin: { address: 'Origem B' },
                destination: { address: 'Destino B' },
                departureTime: '2023-12-01T14:00:00Z',
                availableSeats: 2,
                pricePerSeat: 0,
            }
        ],
    };

    it('deve bloquear acesso para quem não é motorista', async () => {
        getDriverProfile.mockResolvedValueOnce({ isDriver: false });

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(getDriverProfile).toHaveBeenCalledWith(1);
            expect(Alert.alert).toHaveBeenCalledWith(
                'Acesso Negado',
                'Apenas motoristas podem acessar esta tela.',
                expect.any(Array)
            );
        });
    });

    it('deve carregar as caronas do motorista corretamente', async () => {
        getDriverProfile.mockResolvedValueOnce(mockProfile);
        getDriverRides.mockResolvedValueOnce(mockRidesResponse);

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(screen.getByText('Minhas Caronas')).toBeTruthy();
            expect(screen.getByText('2 caronas cadastradas')).toBeTruthy();
            expect(screen.getByText('Origem A')).toBeTruthy();
            expect(screen.getByText('Origem B')).toBeTruthy();
        });
    });

    it('deve exibir mensagem de lista vazia quando não houver caronas', async () => {
        getDriverProfile.mockResolvedValueOnce(mockProfile);
        getDriverRides.mockResolvedValueOnce({ rides: [] });

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(screen.getByText('Você ainda não cadastrou nenhuma carona')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('+ Cadastrar Primeira Carona'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('RideCreate', { driverId: 1 });
    });

    it('deve iniciar carona', async () => {
        getDriverProfile.mockResolvedValueOnce(mockProfile);
        getDriverRides.mockResolvedValueOnce(mockRidesResponse);

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(screen.getByText('▶ Iniciar')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('▶ Iniciar'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Iniciar Carona',
                'Deseja marcar esta carona como "Em Andamento"?',
                expect.any(Array)
            );
        });

        // Simulate Alert confirm
        const alertCalls = Alert.alert.mock.calls;
        const confirmAction = alertCalls[0][2][1].onPress;
        
        updateRideStatus.mockResolvedValueOnce({});
        getDriverRides.mockResolvedValueOnce(mockRidesResponse); // for reload

        await confirmAction();

        expect(updateRideStatus).toHaveBeenCalledWith(101, 'in_progress');
        expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Carona marcada como iniciada!');
    });

    it('deve cancelar carona', async () => {
        getDriverProfile.mockResolvedValueOnce(mockProfile);
        getDriverRides.mockResolvedValueOnce(mockRidesResponse);

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(screen.getByText('Cancelar')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Cancelar Carona',
                'Tem certeza que deseja cancelar esta carona?',
                expect.any(Array)
            );
        });

        // Simulate Alert confirm
        const alertCalls = Alert.alert.mock.calls;
        const confirmAction = alertCalls[0][2][1].onPress;
        
        updateRideStatus.mockResolvedValueOnce({});
        getDriverRides.mockResolvedValueOnce(mockRidesResponse); // for reload

        await confirmAction();

        expect(updateRideStatus).toHaveBeenCalledWith(101, 'cancelled');
        expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Carona cancelada com sucesso!');
    });

    it('deve finalizar carona em andamento', async () => {
        getDriverProfile.mockResolvedValueOnce(mockProfile);
        getDriverRides.mockResolvedValueOnce(mockRidesResponse);

        render(<DriverRidesScreen />);

        await waitFor(() => {
            expect(screen.getByText('🏁 Finalizar')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('🏁 Finalizar'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Finalizar Carona',
                'Deseja marcar esta carona como "Concluída"?',
                expect.any(Array)
            );
        });

        // Simulate Alert confirm
        const alertCalls = Alert.alert.mock.calls;
        const confirmAction = alertCalls[0][2][1].onPress;
        
        updateRideStatus.mockResolvedValueOnce({});
        getDriverRides.mockResolvedValueOnce(mockRidesResponse); // for reload

        await confirmAction();

        expect(updateRideStatus).toHaveBeenCalledWith(102, 'completed');
        expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Carona marcada como concluída!');
    });
});
