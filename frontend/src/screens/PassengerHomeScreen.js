import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal, ActivityIndicator, ScrollView, Platform } from 'react-native';
// Importação condicional do mapa (só funciona em mobile)
const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;
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

    // Estados para dados da solicitação
    const [numberOfPassengers, setNumberOfPassengers] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState(null);

    useEffect(() => {
        getUserLocation();
        loadUserSession();
    }, []);

    const loadUserSession = async () => {
        try {
            // getUserSession retorna o userId diretamente como número, não um objeto
            const userId = await getUserSession();
            console.log('Session userId:', userId);

            if (userId) {
                setUserId(userId);

                try {
                    console.log('🔍 Chamando API para buscar passageiro com userId:', userId);
                    const response = await getPassengerByUserId(userId);
                    console.log('✅ Passenger response:', JSON.stringify(response, null, 2));

                    // A API retorna { success: true, passenger: {...} }
                    const passenger = response.passenger || response;

                    if (passenger && passenger.id) {
                        console.log('✅ Passenger ID encontrado:', passenger.id);
                        setPassengerId(passenger.id);
                    } else {
                        console.log('❌ Passageiro não encontrado ou sem ID');
                    }
                } catch (passengerError) {
                    console.log('❌ Erro ao buscar passageiro:', {
                        message: passengerError.message,
                        status: passengerError.response?.status,
                        statusText: passengerError.response?.statusText,
                        data: passengerError.response?.data
                    });
                }
            }
        } catch (error) {
            console.log('❌ Erro ao carregar sessão:', error.message);
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
            const userCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(userCoords);
            setRegion({
                ...userCoords,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });

            await fetchAvailableRides(userCoords.latitude, userCoords.longitude);
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            setErrorMsg('Erro ao obter localização');
        }
    };

    const fetchAvailableRides = async (lat, lng, searchText = null) => {
        try {
            // getAvailableRides(lat, lng, radius, searchText)
            // Quando há searchText, passar radius amplo para não limitar por distância
            const radius = searchText ? 1000 : 50; // 1000km quando busca textual, 50km sem busca
            const response = await getAvailableRides(lat, lng, radius, searchText);
            const ridesArray = response.rides || [];
            setRides(ridesArray);

            if (ridesArray.length > 0) {
                Alert.alert('Caronas encontradas', `${ridesArray.length} carona(s) disponível(is) para o seu destino.`);

                // Centralizar mapa nos marcadores encontrados
                const lats = ridesArray.map(r => r.origin.latitude);
                const lngs = ridesArray.map(r => r.origin.longitude);

                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);

                // Calcular centro e delta para mostrar todos os marcadores
                const centerLat = (minLat + maxLat) / 2;
                const centerLng = (minLng + maxLng) / 2;
                const latDelta = Math.max((maxLat - minLat) * 1.5, 0.05);
                const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.05);

                setRegion({
                    latitude: centerLat,
                    longitude: centerLng,
                    latitudeDelta: latDelta,
                    longitudeDelta: lngDelta,
                });
            } else if (searchText) {
                Alert.alert('Nenhuma carona', `Não encontramos caronas para "${searchText}".`);
            }
        } catch (error) {
            console.error('Erro ao buscar caronas:', error);
            setRides([]);
        }
    };

    const handleDestinationSelect = async (address) => {
        setSearchDestination(address);
        if (userLocation) {
            await fetchAvailableRides(
                userLocation.latitude,
                userLocation.longitude,
                address.displayName
            );
        }
    };

    const clearSearch = async () => {
        setSearchDestination(null);
        if (userLocation) {
            await fetchAvailableRides(userLocation.latitude, userLocation.longitude);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleMarkerPress = (ride) => {
        console.log('Ride selecionada:', JSON.stringify(ride, null, 2));
        setSelectedRide(ride);
        setShowRideModal(true);
        // Resetar campos ao abrir modal
        setNumberOfPassengers(1);
        setPaymentMethod(null);
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

        // Validar quantidade de passageiros
        if (numberOfPassengers < 1 || numberOfPassengers > selectedRide.availableSeats) {
            Alert.alert(
                'Quantidade Inválida',
                `Por favor, selecione entre 1 e ${selectedRide.availableSeats} passageiro(s).`
            );
            return;
        }

        // Validar forma de pagamento
        if (!paymentMethod) {
            Alert.alert(
                'Forma de Pagamento',
                'Por favor, selecione uma forma de pagamento.'
            );
            return;
        }

        setRequesting(true);
        try {
            const response = await requestRide(
                selectedRide.id,
                passengerId,
                numberOfPassengers,
                paymentMethod
            );

            Alert.alert(
                '✅ Solicitação Enviada!',
                response.message || 'Aguarde a confirmação do motorista.',
                [{
                    text: 'OK',
                    onPress: () => {
                        setShowRideModal(false);
                        // Resetar campos
                        setNumberOfPassengers(1);
                        setPaymentMethod(null);
                    }
                }]
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

    return (
        <View style={styles.container}>
            {/* Verificar se está na web */}
            {Platform.OS === 'web' ? (
                <View style={styles.webNotice}>
                    <Text style={styles.webNoticeTitle}>🚗 UmBora Mobile</Text>
                    <Text style={styles.webNoticeText}>
                        Para a melhor experiência com mapas e localização, use nosso app no celular!
                    </Text>
                    <Text style={styles.webNoticeSubtext}>
                        Baixe pelo Expo Go ou execute com:
                    </Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>npx expo start</Text>
                    </View>
                    <Text style={styles.webNoticeHint}>
                        💡 Escaneie o QR code que aparece no terminal com o app Expo Go
                    </Text>
                </View>
            ) : (
                <>
                    {/* Mapa para Mobile */}
                    {region && MapView && (
                        <MapView
                            style={styles.map}
                            region={region}
                            provider="google"
                            customMapStyle={[]}
                        >
                            {/* Marcador do usuário */}
                            {userLocation && Marker && (
                                <Marker
                                    coordinate={userLocation}
                                    title="Você está aqui"
                                    pinColor="blue"
                                />
                            )}

                            {/* Marcadores das caronas */}
                            {rides && rides.length > 0 && Marker && rides.map((ride) => (
                                <Marker
                                    key={ride.id}
                                    coordinate={{
                                        latitude: ride.origin.latitude,
                                        longitude: ride.origin.longitude,
                                    }}
                                    title={`Carona para ${ride.destination.address}`}
                                    description={`${ride.availableSeats} vaga(s) • R$ ${ride.pricePerSeat}`}
                                    pinColor="green"
                                    onPress={() => handleMarkerPress(ride)}
                                />
                            ))}
                        </MapView>
                    )}
                </>
            )}

            {/* Card de Busca */}
            <View style={styles.searchCard}>
                <View style={styles.headerRow}>
                    <Text style={styles.searchTitle}>🔍 Buscar Carona</Text>
                    <TouchableOpacity
                        style={styles.myRequestsButton}
                        onPress={() => navigation.navigate('PassengerRequests', { userId })}
                    >
                        <Text style={styles.myRequestsButtonText}>📋 Minhas Solicitações</Text>
                    </TouchableOpacity>
                </View>

                {!showSearch ? (
                    <TouchableOpacity
                        style={styles.showSearchButton}
                        onPress={() => setShowSearch(true)}
                    >
                        <Text style={styles.showSearchButtonText}>
                            Clique para buscar por destino
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
                        {rides?.length || 0} carona(s) disponível(is)
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
                        {selectedRide ? (
                            <ScrollView
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
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

                                {/* Informações de Solicitações Pendentes */}
                                {(selectedRide.pendingSeats > 0 || selectedRide.confirmedSeats > 0) && (
                                    <View style={styles.reservationInfo}>
                                        <Text style={styles.reservationTitle}>📊 Status das Vagas</Text>
                                        <View style={styles.reservationDetails}>
                                            <Text style={styles.reservationText}>
                                                ✅ Confirmadas: {selectedRide.confirmedSeats || 0}
                                            </Text>
                                            <Text style={styles.reservationText}>
                                                ⏳ Pendentes: {selectedRide.pendingSeats || 0}
                                            </Text>
                                            <Text style={styles.reservationText}>
                                                🎯 Total: {selectedRide.totalSeats}
                                            </Text>
                                        </View>
                                        {!selectedRide.canRequestMore && (
                                            <View style={styles.noSlotsWarning}>
                                                <Text style={styles.noSlotsText}>
                                                    ⚠️ Todas as vagas já estão ocupadas ou com solicitações pendentes
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Seção de Dados da Solicitação */}
                                {selectedRide.availableSeats > 0 && (
                                    <View style={styles.requestDataSection}>
                                        <Text style={styles.sectionTitle}>📋 Dados da Solicitação</Text>

                                        {/* Quantidade de Passageiros */}
                                        <View style={styles.passengerCountContainer}>
                                            <Text style={styles.fieldLabel}>Quantas pessoas?</Text>
                                            <View style={styles.counterControls}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.counterButton,
                                                        numberOfPassengers <= 1 && styles.counterButtonDisabled
                                                    ]}
                                                    onPress={() => setNumberOfPassengers(Math.max(1, numberOfPassengers - 1))}
                                                    disabled={numberOfPassengers <= 1}
                                                >
                                                    <Text style={styles.counterButtonText}>−</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.counterValue}>{numberOfPassengers}</Text>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.counterButton,
                                                        numberOfPassengers >= selectedRide.availableSeats && styles.counterButtonDisabled
                                                    ]}
                                                    onPress={() => setNumberOfPassengers(Math.min(selectedRide.availableSeats, numberOfPassengers + 1))}
                                                    disabled={numberOfPassengers >= selectedRide.availableSeats}
                                                >
                                                    <Text style={styles.counterButtonText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Forma de Pagamento */}
                                        <View style={styles.paymentMethodContainer}>
                                            <Text style={styles.fieldLabel}>Forma de Pagamento</Text>
                                            <View style={styles.paymentOptions}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.paymentOption,
                                                        paymentMethod === 'cash' && styles.paymentOptionSelected
                                                    ]}
                                                    onPress={() => setPaymentMethod('cash')}
                                                >
                                                    <Text style={styles.paymentIcon}>💵</Text>
                                                    <Text style={[
                                                        styles.paymentText,
                                                        paymentMethod === 'cash' && styles.paymentTextSelected
                                                    ]}>Dinheiro</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.paymentOption,
                                                        paymentMethod === 'pix' && styles.paymentOptionSelected
                                                    ]}
                                                    onPress={() => setPaymentMethod('pix')}
                                                >
                                                    <Text style={styles.paymentIcon}>📱</Text>
                                                    <Text style={[
                                                        styles.paymentText,
                                                        paymentMethod === 'pix' && styles.paymentTextSelected
                                                    ]}>PIX</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.paymentOption,
                                                        paymentMethod === 'card' && styles.paymentOptionSelected
                                                    ]}
                                                    onPress={() => setPaymentMethod('card')}
                                                >
                                                    <Text style={styles.paymentIcon}>💳</Text>
                                                    <Text style={[
                                                        styles.paymentText,
                                                        paymentMethod === 'card' && styles.paymentTextSelected
                                                    ]}>Cartão</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Botão de Solicitar */}
                                <TouchableOpacity
                                    style={[
                                        styles.requestButton,
                                        (selectedRide.canRequestMore === false || requesting) && styles.requestButtonDisabled
                                    ]}
                                    onPress={handleRequestRide}
                                    disabled={selectedRide.canRequestMore === false || requesting}
                                    activeOpacity={0.8}
                                >
                                    {requesting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.requestButtonText}>
                                            {selectedRide.canRequestMore === false
                                                ? '😔 Vagas esgotadas'
                                                : '✋ Solicitar Vaga'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <View style={{ padding: 20 }}>
                                <Text style={{ fontSize: 18, color: '#333' }}>
                                    Carregando informações da carona...
                                </Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>
                                    selectedRide: {selectedRide ? 'existe' : 'null/undefined'}
                                </Text>
                            </View>
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
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    myRequestsButton: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    myRequestsButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
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
    // Estilos para Web
    webNotice: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    webNoticeTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    webNoticeText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 26,
    },
    webNoticeSubtext: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 15,
    },
    codeBlock: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    codeText: {
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 16,
    },
    webNoticeHint: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        marginTop: 10,
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
        minHeight: 400,
    },
    modalScrollView: {
        maxHeight: '100%',
    },
    modalScrollContent: {
        paddingBottom: 20,
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
    // Estilos para informações de reserva (modelo híbrido)
    reservationInfo: {
        backgroundColor: '#fff3e0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    reservationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 8,
    },
    reservationDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    reservationText: {
        fontSize: 12,
        color: '#333',
    },
    noSlotsWarning: {
        backgroundColor: '#ffebee',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
    },
    noSlotsText: {
        fontSize: 12,
        color: '#c62828',
        textAlign: 'center',
        fontWeight: '500',
    },
    // Estilos para dados da solicitação
    requestDataSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    passengerCountContainer: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
    },
    counterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterButtonDisabled: {
        backgroundColor: '#ccc',
    },
    counterButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    counterValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 40,
        textAlign: 'center',
    },
    paymentMethodContainer: {
        marginBottom: 5,
    },
    paymentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    paymentOption: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    paymentOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: '#e8f5e9',
    },
    paymentIcon: {
        fontSize: 24,
        marginBottom: 5,
    },
    paymentText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    paymentTextSelected: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});

export default PassengerHomeScreen;
