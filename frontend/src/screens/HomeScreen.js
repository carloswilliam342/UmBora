import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { View, StatusBar, Text as RNText, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Container,
  MainTitle,
  Text,
  PrimaryButton,
  ButtonText,
  colors
} from '../components/StyledComponents';
import { getDriverProfile } from '../services/driverService';
import { getDriverPendingRequests } from '../services/rideService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  const [isDriver, setIsDriver] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    checkIfDriver();
  }, []);

  // Polling para atualizar contador de notificações
  useEffect(() => {
    if (!driverId) return;

    loadPendingRequestsCount();
    const interval = setInterval(loadPendingRequestsCount, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [driverId]);

  // Recarregar ao focar na tela
  useFocusEffect(
    React.useCallback(() => {
      if (driverId) {
        loadPendingRequestsCount();
      }
    }, [driverId])
  );

  const checkIfDriver = async () => {
    try {
      const profile = await getDriverProfile(userId);
      setIsDriver(profile?.isDriver || false);
      setDriverId(profile?.driver?.id || null);
    } catch (error) {
      console.error('Erro ao verificar motorista:', error);
      setIsDriver(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequestsCount = async () => {
    try {
      const response = await getDriverPendingRequests(driverId);
      setPendingRequestsCount(response.count || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleBuscarCorrida = () => {
    navigation.navigate('PassengerHome', { userId: userId });
  };

  const handleCadastrarCarona = () => {
    navigation.navigate('RideCreate', { driverId });
  };

  return (
    <Container style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* 1. Cabeçalho Verde Grande */}
      <View style={styles.headerContainer}>
        {/* Nome do App estilizado */}
        <RNText style={styles.logoText}>Umbora</RNText>

        {/* Botão de Notificações (só para motoristas) */}
        {isDriver && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('DriverHome', { userId })}
            activeOpacity={0.7}
          >
            <RNText style={styles.bellIcon}>🔔</RNText>
            {pendingRequestsCount > 0 && (
              <View style={styles.notificationBadge}>
                <RNText style={styles.badgeText}>
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </RNText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Corpo Branco que "sobe" sobre o verde */}
      <View style={styles.whiteBodyContainer}>

        {/* Conteúdo */}
        <View style={styles.contentInterno}>
          <MainTitle color={colors.primary} style={{ marginBottom: 10 }}>
            Bem-vindo ao Umbora!
          </MainTitle>

          <Text
            align="center"
            color={colors.textSecondary}
            mb="40px"
            style={{ fontWeight: '1000' }}
          >
            Busque por caronas ou cadastre-se como motorista.
          </Text>

          <PrimaryButton
            onPress={handleBuscarCorrida}
            style={styles.highlightedButton}
            activeOpacity={0.8}
          >
            <ButtonText>BUSCAR CORRIDA</ButtonText>
          </PrimaryButton>

          {/* Botão para motoristas cadastrarem carona */}
          {loading ? (
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : isDriver && (
            <>
              <TouchableOpacity
                onPress={handleCadastrarCarona}
                style={styles.driverButton}
                activeOpacity={0.8}
              >
                <RNText style={styles.driverButtonText}>+ Cadastrar Nova Carona</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('DriverRides', { userId })}
                style={[styles.driverButton, styles.viewRidesButton]}
                activeOpacity={0.8}
              >
                <RNText style={styles.viewRidesButtonText}>📋 Ver Minhas Caronas</RNText>
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    </Container>
  );
};

const styles = {
  headerContainer: {
    width: '100%',
    height: 170, // Altura grande para caber o logo e o efeito da curva
    backgroundColor: colors.primary,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center',     // Centraliza horizontalmente
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  whiteBodyContainer: {
    flex: 1,
    backgroundColor: '#FFF', // Fundo branco

    // O SEGREDO DA CURVA INVERTIDA:
    marginTop: -50, // Puxa a tela branca para CIMA, cobrindo o final do verde
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,

    // Sombra suave na borda da curva
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 }, // Sombra para cima
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  contentInterno: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50, // Espaço interno para o texto não colar na curva
    paddingHorizontal: 30,
  },
  highlightedButton: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  driverButton: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  driverButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewRidesButton: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  viewRidesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  bellIcon: {
    fontSize: 28,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
};

export default HomeScreen;