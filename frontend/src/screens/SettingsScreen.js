// frontend/src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { 
  Container, 
  colors 
} from '../components/StyledComponents';

const SettingsScreen = ({ navigation }) => {
  const route = useRoute();
  const { userId } = route.params || {};

  // Função para ir para o cadastro de motorista
  const handleBecomeDriver = () => {
    navigation.navigate('DriverSignUpFlow', { userId: userId }); 
  };

  // Função para ir para o Perfil (Placeholder por enquanto)
  const handleProfile = () => {
    // Se você tiver uma tela de perfil, mude 'ProfileScreen' para o nome dela
    // navigation.navigate('ProfileScreen', { userId: userId });
    Alert.alert("Em breve", "Tela de perfil em desenvolvimento.");
  };

  return (
    <Container style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* 1. O mesmo Cabeçalho Verde da Home */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>Configurações</Text>
      </View>

      {/* 2. O Corpo Branco com Curva Invertida */}
      <View style={styles.whiteBodyContainer}>
        
        <View style={styles.contentInterno}>
          
          {/* --- Botão 1: Meu Perfil --- */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleProfile} // Corrigido: Agora chama a função de perfil
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.actionButtonTitle}>Meu Perfil</Text>
              <Text style={styles.actionButtonSubtitle}>Edite seus dados pessoais</Text>
            </View>
            <Text style={styles.arrowIcon}>{'>'}</Text>
          </TouchableOpacity>
          
          {/* --- Botão 2: Virar Motorista --- */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleBecomeDriver}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.actionButtonTitle}>Quero me tornar motorista</Text>
              <Text style={styles.actionButtonSubtitle}>Faça uma renda extra dirigindo</Text>
            </View>
            <Text style={styles.arrowIcon}>{'>'}</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  // --- Estilos copiados da Home para manter padrão ---
  headerContainer: {
    width: '100%',
    height: 170, // Ajuste a altura se o texto ficar cortado
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 40, // Tamanho do título "Configurações"
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
    // fontStyle: 'italic', // Removi o itálico para ficar mais legível como título, mas pode descomentar
  },
  whiteBodyContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: -50, // O segredo da curva
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  contentInterno: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 25,
  },

  // --- Estilos Específicos desta tela ---
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    // Sombra
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#00000010' // Borda bem suave
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  }
});

export default SettingsScreen;