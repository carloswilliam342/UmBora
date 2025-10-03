import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  colors,
} from '../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AuthScreens = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('register');

  const handleTabPress = (tab) => setActiveTab(tab);

  const handleContinue = () => {
    if (activeTab === 'register') navigation.navigate('Register');
    else navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientContainer style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Logo>
                <Ionicons name="car-sport" size={40} color={colors.primary} />
              </Logo>
              <MainTitle style={styles.title}>Umbora</MainTitle>
            </View>

            <View style={styles.centerBox}>
              <Card style={styles.card}>
                <TabContainer style={styles.tabContainer}>
                  <Tab active={activeTab === 'register'} onPress={() => handleTabPress('register')}>
                    <TabText active={activeTab === 'register'}>Cadastre-se</TabText>
                  </Tab>
                  <Tab active={activeTab === 'login'} onPress={() => handleTabPress('login')}>
                    <TabText active={activeTab === 'login'}>Entrar</TabText>
                  </Tab>
                </TabContainer>
                <PrimaryButton style={styles.button} onPress={handleContinue}>
                  <ButtonText>
                    {activeTab === 'register' ? 'Criar Conta' : 'Fazer Login'}
                  </ButtonText>
                </PrimaryButton>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background || '#fff' },
  gradient: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  centerBox: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: Math.min(width * 0.92, 380),
    padding: 18,
    borderRadius: 18,
    elevation: 2,
    alignSelf: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  button: {
    marginTop: 18,
    paddingVertical: 14,
  },
});

export default AuthScreens;
