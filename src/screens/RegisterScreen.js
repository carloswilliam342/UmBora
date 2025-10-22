import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
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

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Substitua 'SEU_IP_LOCAL' pelo IP da sua máquina na rede
  const API_URL = 'http://192.168.1.105:3000/api';

  const handleRegister = async () => {

  // Validações de registro
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    //Valida o formato do email com o @
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}$/; //só pode terminar com 3+ caracteres no fim do email. Ex.: email.com
       return emailRegex.test(email);
    };

    if (!validateEmail(formData.email)) {
      Alert.alert('Erro', 'E-mail inválido');
      return;
    }

    //Valida a senha e confirmação
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    //Valida o tamanho da senha
    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso!', data.message, [
          { text: 'Fazer Login', onPress: () => navigation.navigate('Login') }
        ]);
        
        // Limpar o formulário pós confirmação
        setFormData({
          name : '',
          email : '',
          phone : '',
          password : '',
          confirmPassword : ''
        });

      } else { // Erros (4xx, 5xx)
        Alert.alert('Erro no Cadastro', data.message || 'Não foi possível criar a conta.');
      }

    } catch (error) {
      console.error('Erro de rede:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    }
  };

  const handleFacebookLogin = () => {
    Alert.alert('Em breve', 'Login com Facebook será implementado em breve');
  };

  return (
    <Container>
      <GradientContainer>
        <MainTitle>Criar Conta</MainTitle>

        <Card>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text mb="20px" color={colors.textSecondary} align="center">
              Entre com seu número de telefone ou e-mail
            </Text>

            <TextInput
              placeholder="Nome completo"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              autoCapitalize="words"
            />

            <TextInput
              placeholder="E-mail"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              placeholder="Número de telefone"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              maxLength={15}
            />

            <TextInput
              placeholder="Senha"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              placeholder="Confirmar senha"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
              autoCapitalize="none"
            />

            <PrimaryButton onPress={handleRegister}>
              <ButtonText>Cadastrar</ButtonText>
            </PrimaryButton>

            <SecondaryButton onPress={handleFacebookLogin}>
              <ButtonText color={colors.primary}>
                <Ionicons name="logo-facebook" size={18} /> Conectar com Facebook
              </ButtonText>
            </SecondaryButton>

            <Text align="center" color={colors.textSecondary}>
              Criando uma conta, você aceita os Termos e Condições
            </Text>
          </ScrollView>
        </Card>
      </GradientContainer>
    </Container>
  );
};

export default RegisterScreen;