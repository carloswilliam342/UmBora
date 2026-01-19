import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    Container,
    GradientContainer,
    Card,
    MainTitle,
    Text,
    TextInput,
    PrimaryButton,
    ButtonText,
    SecondaryButton,
    colors
} from '../components/StyledComponents';
import { getUserProfile, updateUserProfile } from '../services/api';
import { clearUserSession } from '../services/authService';
import { CommonActions } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
    const route = useRoute();
    const { userId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const response = await getUserProfile(userId);
            setUserData({
                name: response.user.name || '',
                email: response.user.email || '',
                phone: response.user.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            Alert.alert('Erro', error.message || 'Não foi possível carregar seus dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        // Validar nome
        if (!userData.name || userData.name.trim() === '') {
            Alert.alert('Erro de Validação', 'O nome não pode estar vazio.');
            return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!userData.email || !emailRegex.test(userData.email)) {
            Alert.alert('Erro de Validação', 'Por favor, insira um e-mail válido.');
            return false;
        }

        // Validar senha (se preenchida)
        if (userData.newPassword) {
            if (userData.newPassword.length < 6) {
                Alert.alert('Erro de Validação', 'A senha deve ter no mínimo 6 caracteres.');
                return false;
            }

            if (userData.newPassword !== userData.confirmPassword) {
                Alert.alert('Erro de Validação', 'As senhas não coincidem.');
                return false;
            }
        }

        return true;
    };

    const handleSaveChanges = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            // Preparar dados para envio (apenas campos que serão atualizados)
            const updateData = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone
            };

            // Adicionar senha apenas se foi preenchida
            if (userData.newPassword && userData.newPassword.trim() !== '') {
                updateData.password = userData.newPassword;
            }

            const response = await updateUserProfile(userId, updateData);

            Alert.alert('Sucesso', response.message || 'Dados atualizados com sucesso!');

            // Limpar campos de senha
            setUserData(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));

            // Recarregar dados atualizados
            await loadUserData();

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            Alert.alert('Erro', error.message || 'Não foi possível atualizar seus dados.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Confirmar Logout',
            'Tem certeza que deseja sair?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        await clearUserSession();
                        // Resetar navegação para a tela de Login, limpando o histórico
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            })
                        );
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <Container>
                <GradientContainer>
                    <ActivityIndicator size="large" color={colors.white} />
                    <Text color={colors.white} style={{ marginTop: 20 }}>
                        Carregando seus dados...
                    </Text>
                </GradientContainer>
            </Container>
        );
    }

    return (
        <Container>
            <ScrollView>
                <GradientContainer style={{ minHeight: 200 }}>
                    <MainTitle>Meu Perfil</MainTitle>
                    <Ionicons name="person-circle" size={80} color={colors.white} />
                </GradientContainer>

                <Card style={{ marginTop: -40 }}>
                    <Text mb="20px" color={colors.textSecondary} align="center" style={{ fontWeight: 'bold' }}>
                        Edite suas informações pessoais
                    </Text>

                    <Text color={colors.text} mb="5px" style={{ fontWeight: 'bold' }}>
                        Nome
                    </Text>
                    <TextInput
                        placeholder="Seu nome completo"
                        value={userData.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        autoCapitalize="words"
                    />

                    <Text color={colors.text} mb="5px" style={{ fontWeight: 'bold' }}>
                        E-mail
                    </Text>
                    <TextInput
                        placeholder="seu@email.com"
                        value={userData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text color={colors.text} mb="5px" style={{ fontWeight: 'bold' }}>
                        Telefone
                    </Text>
                    <TextInput
                        placeholder="11999999999"
                        value={userData.phone}
                        onChangeText={(text) => handleInputChange('phone', text)}
                        keyboardType="phone-pad"
                    />

                    <View style={{ marginTop: 20, marginBottom: 10 }}>
                        <Text color={colors.textSecondary} mb="10px" align="center">
                            Alterar senha (opcional)
                        </Text>
                    </View>

                    <Text color={colors.text} mb="5px" style={{ fontWeight: 'bold' }}>
                        Nova Senha
                    </Text>
                    <TextInput
                        placeholder="Deixe em branco para manter a atual"
                        value={userData.newPassword}
                        onChangeText={(text) => handleInputChange('newPassword', text)}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    {userData.newPassword !== '' && (
                        <>
                            <Text color={colors.text} mb="5px" style={{ fontWeight: 'bold' }}>
                                Confirmar Nova Senha
                            </Text>
                            <TextInput
                                placeholder="Digite a senha novamente"
                                value={userData.confirmPassword}
                                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </>
                    )}

                    <PrimaryButton
                        onPress={handleSaveChanges}
                        disabled={saving}
                        style={{ opacity: saving ? 0.5 : 1, marginTop: 20 }}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <ButtonText>💾 Salvar Alterações</ButtonText>
                        )}
                    </PrimaryButton>

                    <SecondaryButton onPress={handleLogout} style={{ marginTop: 10 }}>
                        <ButtonText color={colors.error}>
                            <Ionicons name="log-out-outline" size={18} /> Sair da Conta
                        </ButtonText>
                    </SecondaryButton>
                </Card>
            </ScrollView>
        </Container>
    );
};

export default ProfileScreen;
