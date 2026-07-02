import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VehicleScreen from '../VehicleScreen';
import { applyToBeDriver } from '../../../services/api';

jest.mock('../../../services/api');

const makeProps = () => ({
    navigation: { popToTop: jest.fn() },
    route: { params: { userId: 1, cnh: '123456789' } },
});

describe('VehicleScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve renderizar os campos do veículo', async () => {
        const props = makeProps();
        const { getByPlaceholderText, getByText } = await render(<VehicleScreen {...props} />);

        expect(getByPlaceholderText('Modelo do Veículo')).toBeTruthy();
        expect(getByPlaceholderText('Placa')).toBeTruthy();
        expect(getByPlaceholderText('Cor')).toBeTruthy();
        expect(getByText('Concluir')).toBeTruthy();
    });

    it('deve atualizar os valores dos campos ao digitar', async () => {
        const props = makeProps();
        const { getByPlaceholderText, getByDisplayValue } = await render(<VehicleScreen {...props} />);

        await fireEvent.changeText(getByPlaceholderText('Modelo do Veículo'), 'Fiat Uno');

        expect(getByDisplayValue('Fiat Uno')).toBeTruthy();
    });

    it('deve enviar a candidatura e navegar ao concluir com sucesso', async () => {
        applyToBeDriver.mockResolvedValueOnce({ success: true });
        const props = makeProps();
        const { getByPlaceholderText, getByText } = await render(<VehicleScreen {...props} />);

        await fireEvent.changeText(getByPlaceholderText('Modelo do Veículo'), 'Fiat Uno');
        await fireEvent.changeText(getByPlaceholderText('Placa'), 'ABC1D23');
        await fireEvent.changeText(getByPlaceholderText('Cor'), 'Prata');

        await fireEvent.press(getByText('Concluir'));

        await waitFor(() => {
            expect(applyToBeDriver).toHaveBeenCalledWith({
                userId: 1,
                cnh: '123456789',
                modelo: 'Fiat Uno',
                placa: 'ABC1D23',
                cor: 'Prata',
            });
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso!',
                'Seu cadastro foi enviado para análise.',
                expect.any(Array)
            );
        });

        // Executa o onPress do botão OK do alerta
        const alertCalls = Alert.alert.mock.calls;
        const onPress = alertCalls[alertCalls.length - 1][2][0].onPress;
        onPress();

        expect(props.navigation.popToTop).toHaveBeenCalled();
    });

    it('deve exibir alerta de erro quando a candidatura falha', async () => {
        applyToBeDriver.mockRejectedValueOnce(new Error('Servidor indisponível'));
        const props = makeProps();
        const { getByText } = await render(<VehicleScreen {...props} />);

        await fireEvent.press(getByText('Concluir'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Servidor indisponível');
        });
        expect(props.navigation.popToTop).not.toHaveBeenCalled();
    });
});
