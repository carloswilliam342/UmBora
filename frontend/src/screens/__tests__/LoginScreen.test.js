import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import * as authService from '../../services/authService';

// Mock authService
jest.mock('../../services/authService', () => ({
  saveUserSession: jest.fn().mockResolvedValue(true),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockNavigate.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('deve renderizar a tela de login corretamente', async () => {
    const result = await render(<LoginScreen />);
    const { getByPlaceholderText, getByText, getAllByText } = result;
    
    expect(getAllByText('Entrar').length).toBe(2);
    expect(getByPlaceholderText('E-mail ou telefone')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByText('Conectar com Facebook')).toBeTruthy();
    expect(getByText('Esqueceu sua senha?')).toBeTruthy();
  });

  it('deve mostrar alerta de erro se os campos estiverem vazios ao tentar logar', async () => {
    const { getByText, getAllByText } = await render(<LoginScreen />);
    const buttonEntrar = getAllByText('Entrar')[1];

    await fireEvent.press(buttonEntrar);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Por favor, preencha todos os campos');
    });
  });

  it('deve fazer login com sucesso e navegar para a tela Main', async () => {
    // Configura o mock do fetch para simular sucesso
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Login realizado com sucesso',
        user: { id: 123 }
      }),
    });

    const { getByPlaceholderText, getByText, getAllByText } = await render(<LoginScreen />);
    
    const inputEmail = getByPlaceholderText('E-mail ou telefone');
    const inputPassword = getByPlaceholderText('Senha');
    const buttonEntrar = getAllByText('Entrar')[1];

    await fireEvent.changeText(inputEmail, 'test@example.com');
    await fireEvent.changeText(inputPassword, 'password123');
    await fireEvent.press(buttonEntrar);

    // Espera a chamada da API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/login'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      }));
    });

    // Espera salvar a sessão
    await waitFor(() => {
      expect(authService.saveUserSession).toHaveBeenCalledWith(123);
    });

    // Espera o alerta de sucesso
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Login realizado com sucesso', expect.any(Array));
    });

    // Simula o clique no botão "OK" do alerta de sucesso para disparar a navegação
    const alertCalls = Alert.alert.mock.calls;
    const okButtonAction = alertCalls[0][2][0].onPress;
    okButtonAction();

    // Verifica se navegou para a tela Main
    expect(global.mockNavigate).toHaveBeenCalledWith('Main', { userId: 123 });
  });

  it('deve mostrar alerta de erro se o login falhar no servidor', async () => {
    // Configura o mock do fetch para simular erro da API
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Credenciais inválidas'
      }),
    });

    const { getByPlaceholderText, getByText, getAllByText } = await render(<LoginScreen />);
    
    const inputEmail = getByPlaceholderText('E-mail ou telefone');
    const inputPassword = getByPlaceholderText('Senha');
    const buttonEntrar = getAllByText('Entrar')[1];

    await fireEvent.changeText(inputEmail, 'wrong@example.com');
    await fireEvent.changeText(inputPassword, 'wrongpass');
    await fireEvent.press(buttonEntrar);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro de Login', 'Credenciais inválidas');
    });
  });

  it('deve mostrar alerta de erro se ocorrer uma falha de conexao', async () => {
    // Simula erro de rede/conexão rejeitando a promise
    global.fetch.mockRejectedValueOnce(new Error('Erro de conexão'));

    const { getByPlaceholderText, getByText, getAllByText } = await render(<LoginScreen />);
    
    const inputEmail = getByPlaceholderText('E-mail ou telefone');
    const inputPassword = getByPlaceholderText('Senha');
    const buttonEntrar = getAllByText('Entrar')[1];

    await fireEvent.changeText(inputEmail, 'test@example.com');
    await fireEvent.changeText(inputPassword, 'password123');
    await fireEvent.press(buttonEntrar);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    });
  });
});
