import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import SplashScreen from './src/screens/SplashScreen.js';
import OnboardingScreens from './src/screens/OnboardingScreens.js';
import AuthScreens from './src/screens/AuthScreens.js';
import LoginScreen from './src/screens/LoginScreen.js';
import RegisterScreen from './src/screens/RegisterScreen.js';
import PhoneVerificationScreen from './src/screens/PhoneVerificationScreen.js';
import HomeScreen from './src/screens/HomeScreen.js';
import DriverRegistrationScreen from './src/screens/DriverRegistrationScreen.js';
import RegistroPassageiro from './src/screens/PassengerRegistrationScreen,.js';
import PassengerHomeScreen from './src/screens/PassengerHomeScreen.js';


const Stack = createNativeStackNavigator();

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
        <Stack.Screen name = "Onboarding" component={OnboardingScreens} />
        <Stack.Screen name = "Auth" component={AuthScreens} />
        <Stack.Screen name = "Register" component={RegisterScreen} />
        <Stack.Screen name = "PhoneVerification" component={PhoneVerificationScreen} />
        <Stack.Screen name = "Login" component={LoginScreen} />
        <Stack.Screen name = "Home" component={HomeScreen}/>
        <Stack.Screen name = "Driver" component={DriverRegistrationScreen}/>
        <Stack.Screen name = "Passenger" component={RegistroPassageiro}/>

        <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
