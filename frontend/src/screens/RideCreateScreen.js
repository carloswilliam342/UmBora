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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { createRide } from '../services/rideService';
import AddressAutocomplete from '../components/AddressAutocomplete';

const RideCreateScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { driverId } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [formData, setFormData] = useState({
        origin: null, // Armazena objeto completo do endereço
        destination: null,
        departureDate: new Date(),
        availableSeats: 1,
        pricePerSeat: '',
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOriginSelect = (address) => {
        setFormData(prev => ({ ...prev, origin: address }));
    };

    const handleDestinationSelect = (address) => {
        setFormData(prev => ({ ...prev, destination: address }));
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, departureDate: selectedDate }));
        }
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(formData.departureDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setFormData(prev => ({ ...prev, departureDate: newDate }));
        }
    };

    const validateForm = () => {
        if (!formData.origin) {
            Alert.alert('Erro', 'Selecione o endereço de origem');
            return false;
        }
        if (!formData.destination) {
            Alert.alert('Erro', 'Selecione o endereço de destino');
            return false;
        }
        if (formData.departureDate <= new Date()) {
            Alert.alert('Erro', 'O horário de partida deve ser no futuro');
            return false;
        }
        if (formData.availableSeats < 1 || formData.availableSeats > 8) {
            Alert.alert('Erro', 'Número de vagas deve ser entre 1 e 8');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const rideData = {
                driverId,
                origin: {
                    address: formData.origin.displayName,
                    latitude: formData.origin.latitude,
                    longitude: formData.origin.longitude,
                },
                destination: {
                    address: formData.destination.displayName,
                    latitude: formData.destination.latitude,
                    longitude: formData.destination.longitude,
                },
                departureTime: formData.departureDate.toISOString(),
                availableSeats: parseInt(formData.availableSeats),
                pricePerSeat: formData.pricePerSeat ? parseFloat(formData.pricePerSeat) : 0,
            };

            const response = await createRide(rideData);

            Alert.alert(
                'Sucesso!',
                'Carona cadastrada com sucesso!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Erro ao cadastrar carona:', error);
            Alert.alert('Erro', error.response?.data?.message || 'Não foi possível cadastrar a carona');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Cadastrar Nova Carona</Text>

            {/* Origem */}
            <Text style={styles.sectionTitle}>Origem</Text>
            <AddressAutocomplete
                placeholder="Digite o endereço de origem (ex: Av. Paulista, São Paulo)"
                onSelectAddress={handleOriginSelect}
            />
            {formData.origin && (
                <View style={styles.selectedAddressContainer}>
                    <Text style={styles.selectedAddressLabel}>✓ Endereço selecionado:</Text>
                    <Text style={styles.selectedAddressText} numberOfLines={2}>
                        {formData.origin.displayName}
                    </Text>
                    <Text style={styles.coordsText}>
                        📍 {formData.origin.latitude.toFixed(6)}, {formData.origin.longitude.toFixed(6)}
                    </Text>
                </View>
            )}

            {/* Destino */}
            <Text style={styles.sectionTitle}>Destino</Text>
            <AddressAutocomplete
                placeholder="Digite o endereço de destino (ex: Av. Faria Lima, São Paulo)"
                onSelectAddress={handleDestinationSelect}
            />
            {formData.destination && (
                <View style={styles.selectedAddressContainer}>
                    <Text style={styles.selectedAddressLabel}>✓ Endereço selecionado:</Text>
                    <Text style={styles.selectedAddressText} numberOfLines={2}>
                        {formData.destination.displayName}
                    </Text>
                    <Text style={styles.coordsText}>
                        📍 {formData.destination.latitude.toFixed(6)}, {formData.destination.longitude.toFixed(6)}
                    </Text>
                </View>
            )}

            {/* Horário */}
            <Text style={styles.sectionTitle}>Horário de Partida</Text>
            <Button
                title={`Data: ${formData.departureDate.toLocaleDateString()}`}
                onPress={() => setShowDatePicker(true)}
                color={colors.primary}
            />
            {showDatePicker && (
                <DateTimePicker
                    value={formData.departureDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}

            <View style={{ marginTop: 10 }} />
            <Button
                title={`Hora: ${formData.departureDate.toLocaleTimeString()}`}
                onPress={() => setShowTimePicker(true)}
                color={colors.primary}
            />
            {showTimePicker && (
                <DateTimePicker
                    value={formData.departureDate}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                />
            )}

            {/* Vagas */}
            <Text style={styles.sectionTitle}>Vagas Disponíveis</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={formData.availableSeats}
                    onValueChange={(value) => handleInputChange('availableSeats', value)}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <Picker.Item key={num} label={`${num} vaga${num > 1 ? 's' : ''}`} value={num} />
                    ))}
                </Picker>
            </View>

            {/* Preço */}
            <Text style={styles.sectionTitle}>Preço por Vaga (Opcional)</Text>
            <TextInput
                style={styles.input}
                placeholder="R$ 0,00 (deixe vazio para carona gratuita)"
                value={formData.pricePerSeat}
                onChangeText={(text) => handleInputChange('pricePerSeat', text)}
                keyboardType="numeric"
                placeholderTextColor="#888"
            />

            {/* Botão */}
            <View style={styles.buttonContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <Button
                        title="Cadastrar Carona"
                        onPress={handleSubmit}
                        color={colors.primary}
                        disabled={loading}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    selectedAddressContainer: {
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    selectedAddressLabel: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    selectedAddressText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    coordsText: {
        fontSize: 12,
        color: '#666',
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
    buttonContainer: {
        marginTop: 30,
        marginBottom: 30,
    },
});

export default RideCreateScreen;
