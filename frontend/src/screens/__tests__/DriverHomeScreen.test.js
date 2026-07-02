import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DriverHomeScreen from '../DriverHomeScreen';
import * as driverService from '../../services/driverService';
import * as rideService from '../../services/rideService';
import { useRoute, useFocusEffect } from '@react-navigation/native';

jest.mock('../../services/driverService');
jest.mock('../../services/rideService');
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: global.mockNavigate,
      goBack: jest.fn(),
    }),
    useRoute: jest.fn(),
    useFocusEffect: jest.fn(),
  };
});

describe('DriverHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useRoute.mockReturnValue({ params: { userId: 1 } });
    
    // Default mocks
    driverService.getDriverProfile.mockResolvedValue({
      isDriver: true,
      driver: { id: 10 }
    });
    
    rideService.getDriverPendingRequests.mockResolvedValue({
      requests: []
    });
  });

  it('deve mostrar erro se o usuário não for motorista e voltar', async () => {
    driverService.getDriverProfile.mockResolvedValue({ isDriver: false });
    
    const { getByText } = await render(<DriverHomeScreen />);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Acesso Negado',
        'Apenas motoristas podem acessar esta tela.',
        expect.any(Array)
      );
    });
  });

  it('deve carregar solicitações pendentes corretamente', async () => {
    rideService.getDriverPendingRequests.mockResolvedValue({
      requests: [
        {
          id: 1,
          rideId: 100,
          passengerId: 5,
          passengerName: 'Maria Silva',
          passengerPhone: '11999999999',
          numberOfPassengers: 2,
          paymentMethod: 'pix',
          ride: {
            origin: { address: 'Rua A' },
            destination: { address: 'Rua B' },
            departureTime: new Date().toISOString()
          }
        }
      ]
    });

    const { getByText, getAllByText } = await render(<DriverHomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Maria Silva')).toBeTruthy();
      expect(getByText('Rua A')).toBeTruthy();
      expect(getByText('Rua B')).toBeTruthy();
      expect(getByText('PIX')).toBeTruthy();
      expect(getByText('Aceitar')).toBeTruthy();
      expect(getByText('Recusar')).toBeTruthy();
    });
  });

  it('deve aceitar uma solicitação corretamente', async () => {
    rideService.getDriverPendingRequests.mockResolvedValueOnce({
      requests: [
        {
          id: 1,
          rideId: 100,
          passengerId: 5,
          passengerName: 'Maria Silva',
          passengerPhone: '11999999999',
          numberOfPassengers: 2,
          paymentMethod: 'pix',
          ride: {
            origin: { address: 'Rua A' },
            destination: { address: 'Rua B' },
            departureTime: new Date().toISOString()
          }
        }
      ]
    });
    
    rideService.acceptRideRequest.mockResolvedValue({ success: true });

    const { getByText } = await render(<DriverHomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Aceitar')).toBeTruthy();
    });

    await fireEvent.press(getByText('Aceitar'));
    
    // Simulate pressing "Aceitar" in the Alert
    const alertCalls = Alert.alert.mock.calls;
    const acceptAction = alertCalls[0][2][1].onPress;
    
    await acceptAction();
    
    await waitFor(() => {
      expect(rideService.acceptRideRequest).toHaveBeenCalledWith(100, 5);
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Solicitação aceita com sucesso!');
    });
  });
  
  it('deve recusar uma solicitação corretamente', async () => {
    rideService.getDriverPendingRequests.mockResolvedValueOnce({
      requests: [
        {
          id: 1,
          rideId: 100,
          passengerId: 5,
          passengerName: 'Maria Silva',
          passengerPhone: '11999999999',
          numberOfPassengers: 2,
          paymentMethod: 'pix',
          ride: {
            origin: { address: 'Rua A' },
            destination: { address: 'Rua B' },
            departureTime: new Date().toISOString()
          }
        }
      ]
    });
    
    rideService.rejectRideRequest.mockResolvedValue({ success: true });

    const { getByText } = await render(<DriverHomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Recusar')).toBeTruthy();
    });

    await fireEvent.press(getByText('Recusar'));
    
    // Simulate pressing "Recusar" in the Alert
    const alertCalls = Alert.alert.mock.calls;
    const rejectAction = alertCalls[0][2][1].onPress;
    
    await rejectAction();
    
    await waitFor(() => {
      expect(rideService.rejectRideRequest).toHaveBeenCalledWith(100, 5);
      expect(Alert.alert).toHaveBeenCalledWith('Concluído', 'Solicitação recusada.');
    });
  });
});
