import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RideCreateScreen from '../RideCreateScreen';
import { createRide } from '../../services/rideService';
import { useNavigation, useRoute } from '@react-navigation/native';

jest.mock('../../services/rideService');
jest.mock('../../components/AddressAutocomplete', () => {
    const React = require('react');
    const { TextInput, View, Button } = require('react-native');
    return function MockAddressAutocomplete({ placeholder, onSelectAddress }) {
        return (
            <View>
                <TextInput testID="mock-address-input" placeholder={placeholder} />
                <Button 
                    testID="mock-address-btn"
                    title="Select Address" 
                    onPress={() => onSelectAddress({
                        displayName: 'Rua Teste, 123',
                        latitude: -23.55052,
                        longitude: -46.633308,
                    })}
                />
            </View>
        );
    };
});

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const { View, Button } = require('react-native');
    const Picker = ({ selectedValue, onValueChange, children }) => (
        <View testID="mock-picker">
            <Button 
                testID="mock-picker-change"
                title="Change Seats"
                onPress={() => onValueChange(2)}
            />
        </View>
    );
    Picker.Item = ({ label, value }) => <View testID={`picker-item-${value}`} />;
    return { Picker };
});

jest.mock('@react-native-community/datetimepicker', () => {
    const React = require('react');
    const { Button } = require('react-native');
    return {
        __esModule: true,
        default: function MockDateTimePicker({ onChange }) {
            return (
                <Button 
                    testID="mock-datetime-picker" 
                    title="Set Date" 
                    onPress={() => onChange(null, new Date(new Date().getTime() + 86400000))} // Tomorrow
                />
            );
        }
    };
});

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: global.mockNavigate,
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { driverId: 10 }
    }),
  };
});

describe('RideCreateScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        createRide.mockResolvedValue({ success: true, rideId: 100 });
    });

    it('deve validar formulário vazio', async () => {
        await render(<RideCreateScreen />);
        
        await fireEvent.press(screen.getByText('Cadastrar Carona'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Selecione o endereço de origem');
        });
    });

    it('deve validar destino vazio', async () => {
        await render(<RideCreateScreen />);
        
        const originBtns = screen.getAllByTestId('mock-address-btn');
        await fireEvent.press(originBtns[0]); // Seleciona origem

        await fireEvent.press(screen.getByText('Cadastrar Carona'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Selecione o endereço de destino');
        });
    });

    it('deve criar carona com sucesso', async () => {
        await render(<RideCreateScreen />);
        
        const originBtns = screen.getAllByTestId('mock-address-btn');
        await fireEvent.press(originBtns[0]); // Seleciona origem
        await fireEvent.press(originBtns[1]); // Seleciona destino

        // Altera data
        const dateBtn = screen.getByText(/Data:/);
        await fireEvent.press(dateBtn);
        const datePicker = screen.getByTestId('mock-datetime-picker');
        await fireEvent.press(datePicker);

        // Altera preço
        const priceInput = screen.getByPlaceholderText('R$ 0,00 (deixe vazio para carona gratuita)');
        await fireEvent.changeText(priceInput, '50');

        // Altera vagas (trigger onChange do mock)
        const pickerChangeBtn = screen.getByTestId('mock-picker-change');
        await fireEvent.press(pickerChangeBtn);

        await fireEvent.press(screen.getByText('Cadastrar Carona'));

        await waitFor(() => {
            expect(createRide).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith(
                'Sucesso!',
                'Carona cadastrada com sucesso!',
                expect.any(Array)
            );
        });
    });

    it('deve lidar com erro ao criar carona', async () => {
        createRide.mockRejectedValueOnce({ response: { data: { message: 'Erro na API' } } });
        await render(<RideCreateScreen />);
        
        const originBtns = screen.getAllByTestId('mock-address-btn');
        await fireEvent.press(originBtns[0]); // Seleciona origem
        await fireEvent.press(originBtns[1]); // Seleciona destino
        
        const dateBtn = screen.getByText(/Data:/);
        await fireEvent.press(dateBtn);
        const datePicker = screen.getByTestId('mock-datetime-picker');
        await fireEvent.press(datePicker);

        await fireEvent.press(screen.getByText('Cadastrar Carona'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Erro na API');
        });
    });
});
