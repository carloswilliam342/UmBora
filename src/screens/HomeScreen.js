import React from 'react';
import { Button, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Container, GradientContainer, MainTitle, Text, colors } from '../components/StyledComponents';

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  return (
    <Container>
      <GradientContainer>
        <MainTitle>Bem-vindo à Home!</MainTitle>
        <Text align="center" color="#fff" mb="20px">
          Você está logado e esta é a tela principal do app.
        </Text>

        <View style={{ marginHorizontal: 20, marginTop: 30 }}>
          <Button
            title="Quero ser Motorista"
            onPress={() => navigation.navigate('Driver', { userId: userId })}
            color={colors.secondary}
          />
        </View>
      </GradientContainer>
    </Container>
  );
};

export default HomeScreen;
