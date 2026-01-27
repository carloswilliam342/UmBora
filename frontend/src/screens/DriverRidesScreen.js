import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { getDriverRides, cancelRide, updateRideStatus } from '../services/rideService';
import { getDriverProfile } from '../services/driverService';

const DriverRidesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params || {};

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [driverId, setDriverId] = useState(null);

    useEffect(() => {
        checkDriverAndLoadRides();
    }, []);

    const checkDriverAndLoadRides = async () => {
        try {
            setLoading(true);

            // Verificar se é motorista
            const profile = await getDriverProfile(userId);

            if (!profile || !profile.isDriver) {
                Alert.alert(
                    'Acesso Negado',
                    'Apenas motoristas podem acessar esta tela.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return;
            }

            setDriverId(profile.driver.id);
            await loadRides(profile.driver.id);
        } catch (error) {
            console.error('Erro ao verificar motorista:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const loadRides = async (dId) => {
        try {
            const response = await getDriverRides(dId || driverId);
            setRides(response.rides || []);
        } catch (error) {
            console.error('Erro ao carregar caronas:', error);
            Alert.alert('Erro', 'Não foi possível carregar suas caronas.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRides();
        setRefreshing(false);
    };

    const handleCancelRide = (rideId) => {
        Alert.alert(
            'Cancelar Carona',
            'Tem certeza que deseja cancelar esta carona?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Usando updateRideStatus com 'cancelled' para consistência
                            await updateRideStatus(rideId, 'cancelled');
                            Alert.alert('Sucesso', 'Carona cancelada com sucesso!');
                            await loadRides();
                        } catch (error) {
                            console.error('Erro ao cancelar carona:', error);
                            Alert.alert('Erro', 'Não foi possível cancelar a carona.');
                        }
                    },
                },
            ]
        );
    };

    const handleUpdateStatus = (rideId, newStatus, actionName) => {
        Alert.alert(
            actionName,
            `Deseja marcar esta carona como "${newStatus === 'in_progress' ? 'Em Andamento' : 'Concluída'}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await updateRideStatus(rideId, newStatus);
                            Alert.alert('Sucesso', `Carona marcada como ${newStatus === 'in_progress' ? 'iniciada' : 'concluída'}!`);
                            await loadRides();
                        } catch (error) {
                            console.error(`Erro ao atualizar para ${newStatus}:`, error);
                            Alert.alert('Erro', `Não foi possível atualizar o status da carona.`);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return '#4CAF50';
            case 'in_progress':
                return '#FF9800';
            case 'completed':
                return '#2196F3';
            case 'cancelled':
                return '#F44336';
            default:
                return '#999';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'available':
                return 'Disponível';
            case 'in_progress':
                return 'Em Andamento';
            case 'completed':
                return 'Concluída';
            case 'cancelled':
                return 'Cancelada';
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderRideItem = ({ item }) => (
        <View style={styles.rideCard}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>

            {/* Origem e Destino */}
            <View style={styles.routeContainer}>
                <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>Origem</Text>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {item.origin.address}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>🎯</Text>
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>Destino</Text>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {item.destination.address}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Informações */}
            <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📅 Data:</Text>
                    <Text style={styles.infoValue}>{formatDate(item.departureTime)}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🕐 Horário:</Text>
                    <Text style={styles.infoValue}>{formatTime(item.departureTime)}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>👥 Vagas:</Text>
                    <Text style={styles.infoValue}>{item.availableSeats}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>💰 Preço:</Text>
                    <Text style={styles.infoValue}>
                        {item.pricePerSeat > 0 ? `R$ ${item.pricePerSeat.toFixed(2)}` : 'Gratuito'}
                    </Text>
                </View>
            </View>

            {/* Botões de Ação */}
            <View style={styles.actionsContainer}>
                {item.status === 'available' && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.startButton]}
                            onPress={() => handleUpdateStatus(item.id, 'in_progress', 'Iniciar Carona')}
                        >
                            <Text style={styles.startButtonText}>▶ Iniciar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleCancelRide(item.id)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </>
                )}

                {item.status === 'in_progress' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={() => handleUpdateStatus(item.id, 'completed', 'Finalizar Carona')}
                    >
                        <Text style={styles.completeButtonText}>🏁 Finalizar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando caronas...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Caronas</Text>
                <Text style={styles.headerSubtitle}>
                    {rides.length} carona{rides.length !== 1 ? 's' : ''} cadastrada{rides.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {rides.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🚗</Text>
                    <Text style={styles.emptyText}>Você ainda não cadastrou nenhuma carona</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('RideCreate', { driverId })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.createButtonText}>+ Cadastrar Primeira Carona</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderRideItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
        opacity: 0.9,
    },
    listContainer: {
        padding: 15,
    },
    rideCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    routeContainer: {
        marginBottom: 15,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    locationIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    locationText: {
        fontSize: 14,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 10,
    },
    infoContainer: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    cancelButtonText: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: 'bold',
    },
    startButton: {
        backgroundColor: '#4CAF50',
        marginRight: 10,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    completeButton: {
        backgroundColor: '#2196F3',
        width: '100%',
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 30,
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DriverRidesScreen;
