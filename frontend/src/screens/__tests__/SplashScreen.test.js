import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import SplashScreen from '../SplashScreen';

describe('SplashScreen', () => {
    it('deve renderizar o título Umbora', async () => {
        await render(<SplashScreen />);
        expect(screen.getByText('Umbora')).toBeTruthy();
    });
});
