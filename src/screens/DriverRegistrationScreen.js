import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../components/StyledComponents'; // Reutilizando as cores do projeto

const DriverRegistrationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {}; // Recebe o userId da navegação
  const [loading, setLoading] = useState(false);

  // Estado para os dados pessoais
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    corVeiculo: '',
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // A URL da API é carregada a partir das variáveis de ambiente
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const handleRegister = async () => {
    const { nome, cpf, cnh, modeloVeiculo, placaVeiculo, corVeiculo } = formData;
    // Validação simples para verificar se os campos não estão vazios
    if (!nome || !cpf || !cnh || !modeloVeiculo || !placaVeiculo || !corVeiculo ) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Ajuste o endpoint '/driver' conforme a sua API no backend
      const response = await fetch(`${API_URL}/driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId, // Envia o userId para o backend
          nome: formData.nome,
          cpf: formData.cpf,
          cnh: formData.cnh,
          veiculo: {
              modelo: formData.modeloVeiculo,
              placa: formData.placaVeiculo,
              cor: formData.corVeiculo,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Sucesso!',
          'Seu cadastro foi enviado para análise.',
          [
            {
              text: 'OK',
              onPress: () => {
               setFormData({nome: '', cpf: '', cnh: '', modeloVeiculo: '', placaVeiculo: '', corVeiculo: ''})
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro ao cadastrar', data.message || 'Não foi possível concluir o cadastro.');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.');
    }
    finally{
        setLoading(false)
    }

    

  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Cadastro de Motorista</Text>

      <Text style={styles.sectionTitle}>Informações Pessoais</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={formData.nome}
        onChangeText={(text) => handleInputChange('nome', text)}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={formData.cpf}
        onChangeText={(text) => handleInputChange('cpf', text)}
        keyboardType="numeric"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Número da CNH"
        value={formData.cnh}
        onChangeText={(text) => handleInputChange('cnh', text)}
        keyboardType="numeric"
        placeholderTextColor="#888"
      />

      <Text style={styles.sectionTitle}>Informações do Veículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Modelo do Veículo (ex: Fiat Uno)"
        value={formData.modeloVeiculo}
        onChangeText={(text) => handleInputChange('modeloVeiculo', text)}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Placa do Veículo (ex: ABC-1234)"
        value={formData.placaVeiculo}
        onChangeText={(text) => handleInputChange('placaVeiculo', text)}
        autoCapitalize="characters"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Cor do Veículo"
        value={formData.corVeiculo}
        onChangeText={(text) => handleInputChange('corVeiculo', text)}
        placeholderTextColor="#888"
      />

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button title="Finalizar Cadastro" onPress={handleRegister} color={colors.primary} disabled={loading} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: colors.white || '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    marginTop: 30,
    justifyContent: 'center',
  },
});

export default DriverRegistrationScreen;