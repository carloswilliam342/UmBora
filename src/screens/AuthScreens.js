import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  GradientContainer,
  Logo,
  MainTitle,
  Card,
  TabContainer,
  Tab,
  TabText,
  PrimaryButton,
  ButtonText,
  colors
} from '../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const AuthScreens = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('register'); // 'register' ou 'login'

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const handleContinue = () => {
    if (activeTab === 'register') {
      navigation.navigate('Register');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <GradientContainer>
      <Logo>
        <Ionicons name="car-sport" size={40} color={colors.primary} />
      </Logo>
      <MainTitle>Umbora</MainTitle>

      <Card>
        <TabContainer>
          <Tab
            active={activeTab === 'register'}
            onPress={() => handleTabPress('register')}
          >
            <TabText active={activeTab === 'register'}>
              Cadastre-se
            </TabText>
          </Tab>
          <Tab
            active={activeTab === 'login'}
            onPress={() => handleTabPress('login')}
          >
            <TabText active={activeTab === 'login'}>
              Entrar
            </TabText>
          </Tab>
        </TabContainer>

        <PrimaryButton onPress={handleContinue}>
          <ButtonText>
            {activeTab === 'register' ? 'Criar Conta' : 'Fazer Login'}
          </ButtonText>
        </PrimaryButton>
      </Card>
    </GradientContainer>
  );
};

export default AuthScreens;