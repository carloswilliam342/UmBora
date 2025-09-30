import React from 'react';
import { Image, Dimensions } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../components/StyledComponents';

const { width } = Dimensions.get('window');

const OnboardingScreens = () => {
  const navigation = useNavigation();

  const handleOnboardingDone = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.log('Erro ao salvar onboarding:', error);
      navigation.replace('Auth');
    }
  };

  const onboardingPages = [
    {
      backgroundColor: colors.primary,
      image: (
        <Image
          source={{ uri: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=🚗' }}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      ),
      title: 'Solicite uma viagem',
      subtitle: 'Solicite uma carona e seja buscado por um motorista de confiança em qualquer lugar.',
    },
    {
      backgroundColor: colors.secondary,
      image: (
        <Image
          source={{ uri: 'https://via.placeholder.com/300x300/81C784/FFFFFF?text=👤' }}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      ),
      title: 'Confirme seu motorista',
      subtitle: 'Uma grande rede de motoristas que vai te ajudar você a encontrar sempre o lugar que você precisa.',
    },
    {
      backgroundColor: colors.primary,
      image: (
        <Image
          source={{ uri: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=📍' }}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      ),
      title: 'Acompanhe sua viagem',
      subtitle: 'Conheça sua motorista e acompanhe a viutralizada no mapa em tempo real.',
    },
  ];

  return (
    <Onboarding
      pages={onboardingPages}
      onDone={handleOnboardingDone}
      onSkip={handleOnboardingDone}
      showNext={true}
      showSkip={true}
      skipLabel="Pular"
      nextLabel="Próximo"
      doneLabel="Começar Agora"
      titleStyles={{
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 10,
      }}
      subTitleStyles={{
        fontSize: 16,
        color: colors.white,
        textAlign: 'center',
        paddingHorizontal: 30,
      }}
      controlStatusBar={false}
      bottomBarHighlight={false}
      containerStyles={{
        paddingHorizontal: 20,
      }}
    />
  );
};

export default OnboardingScreens;