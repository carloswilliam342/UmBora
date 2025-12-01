// frontend/src/screens/DriverSignUp/VehicleScreen.js (Exemplo)
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { applyToBeDriver } from '../../services/api';

const VehicleScreen = ({ navigation, route }) => {
  // Supondo que os dados vieram das telas anteriores
  const { userId, cnh } = route.params; 
  
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await applyToBeDriver({ userId, cnh, modelo, placa, cor });
      Alert.alert('Sucesso!', 'Seu cadastro foi enviado para análise.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextInput placeholder="Modelo do Veículo" value={modelo} onChangeText={setModelo} />
      <TextInput placeholder="Placa" value={placa} onChangeText={setPlaca} />
      <TextInput placeholder="Cor" value={cor} onChangeText={setCor} />
      <Button title={isLoading ? 'Enviando...' : 'Concluir'} onPress={handleSubmit} disabled={isLoading} />
    </View>
  );
};

export default VehicleScreen;
