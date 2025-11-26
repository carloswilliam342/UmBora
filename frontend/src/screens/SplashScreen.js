import React from 'react';
import { GradientContainer, Logo, MainTitle } from '../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = () => {
  return (
    <GradientContainer>
      <Logo>
        <Ionicons name="car-sport" size={40} color="#4CAF50" />
      </Logo>
      <MainTitle>Umbora</MainTitle>
    </GradientContainer>
  );
};

export default SplashScreen;