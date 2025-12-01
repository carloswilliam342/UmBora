// frontend/src/screens/SettingsScreen.js (Novo arquivo)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';

const SettingsScreen = ({ navigation }) => {
  const route = useRoute();
  // O userId será passado para o conjunto de abas e estará disponível aqui
  const { userId } = route.params || {};

  const handleBecomeDriver = () => {
    // Navega para a primeira tela do fluxo de cadastro de motorista
    navigation.navigate('DriverSignUpFlow', { userId: userId }); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <TouchableOpacity style={styles.optionButton} onPress={handleBecomeDriver}>
        <Text style={styles.optionText}>Quero me tornar motorista</Text>
      </TouchableOpacity>
      {/* Outras opções como "Editar Perfil", "Sair", etc. */}
    </View>
  );
};

// Adicione seus estilos aqui
const styles = StyleSheet.create({ /* ... */ });

export default SettingsScreen;
