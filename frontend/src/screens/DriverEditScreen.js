import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { getDriverProfile, updateDriverProfile } from '../services/driverService';

const coresDisponiveis = [
    'Branco', 'Preto', 'Prata', 'Cinza',
    'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Outro',
];

const DriverEditScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [formData, setFormData] = useState({
        modelo: '',
        placa: '',
        cor: '',
        current_latitude: null,
        current_longitude: null,
        is_available: false,
    });

    // Carregar dados do motorista ao abrir a tela
    useEffect(() => {
        loadDriverData();
    }, []);

    const loadDriverData = async () => {
        try {
            setLoading(true);
            const profile = await getDriverProfile(userId);

            if (!profile || !profile.isDriver) {
                Alert.alert('Erro', 'Você não está cadastrado como motorista.');
                navigation.goBack();
                return;
            }

            // Preencher formulário com dados atuais
            setFormData({
                modelo: profile.driver.vehicle?.modelo || '',
                placa: profile.driver.vehicle?.placa || '',
                cor: profile.driver.vehicle?.cor || '',
                current_latitude: profile.driver.location?.latitude ?? null,
                current_longitude: profile.driver.location?.longitude ?? null,
                is_available: profile.driver.isAvailable || false,
            });
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Alert.alert('Erro', 'Não foi possível carregar seus dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Obter localização do usuário
    const getUserLocation = async () => {
        setLoadingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos da sua localização para atualizar sua posição no mapa.');
                setLoadingLocation(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            setFormData(prev => ({
                ...prev,
                current_latitude: latitude,
                current_longitude: longitude
            }));

            Alert.alert('Sucesso!', `Localização atualizada:\\nLat: ${latitude.toFixed(6)}\\nLng: ${longitude.toFixed(6)}`);
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            Alert.alert('Erro', 'Não foi possível obter sua localização. Tente novamente.');
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleSave = async () => {
        const { modelo, placa, cor } = formData;

        if (!modelo || !placa || !cor) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos do veículo.');
            return;
        }

        setSaving(true);
        try {
            await updateDriverProfile(userId, {
                modelo,
                placa,
                cor,
                current_latitude: formData.current_latitude,
                current_longitude: formData.current_longitude,
                is_available: formData.is_available,
            });

            Alert.alert(
                'Sucesso!',
                'Seus dados foram atualizados com sucesso.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', error.message || 'Não foi possível salvar as alterações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Editar Cadastro de Motorista</Text>

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

            {/* Seção de Localização */}
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
                        📍 Atualizar Minha Localização
                    </Text>
                )}
            </TouchableOpacity>

            {formData.current_latitude && formData.current_longitude && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                        ✅ Localização atual: {formData.current_latitude.toFixed(6)}, {formData.current_longitude.toFixed(6)}
                    </Text>
                </View>
            )}

            {!formData.current_latitude && !formData.current_longitude && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                        ⚠️ Nenhuma localização definida. Clique no botão acima para obter sua localização.
                    </Text>
                </View>
            )}

            {/* Seção de Disponibilidade */}
            <View style={styles.availabilityContainer}>
                <View style={styles.availabilityTextContainer}>
                    <Text style={styles.sectionTitle}>Disponível para corridas</Text>
                    <Text style={styles.availabilitySubtext}>
                        {formData.is_available ? 'Você está visível no mapa' : 'Você está invisível no mapa'}
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
                {saving ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <Button
                        title="Salvar Alterações"
                        onPress={handleSave}
                        color={colors.primary}
                        disabled={saving}
                    />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.textSecondary,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 20,
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
    pickerContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        height: 50,
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
    buttonContainer: {
        marginTop: 30,
        justifyContent: 'center',
    },
});

export default DriverEditScreen;
