import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import PhoneVerificationScreen from '../PhoneVerificationScreen';
import { Alert } from 'react-native';

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
        replace: jest.fn(),
    }),
    useRoute: () => ({ params: { phone: '11999999999', userData: { name: 'Test' } } }),
}));

describe('PhoneVerificationScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('deve renderizar a tela de verificação', async () => {
        await render(<PhoneVerificationScreen />);
        expect(screen.getByText('Verificação de Telefone')).toBeTruthy();
        expect(screen.getByText('Digite o código enviado')).toBeTruthy();
        expect(screen.getByText('Verificar Agora')).toBeTruthy();
    });

    it('deve renderizar o teclado numérico', async () => {
        await render(<PhoneVerificationScreen />);
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    });

    it('deve exibir texto do timer de reenvio', async () => {
        await render(<PhoneVerificationScreen />);
        expect(screen.getByText(/Reenviar em/)).toBeTruthy();
    });

    it('deve exibir erro para código inválido', async () => {
        // handleVerify usa um setTimeout real de 1s; usamos timers reais aqui
        jest.useRealTimers();
        await render(<PhoneVerificationScreen />);

        // Digita 1-1-1-1 (código inválido). O 4º dígito dispara a verificação automática.
        await fireEvent.press(screen.getAllByText('1').pop());
        await fireEvent.press(screen.getAllByText('1').pop());
        await fireEvent.press(screen.getAllByText('1').pop());
        await fireEvent.press(screen.getAllByText('1').pop());

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Código inválido. Tente novamente.');
        }, { timeout: 3000 });
    });

    it('deve verificar com sucesso para código correto', async () => {
        jest.useRealTimers();
        await render(<PhoneVerificationScreen />);

        // Digita 1-2-3-4 (código correto)
        await fireEvent.press(screen.getAllByText('1').pop());
        await fireEvent.press(screen.getAllByText('2').pop());
        await fireEvent.press(screen.getAllByText('3').pop());
        await fireEvent.press(screen.getAllByText('4').pop());

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso',
                'Telefone verificado com sucesso!',
                expect.any(Array)
            );
        }, { timeout: 3000 });
    });

    it('deve permitir reenviar o código quando o timer expira', async () => {
        const { act } = require('@testing-library/react-native');
        await render(<PhoneVerificationScreen />);

        // Avança o contador de 60s até habilitar o reenvio
        await act(async () => {
            jest.advanceTimersByTime(60000);
        });

        await fireEvent.press(screen.getByText('Reenviar código'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Código Reenviado',
            'Um novo código foi enviado para seu telefone'
        );
    });
});
