import React from 'react';
import { Container, GradientContainer, MainTitle, Text } from '../components/StyledComponents';

const HomeScreen = () => {
  return (
    <Container>
      <GradientContainer>
        <MainTitle>Bem-vindo à Home!</MainTitle>
        <Text align="center" color="#fff" mb="20px">
          Você está logado e esta é a tela principal do app.
        </Text>
      </GradientContainer>
    </Container>
  );
};

export default HomeScreen;
