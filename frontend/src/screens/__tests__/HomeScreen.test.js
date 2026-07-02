import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';
import { getDriverProfile } from '../../services/driverService';
import { getDriverPendingRequests } from '../../services/rideService';
import { Alert } from 'react-native';

jest.mock('../../services/driverService');
jest.mock('../../services/rideService');

// Override useRoute to pass userId
jest.mock('@react-navigation/native', () => {
    const mockNav = jest.fn();
    return {
        useNavigation: () => ({
            navigate: mockNav,
            goBack: jest.fn(),
            replace: jest.fn(),
        }),
        useRoute: () => ({ params: { userId: 1 } }),
        useFocusEffect: jest.fn((cb) => {
            const React = require('react');
            React.useEffect(() => {
                cb();
            }, [cb]);
        }),
    };
});

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve renderizar a tela de boas-vindas para passageiro (não motorista)', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        getDriverPendingRequests.mockResolvedValue({ count: 0 });

        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('Bem-vindo ao Umbora!')).toBeTruthy();
            expect(screen.getByText('BUSCAR CORRIDA')).toBeTruthy();
        });

        // Não deve exibir botões de motorista
        expect(screen.queryByText('+ Cadastrar Nova Carona')).toBeNull();
    });

    it('deve renderizar botões de motorista quando é motorista', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: true, driver: { id: 5 } });
        getDriverPendingRequests.mockResolvedValue({ count: 3 });

        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('Bem-vindo ao Umbora!')).toBeTruthy();
        });

        await waitFor(() => {
            expect(screen.getByText('+ Cadastrar Nova Carona')).toBeTruthy();
            expect(screen.getByText('📋 Ver Minhas Caronas')).toBeTruthy();
        });
    });

    it('deve navegar para PassengerHome ao clicar em BUSCAR CORRIDA', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        getDriverPendingRequests.mockResolvedValue({ count: 0 });

        const nav = require('@react-navigation/native').useNavigation();
        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('BUSCAR CORRIDA')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('BUSCAR CORRIDA'));

        expect(nav.navigate).toHaveBeenCalledWith('PassengerHome', { userId: 1 });
    });

    it('deve tratar erro ao verificar se é motorista', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getDriverProfile.mockRejectedValue(new Error('Network error'));
        getDriverPendingRequests.mockResolvedValue({ count: 0 });

        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('Bem-vindo ao Umbora!')).toBeTruthy();
        });

        consoleSpy.mockRestore();
    });

    it('deve exibir texto de subtítulo', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        getDriverPendingRequests.mockResolvedValue({ count: 0 });

        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText(/Busque por caronas ou cadastre-se como motorista/)).toBeTruthy();
        });
    });

    it('deve exibir o logo Umbora', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        getDriverPendingRequests.mockResolvedValue({ count: 0 });

        await render(<HomeScreen />);

        await waitFor(() => {
            expect(screen.getByText('Umbora')).toBeTruthy();
        });
    });
});
