import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
// 1. Importar o createBottomTabNavigator
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from './src/screens/SplashScreen.js';
import OnboardingScreens from './src/screens/OnboardingScreens.js';
import AuthScreens from './src/screens/AuthScreens.js';
import LoginScreen from './src/screens/LoginScreen.js';
import RegisterScreen from './src/screens/RegisterScreen.js';
import PhoneVerificationScreen from './src/screens/PhoneVerificationScreen.js';
import HomeScreen from './src/screens/HomeScreen.js';
import DriverRegistrationScreen from './src/screens/DriverRegistrationScreen.js';
import DriverEditScreen from './src/screens/DriverEditScreen.js';
import RegistroPassageiro from './src/screens/PassengerRegistrationScreen.js';
import PassengerHomeScreen from './src/screens/PassengerHomeScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';

// A. Definir os tipos de parâmetros para cada rota do Stack Navigator
type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Register: undefined;
  PhoneVerification: undefined;
  Login: undefined;
  Main: { userId: number };
  DriverSignUpFlow: { userId: number };
  DriverEdit: { userId: number };  // NOVO
  Passenger: { userId: number };
  PassengerHome: { userId: number };
};

// 2. Criar os dois tipos de navegador
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// B. Definir o tipo das props para o componente MainAppTabs
type MainAppTabsProps = NativeStackScreenProps<RootStackParamList, 'Main'>;

// 3. Criar um componente para a navegação principal (pós-login)
function MainAppTabs({ route }: MainAppTabsProps) {
  // Pega o userId passado para o MainAppTabs
  const { userId } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'home'; // fallback
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#43B649',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userId: userId }} // Passa o userId para a HomeScreen
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ userId: userId }}

        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // mostra splash por 2 segundos
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreens} />
        <Stack.Screen name="Auth" component={AuthScreens} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* 4. A rota "Main" agora carrega a navegação por abas */}
        <Stack.Screen name="Main" component={MainAppTabs} />
        <Stack.Screen name="DriverSignUpFlow" component={DriverRegistrationScreen} options={{ headerShown: true, title: 'Seja um Motorista' }} />
        <Stack.Screen name="DriverEdit" component={DriverEditScreen} options={{ headerShown: true, title: 'Editar Cadastro' }} />
        <Stack.Screen name="Passenger" component={RegistroPassageiro} />
        <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
