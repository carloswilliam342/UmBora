import React from 'react';
import { Image, Dimensions, TouchableOpacity, Text} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../components/StyledComponents';

const { width } = Dimensions.get('window');

const Done = ({ onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.botaoComecar}
      activeOpacity={0.8}
    >
      <Text style={styles.textoComecar}>
        Começar
      </Text>
    </TouchableOpacity>
  );
};

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
          source={require('../../assets/onboarding-1.png')}
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
          source={require('../../assets/onboarding-2.png')}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      ),
      title: 'Confirme seu motorista',
      subtitle: 'Uma grande rede de motoristas que vai te ajudar a encontrar sempre o lugar que você precisa.',
    },
    {
      backgroundColor: colors.primary,
      image: (
        <Image
          source={require('../../assets/onboarding-3.png')}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      ),
      title: 'Acompanhe sua viagem',
      subtitle: 'Conheça sua motorista e acompanhe a visualização no mapa em tempo real.',
    },
  ];

  return (
    <Onboarding
      pages={onboardingPages}
      onDone={handleOnboardingDone}
      onSkip={handleOnboardingDone}
      DoneButtonComponent={Done}
      showNext={true}
      showSkip={true}
      skipLabel="Pular"
      nextLabel="Próximo"
      titleStyles={{
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 1,
      }}
      subTitleStyles={{
        fontSize: 16,
        color: colors.white,
        textAlign: 'center',
        paddingHorizontal: 30,
      }}
      controlStatusBar={false}
      bottomBarHighlight={false}
      bottomBarHeight={100} 
      containerStyles={{
        paddingHorizontal: 20,
      }}
    />
  );
};

const styles = {
  botaoComecar: {
    backgroundColor: 'white',
    height: 50, 
    width: 180,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    
    // (Largura da Tela / 2) - (Metade do Botão) - (Padding da biblioteca que é 20)
    marginRight: (width / 2) - 70 - 20, 
    
    bottom: 40, 
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  textoComecar: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold'
  }
};

export default OnboardingScreens;