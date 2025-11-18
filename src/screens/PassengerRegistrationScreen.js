import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Button, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../components/StyledComponents.js"; 

const RegistroPassageiro = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params || {}; 
    const [carregando, setCarregando] = useState(false);

    const [formData, setFormData] = useState({
        nome: '', // O nome geralmente já vem do cadastro de usuário, mas pode manter se quiser confirmar
        cpf: '',
        cep: '',
        rua: '',
        bairro: '',
        numero: '',
    })

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // CORREÇÃO: Use o nome correto da variável de ambiente usada no projeto
    const API_URL = process.env.EXPO_PUBLIC_API_URL; 

    const handleRegister = async () => {
        // Validação básica
        if(!formData.cpf || !formData.cep || !formData.rua){
            Alert.alert('Erro!', 'Por favor, preencha os campos obrigatórios.')
            return
        }

        setCarregando(true)
        try{
            const resposta = await fetch(`${API_URL}/passenger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',},
                body: JSON.stringify({
                    userId: userId,
                    // Enviamos todos os dados do formulário
                    cpf: formData.cpf,
                    cep: formData.cep,
                    rua: formData.rua,
                    bairro: formData.bairro,
                    numero: formData.numero
                }),
            })

            const data = await resposta.json()

            if(resposta.ok){
                Alert.alert('Sucesso!', 'Cadastro de passageiro realizado!', [{
                    text: 'Ir para Home',
                    onPress: () => {
                        // Limpa e volta
                        setFormData({nome: '', cpf: '', cep: '', rua: '', bairro: '', numero: ''})
                        navigation.navigate('PassengerHome', { userId: userId }) // Ou goBack()
                    },
                },
            ])
            }else{
                Alert.alert('Erro ao cadastrar', data.message || 'Não foi possível concluir o cadastro.')
            }
        }catch(e){
            console.error(`Erro de rede: ${e}`)
            Alert.alert('Erro', 'Não foi possível conectar ao servidor.')
        }finally{
            setCarregando(false)
        }
    }

    return(
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Cadastro de Passageiro</Text>

            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            
            {/* Input de Nome (Opcional se já tem no User, mas ok manter visualmente) */}
            <TextInput 
                style={styles.input}
                placeholder="Nome Completo"
                value={formData.nome}
                onChangeText={(text) => handleInputChange('nome', text)}
            />

            <TextInput 
                style={styles.input}
                placeholder="CPF"
                value={formData.cpf}
                onChangeText={(text) => handleInputChange('cpf', text)}
                keyboardType="numeric"
                maxLength={14}
            />

            <Text style={styles.sectionTitle}>Endereço</Text>

            {/* CORREÇÃO: Inputs distintos para cada campo */}
            <TextInput 
                style={styles.input}
                placeholder="CEP"
                value={formData.cep}
                onChangeText={(text) => handleInputChange('cep', text)}
                keyboardType="numeric"
                maxLength={9}
            />

            <TextInput 
                style={styles.input}
                placeholder="Rua / Avenida"
                value={formData.rua}
                onChangeText={(text) => handleInputChange('rua', text)}
            />

            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <TextInput 
                    style={[styles.input, {flex: 2, marginRight: 10}]}
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChangeText={(text) => handleInputChange('bairro', text)}
                />
                <TextInput 
                    style={[styles.input, {flex: 1}]}
                    placeholder="Número"
                    value={formData.numero}
                    onChangeText={(text) => handleInputChange('numero', text)}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.buttonContainer}>
                {carregando ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ):(
                    <Button title="Finalizar Cadastro" onPress={handleRegister} color={colors.primary} disabled={carregando} />
                )}
            </View>

        </ScrollView>
    )
}

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
    marginBottom: 40, // Espaço extra no final
    justifyContent: 'center',
  },
});

export default RegistroPassageiro;