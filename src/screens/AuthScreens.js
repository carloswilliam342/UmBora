import React, { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated
} from 'react-native';
import {
  GradientContainer,
  Logo,
  MainTitle,
  Card,
  TabContainer,
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

  // Valores animados para opacidade
  const registerOpacity = useRef(new Animated.Value(1)).current;
  const loginOpacity = useRef(new Animated.Value(0)).current;

  // Sempre que activeTab muda, anima as opacidades
  useEffect(() => {
    if (activeTab === 'register') {
      Animated.parallel([
        Animated.timing(registerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(loginOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(registerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(loginOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, registerOpacity, loginOpacity]);

  const handleTabPress = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  }

  const handleContinue = () => {
    if (activeTab === 'register') navigation.navigate('Register');
    else navigation.navigate('Login');
  };

  const Tab = ({ active, onPress, children }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, active && styles.activeTab]}
      accessibilityRole="button"
      accessible={true}
      accessibilityState={{ selected: active }}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientContainer style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

                <Animated.View style={{ opacity: registerOpacity, position: activeTab === 'register' ? 'relative' : 'absolute' }}>
                  {/* Conteúdo ou mensagem para aba Cadastre-se */}
                  <TabText style={{ marginBottom: 20, textAlign: 'center' }}>
                    Prepare-se para criar sua conta!
                  </TabText>
                </Animated.View>

                <Animated.View style={{ opacity: loginOpacity, position: activeTab === 'login' ? 'relative' : 'absolute' }}>
                  {/* Conteúdo ou mensagem para aba Entrar */}
                  <TabText style={{ marginBottom: 20, textAlign: 'center' }}>
                    Já possui uma conta? Faça login!
                  </TabText>
                </Animated.View>

                <PrimaryButton style={styles.button} onPress={handleContinue}>
                  <ButtonText>{activeTab === 'register' ? 'Criar Conta' : 'Fazer Login'}</ButtonText>
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
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  button: {
    marginTop: 18,
    paddingVertical: 14,
  },
});

export default AuthScreens;
