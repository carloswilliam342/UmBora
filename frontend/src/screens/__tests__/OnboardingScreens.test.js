import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreens from '../OnboardingScreens';
import AsyncStorage from '@react-native-async-storage/async-storage';
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('react-native-onboarding-swiper', () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (props) => (
        <View testID="onboarding">
            {props.pages.map((page, index) => (
                <View key={index}>
                    <Text>{page.title}</Text>
                    <Text>{page.subtitle}</Text>
                </View>
            ))}
            <TouchableOpacity onPress={props.onDone} testID="done-button">
                <Text>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onSkip} testID="skip-button">
                <Text>Skip</Text>
            </TouchableOpacity>
        </View>
    );
});

describe('OnboardingScreens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar as páginas de onboarding', async () => {
        await render(<OnboardingScreens />);
        const { screen } = require('@testing-library/react-native');

        expect(screen.getByText('Solicite uma viagem')).toBeTruthy();
        expect(screen.getByText('Confirme seu motorista')).toBeTruthy();
        expect(screen.getByText('Acompanhe sua viagem')).toBeTruthy();
    });

    it('deve renderizar os subtítulos', async () => {
        await render(<OnboardingScreens />);
        const { screen } = require('@testing-library/react-native');

        expect(screen.getByText(/Solicite uma carona e seja buscado/)).toBeTruthy();
        expect(screen.getByText(/Uma grande rede de motoristas/)).toBeTruthy();
        expect(screen.getByText(/Conheça sua motorista/)).toBeTruthy();
    });

    it('deve navegar para Auth ao completar onboarding', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);
        await render(<OnboardingScreens />);
        const { screen } = require('@testing-library/react-native');

        fireEvent.press(screen.getByTestId('done-button'));

        const nav = require('@react-navigation/native').useNavigation();
        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenOnboarding', 'true');
            expect(mockReplace).toHaveBeenCalledWith('Auth');
        });
    });

    it('deve navegar para Auth ao pular onboarding', async () => {
        AsyncStorage.setItem.mockResolvedValue(undefined);
        await render(<OnboardingScreens />);
        const { screen } = require('@testing-library/react-native');

        fireEvent.press(screen.getByTestId('skip-button'));

        const nav = require('@react-navigation/native').useNavigation();
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('Auth');
        });
    });

    it('deve navegar para Auth mesmo com erro no AsyncStorage', async () => {
        AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await render(<OnboardingScreens />);
        const { screen } = require('@testing-library/react-native');

        fireEvent.press(screen.getByTestId('done-button'));

        const nav = require('@react-navigation/native').useNavigation();
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('Auth');
        });

        consoleSpy.mockRestore();
    });
});
