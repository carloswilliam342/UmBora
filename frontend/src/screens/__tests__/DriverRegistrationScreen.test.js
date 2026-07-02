import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import DriverRegistrationScreen from '../DriverRegistrationScreen';
import { applyToBeDriver } from '../../services/api';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

jest.mock('../../services/api');
jest.mock('expo-location');

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    const Picker = (props) => <View testID="picker" {...props}>{props.children}</View>;
    Picker.Item = (props) => <Text>{props.label}</Text>;
    return { Picker };
});

const mockNavigation = {
    reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
    useRoute: () => ({ params: { userId: 1 } }),
}));

// Preenche todos os campos com dados válidos (inclusive a cor, via Picker)
const fillValidForm = async (queries) => {
    await fireEvent.changeText(queries.getByPlaceholderText('Nome Completo'), 'João Silva');
    await fireEvent.changeText(queries.getByPlaceholderText('CPF'), '52998224725');
    await fireEvent.changeText(queries.getByPlaceholderText('Número da CNH'), '12345678901');
    await fireEvent.changeText(queries.getByPlaceholderText('Modelo do Veículo (ex: Fiat Uno)'), 'Honda Civic');
    await fireEvent.changeText(queries.getByPlaceholderText('Placa do Veículo (ex: ABC-1234)'), 'ABC-1234');
    await fireEvent(queries.getByTestId('picker'), 'valueChange', 'Prata');
};

describe('DriverRegistrationScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: -23.55, longitude: -46.63 }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deve renderizar o formulario de cadastro de motorista', async () => {
        await render(<DriverRegistrationScreen />);

        expect(screen.getByText('Cadastro de Motorista')).toBeTruthy();
        expect(screen.getByText('Informações Pessoais')).toBeTruthy();
        expect(screen.getByText('Informações do Veículo')).toBeTruthy();
        expect(screen.getByPlaceholderText('Nome Completo')).toBeTruthy();
        expect(screen.getByPlaceholderText('CPF')).toBeTruthy();
        expect(screen.getByPlaceholderText('Número da CNH')).toBeTruthy();
        expect(screen.getByPlaceholderText('Modelo do Veículo (ex: Fiat Uno)')).toBeTruthy();
        expect(screen.getByPlaceholderText('Placa do Veículo (ex: ABC-1234)')).toBeTruthy();
    });

    it('deve preencher campos do formulario', async () => {
        const queries = await render(<DriverRegistrationScreen />);

        await fireEvent.changeText(queries.getByPlaceholderText('Nome Completo'), 'João Silva');
        await fireEvent.changeText(queries.getByPlaceholderText('CPF'), '52998224725');
        await fireEvent.changeText(queries.getByPlaceholderText('Número da CNH'), '12345678901');
        await fireEvent.changeText(queries.getByPlaceholderText('Modelo do Veículo (ex: Fiat Uno)'), 'Honda Civic');
        await fireEvent.changeText(queries.getByPlaceholderText('Placa do Veículo (ex: ABC-1234)'), 'ABC-1234');

        expect(screen.getByDisplayValue('João Silva')).toBeTruthy();
        expect(screen.getByDisplayValue('52998224725')).toBeTruthy();
        expect(screen.getByDisplayValue('12345678901')).toBeTruthy();
        expect(screen.getByDisplayValue('Honda Civic')).toBeTruthy();
        expect(screen.getByDisplayValue('ABC-1234')).toBeTruthy();
    });

    it('deve exibir erro ao enviar formulario vazio', async () => {
        const { getByText } = await render(<DriverRegistrationScreen />);

        await fireEvent.press(getByText('Finalizar Cadastro'));

        expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Por favor, preencha todos os campos.');
    });

    it('deve exibir erro de validação para CPF inválido', async () => {
        const { getByPlaceholderText } = await render(<DriverRegistrationScreen />);

        await fireEvent.changeText(getByPlaceholderText('CPF'), '12345678900');

        expect(screen.getByText(/CPF inv/i)).toBeTruthy();
    });

    it('deve exibir erro de validação para CNH inválida', async () => {
        const { getByPlaceholderText } = await render(<DriverRegistrationScreen />);

        await fireEvent.changeText(getByPlaceholderText('Número da CNH'), '12345');

        expect(screen.getByText(/CNH inv/i)).toBeTruthy();
    });

    it('deve exibir erro de validação para placa inválida', async () => {
        const { getByPlaceholderText } = await render(<DriverRegistrationScreen />);

        await fireEvent.changeText(getByPlaceholderText('Placa do Veículo (ex: ABC-1234)'), 'XYZ');

        expect(screen.getByText(/Placa inv/i)).toBeTruthy();
    });

    it('deve obter localização do motorista com sucesso', async () => {
        const { getByText } = await render(<DriverRegistrationScreen />);

        await fireEvent.press(getByText(/Usar Minha Localiza/i));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', expect.stringContaining('Localiza'));
        });
        // O texto do botão muda após obter a localização
        expect(screen.getByText(/Localização obtida/i)).toBeTruthy();
    });

    it('deve tratar permissão de localização negada', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
        const { getByText } = await render(<DriverRegistrationScreen />);

        await fireEvent.press(getByText(/Usar Minha Localiza/i));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Permissão negada', expect.any(String));
        });
    });

    it('deve tratar erro ao obter localização', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('GPS off'));
        const { getByText } = await render(<DriverRegistrationScreen />);

        await fireEvent.press(getByText(/Usar Minha Localiza/i));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Erro',
                'Não foi possível obter sua localização. Tente novamente.'
            );
        });
        consoleSpy.mockRestore();
    });

    it('deve renderizar seção de disponibilidade', async () => {
        await render(<DriverRegistrationScreen />);
        expect(screen.getByText(/Dispon/i)).toBeTruthy();
    });

    it('deve cadastrar com sucesso e resetar a navegação', async () => {
        applyToBeDriver.mockResolvedValueOnce({ success: true });
        const queries = await render(<DriverRegistrationScreen />);

        await fillValidForm(queries);
        await fireEvent.press(queries.getByText('Finalizar Cadastro'));

        await waitFor(() => {
            expect(applyToBeDriver).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 1, cnh: '12345678901', placa: 'ABC-1234', cor: 'Prata' })
            );
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', expect.any(String), expect.any(Array));
        });

        // Executa o onPress do botão OK do alerta
        const alertCalls = Alert.alert.mock.calls;
        const onPress = alertCalls[alertCalls.length - 1][2][0].onPress;
        onPress();

        expect(mockNavigation.reset).toHaveBeenCalled();
    });

    it('deve exibir erro quando a API falha ao cadastrar', async () => {
        applyToBeDriver.mockRejectedValueOnce(new Error('Erro ao cadastrar motorista'));
        const queries = await render(<DriverRegistrationScreen />);

        await fillValidForm(queries);
        await fireEvent.press(queries.getByText('Finalizar Cadastro'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro ao cadastrar', 'Erro ao cadastrar motorista');
        });
    });
});
