import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { getAvailableRides, requestRide, getPassengerByUserId } from '../services/rideService';
import { getUserSession } from '../services/authService';
import AddressAutocomplete from '../components/AddressAutocomplete';

const PassengerHomeScreen = () => {
    const navigation = useNavigation();
    const [userLocation, setUserLocation] = useState(null);
    const [rides, setRides] = useState([]);
    const [region, setRegion] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchDestination, setSearchDestination] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    // Estados para o modal de detalhes da carona
    const [selectedRide, setSelectedRide] = useState(null);
    const [showRideModal, setShowRideModal] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [passengerId, setPassengerId] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        getUserLocation();
        loadPassengerId();
    }, []);

    const loadPassengerId = async () => {
        try {
            const userIdFromSession = await getUserSession();
            if (userIdFromSession) {
                setUserId(userIdFromSession);
                const response = await getPassengerByUserId(userIdFromSession);
                if (response.passenger) {
                    setPassengerId(response.passenger.id);
                }
            }
        } catch (error) {
            console.log('Passageiro não encontrado:', error);
        }
    };

    const getUserLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permissão de localização negada');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            setUserLocation({ latitude, longitude });
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });

            // Buscar caronas disponíveis próximas
            await fetchAvailableRides(latitude, longitude);
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            setErrorMsg('Erro ao obter localização');
        }
    };

    const fetchAvailableRides = async (latitude, longitude, radius = 20) => {
        try {
            const response = await getAvailableRides(latitude, longitude, radius);
            console.log('Caronas encontradas:', response.count);
            setRides(response.rides || []);
        } catch (error) {
            console.error('Erro ao buscar caronas:', error);
            setRides([]);
        }
    };

    const handleDestinationSelect = async (destination) => {
        setSearchDestination(destination);

        const addressParts = destination.displayName.split(',');
        const searchCity = addressParts[0]?.trim() || destination.displayName;

        if (userLocation) {
            try {
                const response = await getAvailableRides(
                    destination.latitude,
                    destination.longitude,
                    50,
                    searchCity
                );

                if (response.rides && response.rides.length > 0) {
                    setRides(response.rides);

                    const allCoordinates = response.rides.map(ride => ({
                        latitude: ride.origin.latitude,
                        longitude: ride.origin.longitude
                    }));

                    const lats = allCoordinates.map(c => c.latitude);
                    const lngs = allCoordinates.map(c => c.longitude);

                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);

                    setRegion({
                        latitude: (minLat + maxLat) / 2,
                        longitude: (minLng + maxLng) / 2,
                        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.1),
                        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.1),
                    });

                    Alert.alert(
                        'Caronas Encontradas',
                        `Encontramos ${response.rides.length} carona(s) disponível(is)!`
                    );
                } else {
                    Alert.alert('Nenhuma Carona', 'Não há caronas para este destino.');
                    setRides([]);
                }
            } catch (error) {
                console.error('Erro ao buscar caronas:', error);
                Alert.alert('Erro', 'Não foi possível buscar caronas.');
            }
        }
    };

    const clearSearch = async () => {
        setSearchDestination(null);
        if (userLocation) {
            await fetchAvailableRides(userLocation.latitude, userLocation.longitude);
            setRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    const handleMarkerPress = (ride) => {
        setSelectedRide(ride);
        setShowRideModal(true);
    };

    const handleRequestRide = async () => {
        if (!passengerId) {
            Alert.alert(
                'Cadastro Incompleto',
                'Você precisa completar seu cadastro de passageiro para solicitar caronas.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Completar Cadastro',
                        onPress: () => {
                            setShowRideModal(false);
                            navigation.navigate('Passenger', { userId: userId });
                        }
                    }
                ]
            );
            return;
        }

        if (!selectedRide) return;

        setRequesting(true);
        try {
            const response = await requestRide(selectedRide.id, passengerId);

            Alert.alert(
                '✅ Solicitação Enviada!',
                response.message || 'Aguarde a confirmação do motorista.',
                [{ text: 'OK', onPress: () => setShowRideModal(false) }]
            );

            // Atualizar lista de caronas
            if (userLocation) {
                await fetchAvailableRides(userLocation.latitude, userLocation.longitude);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Erro ao solicitar vaga.';
            Alert.alert('Erro', errorMessage);
        } finally {
            setRequesting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            {/* Mapa */}
            {region && (
                <MapView
                    style={styles.map}
                    region={region}
                    provider="google"
                    customMapStyle={[]}
                >
                    {/* Marcador do usuário */}
                    {userLocation && (
                        <Marker
                            coordinate={userLocation}
                            title="Você está aqui"
                            pinColor="blue"
                        />
                    )}

                    {/* Marcadores das caronas disponíveis */}
                    {rides.map((ride) => (
                        <Marker
                            key={ride.id}
                            coordinate={{
                                latitude: ride.origin.latitude,
                                longitude: ride.origin.longitude,
                            }}
                            pinColor={ride.availableSeats > 0 ? "green" : "#9E9E9E"}
                            onPress={() => handleMarkerPress(ride)}
                        />
                    ))}
                </MapView>
            )}

            {/* Card de busca flutuante */}
            <View style={styles.searchCard}>
                <Text style={styles.searchTitle}>🔍 Buscar Carona</Text>

                {!showSearch ? (
                    <TouchableOpacity
                        style={styles.showSearchButton}
                        onPress={() => setShowSearch(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.showSearchButtonText}>
                            Para onde você quer ir?
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <AddressAutocomplete
                            placeholder="Digite seu destino"
                            onSelectAddress={handleDestinationSelect}
                        />

                        {searchDestination && (
                            <View style={styles.selectedDestination}>
                                <Text style={styles.selectedLabel}>Destino:</Text>
                                <Text style={styles.selectedText} numberOfLines={2}>
                                    {searchDestination.displayName}
                                </Text>
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={clearSearch}
                                >
                                    <Text style={styles.clearButtonText}>Limpar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                <View style={styles.ridesCounter}>
                    <Text style={styles.counterText}>
                        {rides.length} carona(s) disponível(is)
                    </Text>
                </View>
            </View>

            {/* Modal de Detalhes da Carona */}
            <Modal
                visible={showRideModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRideModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedRide && (
                            <>
                                {/* Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>🚗 Detalhes da Carona</Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setShowRideModal(false)}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Motorista */}
                                <View style={styles.driverSection}>
                                    <View style={styles.driverAvatar}>
                                        <Text style={styles.driverAvatarText}>
                                            {selectedRide.driver?.name?.charAt(0) || '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.driverInfo}>
                                        <Text style={styles.driverName}>
                                            {selectedRide.driver?.name || 'Motorista'}
                                        </Text>
                                        <Text style={styles.driverRating}>
                                            ⭐ {Number(selectedRide.driver?.rating) ? Number(selectedRide.driver.rating).toFixed(1) : '5.0'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Veículo */}
                                {selectedRide.driver?.vehicle && (
                                    <View style={styles.vehicleSection}>
                                        <Text style={styles.vehicleText}>
                                            🚙 {selectedRide.driver.vehicle.model} • {selectedRide.driver.vehicle.color}
                                        </Text>
                                        <Text style={styles.vehiclePlate}>
                                            {selectedRide.driver.vehicle.plate}
                                        </Text>
                                    </View>
                                )}

                                {/* Rota */}
                                <View style={styles.routeSection}>
                                    <View style={styles.routeItem}>
                                        <Text style={styles.routeIcon}>📍</Text>
                                        <View style={styles.routeTextContainer}>
                                            <Text style={styles.routeLabel}>Origem</Text>
                                            <Text style={styles.routeAddress} numberOfLines={2}>
                                                {selectedRide.origin?.address || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.routeDivider} />
                                    <View style={styles.routeItem}>
                                        <Text style={styles.routeIcon}>🎯</Text>
                                        <View style={styles.routeTextContainer}>
                                            <Text style={styles.routeLabel}>Destino</Text>
                                            <Text style={styles.routeAddress} numberOfLines={2}>
                                                {selectedRide.destination?.address || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Informações */}
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoIcon}>📅</Text>
                                        <Text style={styles.infoValue}>
                                            {formatDate(selectedRide.departureTime)}
                                        </Text>
                                        <Text style={styles.infoLabel}>Data</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoIcon}>⏰</Text>
                                        <Text style={styles.infoValue}>
                                            {formatTime(selectedRide.departureTime)}
                                        </Text>
                                        <Text style={styles.infoLabel}>Horário</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoIcon}>👥</Text>
                                        <Text style={[
                                            styles.infoValue,
                                            selectedRide.availableSeats === 0 && styles.noSeats
                                        ]}>
                                            {selectedRide.availableSeats}
                                        </Text>
                                        <Text style={styles.infoLabel}>Vagas</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoIcon}>💰</Text>
                                        <Text style={styles.infoValue}>
                                            {selectedRide.pricePerSeat > 0
                                                ? `R$ ${selectedRide.pricePerSeat.toFixed(2)}`
                                                : 'Grátis'}
                                        </Text>
                                        <Text style={styles.infoLabel}>Por vaga</Text>
                                    </View>
                                </View>

                                {/* Botão de Solicitar */}
                                <TouchableOpacity
                                    style={[
                                        styles.requestButton,
                                        (selectedRide.availableSeats === 0 || requesting) && styles.requestButtonDisabled
                                    ]}
                                    onPress={handleRequestRide}
                                    disabled={selectedRide.availableSeats === 0 || requesting}
                                    activeOpacity={0.8}
                                >
                                    {requesting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.requestButtonText}>
                                            {selectedRide.availableSeats === 0
                                                ? '😔 Sem vagas disponíveis'
                                                : '✋ Solicitar Vaga'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    searchCard: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        maxHeight: '50%',
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 10,
    },
    showSearchButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    showSearchButtonText: {
        color: '#666',
        fontSize: 16,
    },
    selectedDestination: {
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    selectedLabel: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    selectedText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
    },
    clearButton: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.primary,
        alignSelf: 'flex-start',
    },
    clearButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    ridesCounter: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    counterText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#666',
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverAvatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    driverInfo: {
        marginLeft: 15,
    },
    driverName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    driverRating: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    vehicleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        marginBottom: 15,
    },
    vehicleText: {
        fontSize: 14,
        color: '#333',
    },
    vehiclePlate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    routeSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 15,
        marginBottom: 15,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    routeTextContainer: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    routeAddress: {
        fontSize: 14,
        color: '#333',
    },
    routeDivider: {
        width: 2,
        height: 20,
        backgroundColor: '#e0e0e0',
        marginLeft: 8,
        marginVertical: 8,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        marginHorizontal: 4,
    },
    infoIcon: {
        fontSize: 20,
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    infoLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    noSeats: {
        color: '#e53935',
    },
    requestButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    requestButtonDisabled: {
        backgroundColor: '#ccc',
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PassengerHomeScreen;
