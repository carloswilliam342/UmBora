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
  Switch,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
const coresDisponiveis = [
  'Branco',
  'Preto',
  'Prata',
  'Cinza',
  'Azul',
  'Vermelho',
  'Verde',
  'Amarelo',
  'Outro',
];
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../components/StyledComponents'; // Reutilizando as cores do projeto
// 1. Importar a nova função em vez da API_URL diretamente
import { applyToBeDriver } from '../services/api';

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
    modelo: '', // Renomeado para corresponder à API
    placa: '',  // Renomeado para corresponder à API
    cor: '',    // Renomeado para corresponder à API
    current_latitude: null,  // NOVO
    current_longitude: null, // NOVO
    is_available: false,     // NOVO
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [errors, setErrors] = useState({
    cpf: '',
    cnh: '',
    placaVeiculo: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validações em tempo real
    if (field === 'cpf') {
      setErrors(prev => ({ ...prev, cpf: validarCPF(value) ? '' : 'CPF inválido' }));
    } else if (field === 'cnh') {
      setErrors(prev => ({ ...prev, cnh: validarCNH(value) ? '' : 'CNH inválida (deve ter 11 dígitos)' }));
    } else if (field === 'placa') {
      setErrors(prev => ({ ...prev, placaVeiculo: validarPlaca(value) ? '' : 'Placa inválida (ex: ABC-1234)' }));
    }
  };

  // Validação de CPF (algoritmo brasileiro)
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    return digito2 === parseInt(cpf.charAt(10));
  };

  // Validação de CNH (11 dígitos numéricos)
  const validarCNH = (cnh) => {
    cnh = cnh.replace(/\D/g, '');
    return cnh.length === 11;
  };

  // Validação de placa (padrão brasileiro)
  const validarPlaca = (placa) => {
    return /^[A-Z]{3}-?\d{4}$/.test(placa.toUpperCase());
  };

  // NOVA FUNÇÃO: Obter localização do usuário
  const getUserLocation = async () => {
    setLoadingLocation(true);
    try {
      // Solicitar permissão de localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para cadastrá-lo no mapa.');
        setLoadingLocation(false);
        return;
      }

      // Obter localização atual
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setFormData(prev => ({
        ...prev,
        current_latitude: latitude,
        current_longitude: longitude
      }));

      Alert.alert('Sucesso!', `Localização obtida:\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização. Tente novamente.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // A lógica de chamada da API agora está centralizada no services/api.js

  const handleRegister = async () => {
    const { nome, cpf, cnh, modelo, placa, cor } = formData;
    // Validação simples para verificar se os campos não estão vazios
    if (!nome || !cpf || !cnh || !modelo || !placa || !cor) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (!validarCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido.');
      return;
    }
    if (!validarCNH(cnh)) {
      Alert.alert('Erro', 'CNH inválida.');
      return;
    }
    if (!validarPlaca(placa)) {
      Alert.alert('Erro', 'Placa do veículo inválida.');
      return;
    }

    setLoading(true);
    try {
      // 2. Chamar a nova função do serviço de API com os novos campos
      await applyToBeDriver({
        userId: userId,
        cnh: formData.cnh,
        modelo: formData.modelo,
        placa: formData.placa,
        cor: formData.cor,
        current_latitude: formData.current_latitude,    // NOVO
        current_longitude: formData.current_longitude,  // NOVO
        is_available: formData.is_available,            // NOVO
      });

      Alert.alert(
        'Sucesso!',
        'Seu cadastro foi enviado para análise.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ nome: '', cpf: '', cnh: '', modelo: '', placa: '', cor: '' })
              // O 'reset' limpa a pilha de navegação, impedindo o usuário de voltar para a tela de cadastro.
              navigation.reset({ index: 0, routes: [{ name: 'Main', params: { userId: userId } }] });
            },
          },
        ]
      );
    } catch (error) {
      // O erro já vem formatado do nosso serviço de API
      Alert.alert('Erro ao cadastrar', error.message);
    }
    finally {
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
      {errors.cpf ? <Text style={{ color: 'red', marginBottom: 10 }}>{errors.cpf}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Número da CNH"
        value={formData.cnh}
        onChangeText={(text) => handleInputChange('cnh', text)}
        keyboardType="numeric"
        placeholderTextColor="#888"
      />
      {errors.cnh ? <Text style={{ color: 'red', marginBottom: 10 }}>{errors.cnh}</Text> : null}

      <Text style={styles.sectionTitle}>Informações do Veículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Modelo do Veículo (ex: Fiat Uno)"
        value={formData.modelo}
        onChangeText={(text) => handleInputChange('modelo', text)}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Placa do Veículo (ex: ABC-1234)"
        value={formData.placa}
        onChangeText={(text) => handleInputChange('placa', text)}
        autoCapitalize="characters"
        placeholderTextColor="#888"
      />
      {errors.placaVeiculo ? <Text style={{ color: 'red', marginBottom: 10 }}>{errors.placaVeiculo}</Text> : null}
      <Text style={styles.sectionTitle}>Cor do Veículo</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.cor}
          onValueChange={(itemValue) => handleInputChange('cor', itemValue)}
        >
          <Picker.Item label="Selecione uma cor" value="" />
          {coresDisponiveis.map((cor) => (
            <Picker.Item key={cor} label={cor} value={cor} />
          ))}
        </Picker>
      </View>

      {/* NOVA SEÇÃO: Localização */}
      <Text style={styles.sectionTitle}>Localização</Text>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={getUserLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.locationButtonText}>
            📍 {formData.current_latitude ? 'Atualizar Localização' : 'Usar Minha Localização Atual'}
          </Text>
        )}
      </TouchableOpacity>

      {formData.current_latitude && formData.current_longitude && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            ✅ Localização obtida: {formData.current_latitude.toFixed(6)}, {formData.current_longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* NOVA SEÇÃO: Disponibilidade */}
      <View style={styles.availabilityContainer}>
        <View style={styles.availabilityTextContainer}>
          <Text style={styles.sectionTitle}>Disponível para corridas</Text>
          <Text style={styles.availabilitySubtext}>
            Você poderá alterar isso depois
          </Text>
        </View>
        <Switch
          value={formData.is_available}
          onValueChange={(value) => handleInputChange('is_available', value)}
          trackColor={{ false: '#ccc', true: colors.primary }}
          thumbColor={formData.is_available ? '#fff' : '#f4f3f4'}
        />
      </View>

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
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
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
  locationButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilitySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default DriverRegistrationScreen;