import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../components/StyledComponents';
import { getAvailableRides } from '../services/rideService';
import AddressAutocomplete from '../components/AddressAutocomplete';

const PassengerHomeScreen = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [rides, setRides] = useState([]);
    const [region, setRegion] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchDestination, setSearchDestination] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        getUserLocation();
    }, []);

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

        // Filtrar caronas que vão para perto do destino selecionado
        if (userLocation) {
            try {
                const response = await getAvailableRides(
                    destination.latitude,
                    destination.longitude,
                    10 // Raio de 10km do destino
                );

                if (response.rides && response.rides.length > 0) {
                    setRides(response.rides);

                    // Centralizar mapa no destino
                    setRegion({
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    });

                    Alert.alert(
                        'Caronas Encontradas',
                        `Encontramos ${response.rides.length} carona(s) disponível(is) para este destino!`
                    );
                } else {
                    Alert.alert(
                        'Nenhuma Carona Encontrada',
                        'Não há caronas disponíveis para este destino no momento.'
                    );
                    setRides([]);
                }
            } catch (error) {
                console.error('Erro ao buscar caronas por destino:', error);
                Alert.alert('Erro', 'Não foi possível buscar caronas para este destino.');
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
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
                            pinColor="green"
                        >
                            <Callout>
                                <View style={styles.calloutContainer}>
                                    <Text style={styles.calloutTitle}>🚗 Carona Disponível</Text>
                                    <Text style={styles.calloutDriver}>Motorista: {ride.driver.name}</Text>
                                    <Text style={styles.calloutText}>
                                        📍 De: {ride.origin.address.split(',')[0]}
                                    </Text>
                                    <Text style={styles.calloutText}>
                                        🎯 Para: {ride.destination.address.split(',')[0]}
                                    </Text>
                                    <Text style={styles.calloutText}>
                                        📅 {formatDate(ride.departureTime)} às {formatTime(ride.departureTime)}
                                    </Text>
                                    <Text style={styles.calloutText}>
                                        👥 {ride.availableSeats} vaga(s)
                                    </Text>
                                    <Text style={styles.calloutText}>
                                        💰 {ride.pricePerSeat > 0 ? `R$ ${ride.pricePerSeat.toFixed(2)}` : 'Gratuito'}
                                    </Text>
                                    {ride.distance && (
                                        <Text style={styles.calloutDistance}>
                                            📏 {ride.distance} km de você
                                        </Text>
                                    )}
                                </View>
                            </Callout>
                        </Marker>
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
                            placeholder="Digite seu destino (ex: Av. Paulista, São Paulo)"
                            onSelectAddress={handleDestinationSelect}
                        />

                        {searchDestination && (
                            <View style={styles.selectedDestination}>
                                <Text style={styles.selectedLabel}>Destino selecionado:</Text>
                                <Text style={styles.selectedText} numberOfLines={2}>
                                    {searchDestination.displayName}
                                </Text>
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={clearSearch}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.clearButtonText}>Limpar Busca</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                {/* Contador de caronas */}
                <View style={styles.ridesCounter}>
                    <Text style={styles.counterText}>
                        {rides.length} carona(s) disponível(is)
                    </Text>
                </View>
            </View>
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
    calloutContainer: {
        width: 250,
        padding: 10,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    calloutDriver: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 3,
    },
    calloutDistance: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 5,
    },
});

export default PassengerHomeScreen;
