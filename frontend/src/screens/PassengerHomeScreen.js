import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Container, MainTitle, Text, Card, TextInput, PrimaryButton, ButtonText, colors } from '../components/StyledComponents';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useState, useEffect } from 'react';
import { getNearbyDrivers } from '../services/rideService';


const PassengerHomeScreen = () => {
    // Estados para gerenciar localização e motoristas
    const [userLocation, setUserLocation] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [region, setRegion] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Função para obter localização do usuário
    const getUserLocation = async () => {
        try {
            // Solicitar permissão de localização
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permissão de localização negada');
                return;
            }

            // Obter localização atual
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            setUserLocation({ latitude, longitude });
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01, // Zoom do mapa
                longitudeDelta: 0.01,
            });

            // Buscar motoristas próximos
            await fetchNearbyDrivers(latitude, longitude);
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            setErrorMsg('Erro ao obter localização');
        }
    };

    // Função para buscar motoristas próximos
    const fetchNearbyDrivers = async (latitude, longitude) => {
        try {
            // Tentar buscar do backend
            const response = await getNearbyDrivers(latitude, longitude);

            // Mapear dados do backend para o formato esperado
            const driversData = response.drivers.map(driver => ({
                id: driver.id,
                name: driver.name,
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
                rating: driver.rating,
                vehicle: driver.vehicle,
                distance: driver.distance,
            }));

            setDrivers(driversData);
        } catch (error) {
            console.error('Erro ao buscar motoristas:', error);

            // Fallback para dados mockados se backend não estiver disponível
            const mockDrivers = [
                {
                    id: 1,
                    name: 'João Silva',
                    latitude: latitude + 0.002,
                    longitude: longitude + 0.002,
                    rating: 4.8,
                },
                {
                    id: 2,
                    name: 'Maria Santos',
                    latitude: latitude - 0.003,
                    longitude: longitude + 0.001,
                    rating: 4.9,
                },
                {
                    id: 3,
                    name: 'Pedro Costa',
                    latitude: latitude + 0.001,
                    longitude: longitude - 0.002,
                    rating: 4.7,
                },
            ];
            setDrivers(mockDrivers);
        }
    };

    // useEffect para obter localização ao carregar o componente
    useEffect(() => {
        getUserLocation();

        // Atualizar localização a cada 10 segundos
        const interval = setInterval(() => {
            getUserLocation();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Container>
            {/* Mapa OpenStreetMap */}
            {region ? (
                <MapView
                    style={styles.map}
                    region={region}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    onRegionChangeComplete={setRegion}
                >
                    {/* Marcador da localização do usuário */}
                    {userLocation && (
                        <Marker
                            coordinate={userLocation}
                            title="Você está aqui"
                            pinColor="blue"
                        />
                    )}

                    {/* Marcadores dos motoristas próximos */}
                    {drivers.map((driver) => (
                        <Marker
                            key={driver.id}
                            coordinate={{
                                latitude: driver.latitude,
                                longitude: driver.longitude,
                            }}
                            title={driver.name}
                            description={`Avaliação: ${driver.rating} ⭐`}
                            pinColor="green"
                        />
                    ))}
                </MapView>
            ) : (
                <View style={styles.mapPlaceholder}>
                    <Text align="center" color="#888">
                        {errorMsg || 'Carregando mapa...'}
                    </Text>
                </View>
            )}

            {/* Card flutuante para busca */}
            <Card style={styles.floatingCard}>
                <MainTitle style={{ fontSize: 20, marginBottom: 10 }}>
                    Para onde vamos?
                </MainTitle>

                <TextInput
                    placeholder="Digite o destino..."
                    placeholderTextColor="#999"
                />

                <PrimaryButton style={{ marginTop: 10 }}>
                    <ButtonText>Buscar Motorista</ButtonText>
                </PrimaryButton>
            </Card>
        </Container>
    );
};

const styles = StyleSheet.create({
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});

export default PassengerHomeScreen;
