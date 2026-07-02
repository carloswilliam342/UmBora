import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import DriverEditScreen from '../DriverEditScreen';
import { getDriverProfile, updateDriverProfile } from '../../services/driverService';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

jest.mock('../../services/driverService');
jest.mock('expo-location');

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    const Picker = (props) => <View testID="picker" {...props}>{props.children}</View>;
    Picker.Item = (props) => <Text>{props.label}</Text>;
    return { Picker };
});

const mockNavigation = {
    goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
    useRoute: () => ({ params: { userId: 1 } }),
}));

describe('DriverEditScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve exibir loading enquanto carrega os dados', async () => {
        getDriverProfile.mockReturnValue(new Promise(() => {})); // never resolves

        await render(<DriverEditScreen />);

        expect(screen.getByText('Carregando dados...')).toBeTruthy();
    });

    it('deve renderizar o formulário com dados do motorista', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: 'Fiat Uno', placa: 'ABC-1234', cor: 'Branco' },
                location: { latitude: -23.55, longitude: -46.63 },
                isAvailable: true,
            },
        });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByText('Editar Cadastro de Motorista')).toBeTruthy();
            expect(screen.getByDisplayValue('Fiat Uno')).toBeTruthy();
            expect(screen.getByDisplayValue('ABC-1234')).toBeTruthy();
        });
    });

    it('deve voltar se usuário não é motorista', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Você não está cadastrado como motorista.');
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it('deve tratar erro ao carregar dados', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getDriverProfile.mockRejectedValue(new Error('Erro'));

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Não foi possível carregar seus dados.');
        });

        consoleSpy.mockRestore();
    });

    it('deve editar campos do veículo', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: 'Fiat Uno', placa: 'ABC-1234', cor: 'Branco' },
                location: null,
                isAvailable: false,
            },
        });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Fiat Uno')).toBeTruthy();
        });

        fireEvent.changeText(screen.getByDisplayValue('Fiat Uno'), 'VW Gol');

        await waitFor(() => {
            expect(screen.getByDisplayValue('VW Gol')).toBeTruthy();
        });
    });

    it('deve exibir erro ao salvar sem preencher campos obrigatórios', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: '', placa: '', cor: '' },
                location: null,
                isAvailable: false,
            },
        });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByText('Editar Cadastro de Motorista')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Por favor, preencha todos os campos do veículo.');
        });
    });

    it('deve salvar alterações com sucesso', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: 'Fiat Uno', placa: 'ABC-1234', cor: 'Branco' },
                location: null,
                isAvailable: false,
            },
        });
        updateDriverProfile.mockResolvedValue({ success: true });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Fiat Uno')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(updateDriverProfile).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso!',
                'Seus dados foram atualizados com sucesso.',
                expect.any(Array)
            );
        });
    });

    it('deve atualizar localização do motorista', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: 'Fiat Uno', placa: 'ABC-1234', cor: 'Branco' },
                location: null,
                isAvailable: false,
            },
        });

        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -23.55, longitude: -46.63 }
        });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByText('📍 Atualizar Minha Localização')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('📍 Atualizar Minha Localização'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso!',
                expect.stringContaining('Localização atualizada')
            );
        });
    });

    it('deve tratar permissão de localização negada', async () => {
        getDriverProfile.mockResolvedValue({
            isDriver: true,
            driver: {
                vehicle: { modelo: 'Fiat Uno', placa: 'ABC-1234', cor: 'Branco' },
                location: null,
                isAvailable: false,
            },
        });

        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

        await render(<DriverEditScreen />);

        await waitFor(() => {
            expect(screen.getByText('📍 Atualizar Minha Localização')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('📍 Atualizar Minha Localização'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Permissão negada',
                'Precisamos da sua localização para atualizar sua posição no mapa.'
            );
        });
    });
});
