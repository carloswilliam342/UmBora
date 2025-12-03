import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Certifique-se de que a biblioteca de ícones esteja instalada (ex: react-native-vector-icons)
import { 
  Container, 
  GradientContainer, 
  MainTitle, 
  Text, 
  PrimaryButton, 
  ButtonText 
} from '../components/StyledComponents';

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  const handleSearchRide = () => {
    navigation.navigate('PassengerHome', { userId: userId });
  };

  const handleHomePress = () => {
    // Lógica para o ícone de home (ex: navegar para Home, ou qualquer ação)
    navigation.navigate('Home'); // Ajuste se necessário
  };

  const handleSettingsPress = () => {
    // Lógica para o ícone de configurações (ex: navegar para Settings)
    navigation.navigate('Settings'); // Certifique-se de que essa rota exista no seu navigator
  };

  return (
    <Container>
      <GradientContainer>
        <MainTitle>Bem-vindo à Home!</MainTitle>
        <Text align="center" color="#fff" mb="20px">
          Você está logado e esta é a tela principal do app.
        </Text>

        <PrimaryButton onPress={handleSearchRide} style={{ marginHorizontal: 20, marginTop: 20 }}>
          <ButtonText>Buscar Corrida</ButtonText>
        </PrimaryButton>
      </GradientContainer>
    </Container>
  );
};

export default HomeScreen;
