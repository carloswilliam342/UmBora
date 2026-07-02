import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../RegisterScreen';

// Mock global fetch
global.fetch = jest.fn();

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockNavigate.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('deve renderizar a tela de cadastro corretamente', async () => {
    const { getByPlaceholderText, getByText } = await render(<RegisterScreen />);
    
    expect(getByPlaceholderText('Nome completo')).toBeTruthy();
    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Número de telefone')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByPlaceholderText('Confirmar senha')).toBeTruthy();
    expect(getByText('Cadastrar')).toBeTruthy();
  });

  it('deve mostrar alerta de erro se os campos estiverem vazios ao tentar cadastrar', async () => {
    const { getByText } = await render(<RegisterScreen />);
    const buttonCadastrar = getByText('Cadastrar');

    await fireEvent.press(buttonCadastrar);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Por favor, preencha todos os campos');
    });
  });

  it('deve mostrar alerta de erro se o e-mail for inválido', async () => {
    const { getByPlaceholderText, getByText } = await render(<RegisterScreen />);
    
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'João da Silva');
    await fireEvent.changeText(getByPlaceholderText('E-mail'), 'emailinvalido');
    await fireEvent.changeText(getByPlaceholderText('Número de telefone'), '11999999999');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'senha123');
    
    await fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail inválido');
    });
  });

  it('deve mostrar alerta de erro se as senhas não coincidirem', async () => {
    const { getByPlaceholderText, getByText } = await render(<RegisterScreen />);
    
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'João da Silva');
    await fireEvent.changeText(getByPlaceholderText('E-mail'), 'joao@example.com');
    await fireEvent.changeText(getByPlaceholderText('Número de telefone'), '11999999999');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'senha1234');
    
    await fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'As senhas não coincidem');
    });
  });

  it('deve fazer cadastro com sucesso e navegar para a tela de Login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Usuário cadastrado com sucesso'
      }),
    });

    const { getByPlaceholderText, getByText } = await render(<RegisterScreen />);
    
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'João da Silva');
    await fireEvent.changeText(getByPlaceholderText('E-mail'), 'joao@example.com');
    await fireEvent.changeText(getByPlaceholderText('Número de telefone'), '11999999999');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'senha123');
    
    await fireEvent.press(getByText('Cadastrar'));

    // Espera a chamada da API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/register'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'João da Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          password: 'senha123',
        })
      }));
    });

    // Espera o alerta de sucesso
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', 'Usuário cadastrado com sucesso', expect.any(Array));
    });

    // Simula o clique no botão de Login do alerta
    const alertCalls = Alert.alert.mock.calls;
    const okButtonAction = alertCalls[alertCalls.length - 1][2][0].onPress;
    okButtonAction();

    expect(global.mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('deve mostrar erro quando o servidor retorna falha', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'E-mail já está em uso'
      }),
    });

    const { getByPlaceholderText, getByText } = await render(<RegisterScreen />);
    
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'João da Silva');
    await fireEvent.changeText(getByPlaceholderText('E-mail'), 'joao@example.com');
    await fireEvent.changeText(getByPlaceholderText('Número de telefone'), '11999999999');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'senha123');
    
    await fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro no Cadastro', 'E-mail já está em uso');
    });
  });
});
