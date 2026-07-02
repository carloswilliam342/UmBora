import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { getDriverProfile } from '../../services/driverService';

jest.mock('../../services/driverService');
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useRoute: () => ({
            params: { userId: 1 }
        }),
        useNavigation: () => ({
            navigate: global.mockNavigate,
        })
    };
});

describe('SettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve ir para o perfil ao clicar em Meu Perfil', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        const { getByText } = await render(<SettingsScreen navigation={{ navigate: global.mockNavigate }} />);
        
        await waitFor(() => {
            expect(getByText('Meu Perfil')).toBeTruthy();
        });

        fireEvent.press(getByText('Meu Perfil'));
        
        expect(global.mockNavigate).toHaveBeenCalledWith('Profile', { userId: 1 });
    });

    it('deve navegar para DriverSignUpFlow se não for motorista', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: false });
        const { getByText } = await render(<SettingsScreen navigation={{ navigate: global.mockNavigate }} />);
        
        await waitFor(() => {
            expect(getByText('Quero me tornar motorista')).toBeTruthy();
        });

        fireEvent.press(getByText('Quero me tornar motorista'));
        
        expect(global.mockNavigate).toHaveBeenCalledWith('DriverSignUpFlow', { userId: 1 });
    });

    it('deve navegar para DriverEdit se for motorista', async () => {
        getDriverProfile.mockResolvedValue({ isDriver: true });
        const { getByText } = await render(<SettingsScreen navigation={{ navigate: global.mockNavigate }} />);
        
        await waitFor(() => {
            expect(getByText('Editar meu cadastro de motorista')).toBeTruthy();
        });

        fireEvent.press(getByText('Editar meu cadastro de motorista'));
        
        expect(global.mockNavigate).toHaveBeenCalledWith('DriverEdit', { userId: 1 });
    });
});
