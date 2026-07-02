import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddressAutocomplete from '../AddressAutocomplete';
import { searchAddress } from '../../services/geocodingService';

jest.mock('../../services/geocodingService');

const mockResults = [
    {
        displayName: 'Rua das Flores, 123 - Centro',
        latitude: -23.55,
        longitude: -46.63,
        city: 'São Paulo',
        state: 'SP',
    },
    {
        displayName: 'Rua das Flores, 456 - Jardim',
        latitude: -23.56,
        longitude: -46.64,
        city: 'São Paulo',
        state: 'SP',
    },
];

describe('AddressAutocomplete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar com o placeholder padrão', async () => {
        const { getByPlaceholderText } = await render(
            <AddressAutocomplete onSelectAddress={jest.fn()} />
        );
        expect(getByPlaceholderText('Digite o endereço')).toBeTruthy();
    });

    it('deve aceitar um placeholder customizado', async () => {
        const { getByPlaceholderText } = await render(
            <AddressAutocomplete placeholder="Origem" onSelectAddress={jest.fn()} />
        );
        expect(getByPlaceholderText('Origem')).toBeTruthy();
    });

    it('não deve buscar quando o texto tem menos de 3 caracteres', async () => {
        const { getByPlaceholderText } = await render(
            <AddressAutocomplete onSelectAddress={jest.fn()} />
        );

        await fireEvent.changeText(getByPlaceholderText('Digite o endereço'), 'ru');

        // Aguarda além do tempo de debounce (500ms) para garantir que não buscou
        await new Promise((resolve) => setTimeout(resolve, 700));
        expect(searchAddress).not.toHaveBeenCalled();
    });

    it('deve buscar e exibir sugestões após o debounce', async () => {
        searchAddress.mockResolvedValueOnce(mockResults);
        const { getByPlaceholderText, getByText } = await render(
            <AddressAutocomplete onSelectAddress={jest.fn()} />
        );

        await fireEvent.changeText(getByPlaceholderText('Digite o endereço'), 'Rua das Flores');

        await waitFor(() => {
            expect(searchAddress).toHaveBeenCalledWith('Rua das Flores');
            expect(getByText('Rua das Flores, 123 - Centro')).toBeTruthy();
        }, { timeout: 2000 });
    });

    it('deve chamar onSelectAddress ao selecionar uma sugestão', async () => {
        searchAddress.mockResolvedValueOnce(mockResults);
        const onSelectAddress = jest.fn();
        const { getByPlaceholderText, getByText } = await render(
            <AddressAutocomplete onSelectAddress={onSelectAddress} />
        );

        await fireEvent.changeText(getByPlaceholderText('Digite o endereço'), 'Rua das Flores');

        const suggestion = await waitFor(
            () => getByText('Rua das Flores, 123 - Centro'),
            { timeout: 2000 }
        );

        await fireEvent.press(suggestion);

        expect(onSelectAddress).toHaveBeenCalledWith(mockResults[0]);
    });

    it('deve exibir mensagem quando nenhum endereço é encontrado', async () => {
        searchAddress.mockResolvedValueOnce([]);
        const { getByPlaceholderText, getByText } = await render(
            <AddressAutocomplete onSelectAddress={jest.fn()} />
        );

        await fireEvent.changeText(getByPlaceholderText('Digite o endereço'), 'endereco inexistente');

        await waitFor(() => {
            expect(getByText('Nenhum endereço encontrado')).toBeTruthy();
        }, { timeout: 2000 });
    });

    it('deve tratar erro ao buscar sugestões', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        searchAddress.mockRejectedValueOnce(new Error('API fora do ar'));
        const { getByPlaceholderText } = await render(
            <AddressAutocomplete onSelectAddress={jest.fn()} />
        );

        await fireEvent.changeText(getByPlaceholderText('Digite o endereço'), 'Rua qualquer');

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar sugestões:', expect.any(Error));
        }, { timeout: 2000 });

        consoleSpy.mockRestore();
    });
});
