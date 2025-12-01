import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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
