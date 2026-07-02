import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../ProfileScreen';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { clearUserSession } from '../../services/authService';

jest.mock('../../services/api');
jest.mock('../../services/authService');
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useRoute: () => ({
            params: { userId: 1 }
        }),
        CommonActions: {
            reset: jest.fn()
        },
        useNavigation: () => ({
            dispatch: jest.fn()
        })
    };
});

describe('ProfileScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        
        getUserProfile.mockResolvedValue({
            user: {
                name: 'João Motorista',
                email: 'joao@email.com',
                phone: '11999999999'
            }
        });
    });

    it('deve renderizar dados do usuário corretamente', async () => {
        await render(<ProfileScreen />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('João Motorista')).toBeTruthy();
            expect(screen.getByDisplayValue('joao@email.com')).toBeTruthy();
            expect(screen.getByDisplayValue('11999999999')).toBeTruthy();
        });
    });

    it('deve atualizar o perfil corretamente', async () => {
        updateUserProfile.mockResolvedValue({ message: 'Dados atualizados com sucesso!' });
        await render(<ProfileScreen navigation={{ dispatch: jest.fn() }} />);
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Seu nome completo').props.value).toBe('João Motorista');
        });

        fireEvent.press(screen.getByText(/Salvar Alterações/i));
        
        await waitFor(() => {
            expect(updateUserProfile).toHaveBeenCalledWith(1, {
                name: 'João Motorista',
                email: 'joao@email.com',
                phone: '11999999999'
            });
            expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Dados atualizados com sucesso!');
        });
    });

    it('deve fazer logout corretamente', async () => {
        clearUserSession.mockResolvedValue();
        await render(<ProfileScreen navigation={{ dispatch: jest.fn() }} />);
        
        await waitFor(() => {
            expect(screen.getByText(/Sair da Conta/i)).toBeTruthy();
        });

        fireEvent.press(screen.getByText(/Sair da Conta/i));
        
        const alertCalls = Alert.alert.mock.calls;
        const confirmAction = alertCalls[0][2][1].onPress;
        
        await confirmAction();
        
        expect(clearUserSession).toHaveBeenCalled();
    });
});
