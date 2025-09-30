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

  const handleLogin = () => {
    // Validação básica
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Aqui você implementaria a lógica de login
    Alert.alert('Sucesso', 'Login realizado com sucesso!', [
      {
        text: 'OK',
        onPress: () => {
          // Navegar para a tela principal do app
          console.log('Navegar para tela principal');
        }
      }
    ]);
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