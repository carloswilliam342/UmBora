import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const LoginScreen = () => {
  const navigation = useNavigation();
  const [ loading, setLoading] = useState(false)

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

  const API_URL = process.env.EXPO_PUBLIC_API_URL;


  const handleLogin = async () => {
    // Validação básica
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', data.message, [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ email: '', password: '' });
              navigation.navigate('Home');
            }
          }
        ])
      } else { // Erros (4xx, 5xx)
        Alert.alert('Erro de Login', data.message || 'Não foi possível fazer login.');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    }
    finally{
      setLoading(false)
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

          <PrimaryButton onPress={handleLogin} disabled={loading} style={{opacity: loading ? 0.5 : 1}}>
            {loading ? <ActivityIndicator size="small" color={colors.white} /> : <ButtonText>Entrar</ButtonText>}
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