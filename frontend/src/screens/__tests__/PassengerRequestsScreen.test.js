import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import PassengerRequestsScreen from '../PassengerRequestsScreen';
import { getPassengerRequests, cancelRideRequest, getPassengerByUserId } from '../../services/rideService';
import { getUserSession } from '../../services/authService';
import { Alert } from 'react-native';

jest.mock('../../services/rideService');
jest.mock('../../services/authService');

// Mimic the real useFocusEffect: re-run whenever the callback identity changes
// (the screen wraps it in useCallback([passengerId]), so it must re-run when passengerId updates)
jest.mock('@react-navigation/native', () => ({
    useFocusEffect: jest.fn((callback) => {
        const React = require('react');
        React.useEffect(() => {
            const unsubscribe = callback();
            return unsubscribe;
        }, [callback]);
    }),
}));

const mockRequest = {
    id: 1,
    status: 'pending',
    numberOfPassengers: 2,
    paymentMethod: 'cash',
    requestedAt: '2023-12-01T09:00:00Z',
    rideId: 10,
    ride: {
        origin: { address: 'Rua A' },
        destination: { address: 'Rua B' },
        departureTime: '2023-12-01T10:00:00Z',
    },
};

const mockConfirmedRequest = {
    id: 2,
    status: 'confirmed',
    numberOfPassengers: 1,
    paymentMethod: 'pix',
    requestedAt: '2023-12-01T08:00:00Z',
    rideId: 11,
    ride: {
        origin: { address: 'Av C' },
        destination: { address: 'Av D' },
        departureTime: '2023-12-02T14:00:00Z',
    },
    driver: {
        name: 'Motorista João',
        phone: '11999999999',
    },
};

describe('PassengerRequestsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve exibir estado de carregamento inicialmente', async () => {
        // Stall at the very first await so nothing re-renders and loading stays true
        getUserSession.mockReturnValue(new Promise(() => {})); // never resolves
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        getPassengerRequests.mockResolvedValue({ requests: [] });

        // Awaiting render flushes the initial commit so screen is populated
        await render(<PassengerRequestsScreen />);

        expect(screen.getByText('Carregando solicitações...')).toBeTruthy();
    });

    it('deve exibir estado vazio quando não há solicitações', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        getPassengerRequests.mockResolvedValue({ requests: [] });

        render(<PassengerRequestsScreen />);

        await waitFor(() => {
            expect(screen.getByText('Nenhuma solicitação ainda')).toBeTruthy();
            expect(screen.getByText('Busque caronas e solicite vagas para vê-las aqui')).toBeTruthy();
        });
    });

    it('deve exibir lista de solicitações pendentes', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        getPassengerRequests.mockResolvedValue({ requests: [mockRequest] });

        render(<PassengerRequestsScreen />);

        await waitFor(() => {
            expect(screen.getByText('📋 Minhas Solicitações')).toBeTruthy();
            expect(screen.getByText('1 solicitação(ões)')).toBeTruthy();
            expect(screen.getByText(/PENDENTE/)).toBeTruthy();
            expect(screen.getByText('Rua A')).toBeTruthy();
            expect(screen.getByText('Rua B')).toBeTruthy();
            expect(screen.getByText('Cancelar Solicitação')).toBeTruthy();
        });
    });

    it('deve exibir informações do motorista em solicitação confirmada', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        getPassengerRequests.mockResolvedValue({ requests: [mockConfirmedRequest] });

        render(<PassengerRequestsScreen />);

        await waitFor(() => {
            expect(screen.getByText(/CONFIRMADA/)).toBeTruthy();
            expect(screen.getByText('Motorista João')).toBeTruthy();
            expect(screen.getByText('📞 Ligar')).toBeTruthy();
        });
    });

    it('deve exibir header com contagem de múltiplas solicitações', async () => {
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockResolvedValue({ passenger: { id: 2 } });
        getPassengerRequests.mockResolvedValue({ requests: [mockRequest, mockConfirmedRequest] });

        render(<PassengerRequestsScreen />);

        await waitFor(() => {
            expect(screen.getByText('2 solicitação(ões)')).toBeTruthy();
        });
    });

    it('deve tratar erro ao carregar passageiro', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getUserSession.mockResolvedValue(1);
        getPassengerByUserId.mockRejectedValue(new Error('Erro'));

        render(<PassengerRequestsScreen />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });
});
