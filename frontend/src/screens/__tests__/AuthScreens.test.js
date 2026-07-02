import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreens from '../AuthScreens';

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: global.mockNavigate,
        }),
    };
});



describe('AuthScreens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve alternar entre abas e ir para Register', async () => {
        const { getByText } = await render(<AuthScreens />);
        
        // Initial tab is register
        fireEvent.press(getByText('Criar Conta'));
        
        await waitFor(() => {
            expect(global.mockNavigate).toHaveBeenCalledWith('Register');
        });
    });

    it('deve alternar para Login e ir para Login', async () => {
        const { getByText } = await render(<AuthScreens />);
        
        // Change to login tab
        fireEvent.press(getByText('Entrar'));
        
        await waitFor(() => {
            expect(getByText('Fazer Login')).toBeTruthy();
        });

        fireEvent.press(getByText('Fazer Login'));
        
        await waitFor(() => {
            expect(global.mockNavigate).toHaveBeenCalledWith('Login');
        });
    });
});
