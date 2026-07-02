import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

describe('Test Render', () => {
    it('deve verificar o retorno do render com screen', async () => {
        await render(<Text>Hello World</Text>);
        expect(screen.getByText('Hello World')).toBeTruthy();
    });
});
