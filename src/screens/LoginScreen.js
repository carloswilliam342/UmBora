import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Container,
  GradientContainer,
  Card,
  MainTitle,
  Text,
  TextInput,
  PrimaryButton,
  ButtonText,
  SecondaryButton,
  colors
} from '../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Substitua 'SEU_IP_LOCAL' pelo IP da sua máquina na rede
  const API_URL = 'http://10.0.0.111:3000/api';

  const handleLogin = async () => {
    // Validação básica
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) { // Status 200-299
        Alert.alert('Sucesso', data.message, [
          { text: 'OK', onPress: () => console.log('Navegar para a tela principal') }
        ]);
      } else { // Erros (4xx, 5xx)
        Alert.alert('Erro de Login', data.message || 'Não foi possível fazer login.');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar Senha', 'Funcionalidade será implementada em breve');
  };

  const handleFacebookLogin = () => {
    Alert.alert('Em breve', 'Login com Facebook será implementado em breve');
  };

  return (
    <Container>
      <GradientContainer>
        <MainTitle>Entrar</MainTitle>

        <Card>
          <Text mb="20px" color={colors.textSecondary} align="center">
            Entre com seu número de telefone ou e-mail
          </Text>

          <TextInput
            placeholder="E-mail ou telefone"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Senha"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
            autoCapitalize="none"
          />

          <PrimaryButton onPress={handleLogin}>
            <ButtonText>Entrar</ButtonText>
          </PrimaryButton>

          <SecondaryButton onPress={handleFacebookLogin}>
            <ButtonText color={colors.primary}>
              <Ionicons name="logo-facebook" size={18} /> Conectar com Facebook
            </ButtonText>
          </SecondaryButton>

          <Text 
            align="center" 
            color={colors.primary}
            onPress={handleForgotPassword}
            style={{ textDecorationLine: 'underline' }}
          >
            Esqueceu sua senha?
          </Text>
        </Card>
      </GradientContainer>
    </Container>
  );
};

export default LoginScreen;