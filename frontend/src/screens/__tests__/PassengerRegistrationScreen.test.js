import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegistroPassageiro from '../PassengerRegistrationScreen';

// Mock global fetch
global.fetch = jest.fn();

const fillRequiredFields = async (queries) => {
    await fireEvent.changeText(queries.getByPlaceholderText('CPF'), '12345678900');
    await fireEvent.changeText(queries.getByPlaceholderText('CEP'), '01001000');
    await fireEvent.changeText(queries.getByPlaceholderText('Rua / Avenida'), 'Rua das Flores');
};

describe('PassengerRegistrationScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.mockNavigate.mockClear();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    it('deve renderizar o formulário de cadastro de passageiro', async () => {
        const { getByText, getByPlaceholderText } = await render(<RegistroPassageiro />);

        expect(getByText('Cadastro de Passageiro')).toBeTruthy();
        expect(getByText('Dados Pessoais')).toBeTruthy();
        expect(getByText('Endereço')).toBeTruthy();
        expect(getByPlaceholderText('Nome Completo')).toBeTruthy();
        expect(getByPlaceholderText('CPF')).toBeTruthy();
        expect(getByPlaceholderText('CEP')).toBeTruthy();
        expect(getByPlaceholderText('Rua / Avenida')).toBeTruthy();
        expect(getByPlaceholderText('Bairro')).toBeTruthy();
        expect(getByPlaceholderText('Número')).toBeTruthy();
        expect(getByText('Finalizar Cadastro')).toBeTruthy();
    });

    it('deve atualizar os valores dos campos ao digitar', async () => {
        const { getByPlaceholderText, getByDisplayValue } = await render(<RegistroPassageiro />);

        await fireEvent.changeText(getByPlaceholderText('CPF'), '99988877766');

        expect(getByDisplayValue('99988877766')).toBeTruthy();
    });

    it('deve exibir alerta de erro quando campos obrigatórios estão vazios', async () => {
        const { getByText } = await render(<RegistroPassageiro />);

        await fireEvent.press(getByText('Finalizar Cadastro'));

        expect(Alert.alert).toHaveBeenCalledWith('Erro!', 'Por favor, preencha os campos obrigatórios.');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve cadastrar com sucesso e navegar para PassengerHome', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'ok' }),
        });

        const queries = await render(<RegistroPassageiro />);
        await fillRequiredFields(queries);

        await fireEvent.press(queries.getByText('Finalizar Cadastro'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/passenger'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso!',
                'Cadastro de passageiro realizado!',
                expect.any(Array)
            );
        });

        // Executa o onPress do botão do alerta ("Ir para Home")
        const alertCalls = Alert.alert.mock.calls;
        const onPress = alertCalls[alertCalls.length - 1][2][0].onPress;
        onPress();

        expect(global.mockNavigate).toHaveBeenCalledWith('PassengerHome', expect.any(Object));
    });

    it('deve exibir alerta quando o servidor retorna falha', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'CPF já cadastrado' }),
        });

        const queries = await render(<RegistroPassageiro />);
        await fillRequiredFields(queries);

        await fireEvent.press(queries.getByText('Finalizar Cadastro'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro ao cadastrar', 'CPF já cadastrado');
        });
    });

    it('deve exibir alerta de erro de rede quando o fetch falha', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValueOnce(new Error('Network down'));

        const queries = await render(<RegistroPassageiro />);
        await fillRequiredFields(queries);

        await fireEvent.press(queries.getByText('Finalizar Cadastro'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Não foi possível conectar ao servidor.');
        });

        consoleSpy.mockRestore();
    });
});
