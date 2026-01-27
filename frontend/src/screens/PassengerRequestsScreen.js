import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { getPassengerRequests, cancelRideRequest } from '../services/rideService';
import { getPassengerByUserId } from '../services/rideService';
import { getUserSession } from '../services/authService';

const PassengerRequestsScreen = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [passengerId, setPassengerId] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);

    useEffect(() => {
        loadPassengerId();
    }, []);

    // Polling a cada 30 segundos
    useEffect(() => {
        if (!passengerId) return;

        const interval = setInterval(() => {
            loadRequests(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [passengerId]);

    // Recarregar quando a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            if (passengerId) {
                loadRequests(false);
            }
        }, [passengerId])
    );

    const loadPassengerId = async () => {
        try {
            const userId = await getUserSession();
            if (userId) {
                const response = await getPassengerByUserId(userId);
                const passenger = response.passenger || response;
                if (passenger && passenger.id) {
                    setPassengerId(passenger.id);
                    await loadRequests(true);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar passageiro:', error);
            setLoading(false);
        }
    };

    const loadRequests = async (showLoading = true) => {
        if (!passengerId) return;

        if (showLoading) setLoading(true);
        try {
            const response = await getPassengerRequests(passengerId);
            setRequests(response.requests || []);
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
            Alert.alert('Erro', 'Não foi possível carregar suas solicitações');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests(false);
    };

    const handleCancelRequest = (request) => {
        Alert.alert(
            'Cancelar Solicitação',
            `Deseja cancelar a solicitação para ${request.ride.destination.address}?`,
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingRequest(request.id);
                            await cancelRideRequest(request.rideId, passengerId);
                            Alert.alert('Sucesso', 'Solicitação cancelada');
                            await loadRequests(false);
                        } catch (error) {
                            console.error('Erro ao cancelar:', error);
                            Alert.alert('Erro', error.response?.data?.message || 'Não foi possível cancelar');
                        } finally {
                            setProcessingRequest(null);
                        }
                    }
                }
            ]
        );
    };

    const handleCallDriver = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FFA500';
            case 'confirmed': return '#4CAF50';
            case 'rejected': return '#F44336';
            case 'cancelled': return '#9E9E9E';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'PENDENTE';
            case 'confirmed': return 'CONFIRMADA';
            case 'rejected': return 'REJEITADA';
            case 'cancelled': return 'CANCELADA';
            default: return status?.toUpperCase();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'rejected': return '❌';
            case 'cancelled': return '🚫';
            default: return '•';
        }
    };

    const renderRequest = ({ item }) => {
        const statusColor = getStatusColor(item.status);
        const isProcessing = processingRequest === item.id;

        return (
            <View style={styles.requestCard}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>
                        {getStatusIcon(item.status)} {getStatusText(item.status)}
                    </Text>
                </View>

                {/* Rota */}
                <View style={styles.routeSection}>
                    <View style={styles.routeItem}>
                        <Text style={styles.routeIcon}>📍</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                            {item.ride.origin.address}
                        </Text>
                    </View>
                    <View style={styles.routeDivider} />
                    <View style={styles.routeItem}>
                        <Text style={styles.routeIcon}>🎯</Text>
                        <Text style={styles.routeText} numberOfLines={1}>
                            {item.ride.destination.address}
                        </Text>
                    </View>
                </View>

                {/* Detalhes */}
                <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📅 Data:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.ride.departureTime)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🕐 Horário:</Text>
                        <Text style={styles.detailValue}>{formatTime(item.ride.departureTime)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>👥 Passageiros:</Text>
                        <Text style={styles.detailValue}>{item.numberOfPassengers}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>💳 Pagamento:</Text>
                        <Text style={styles.detailValue}>{item.paymentMethod?.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Motorista (se confirmada) */}
                {item.status === 'confirmed' && (
                    <View style={styles.driverSection}>
                        <Text style={styles.driverLabel}>🚗 Motorista:</Text>
                        <Text style={styles.driverName}>{item.driver.name}</Text>
                        <TouchableOpacity
                            style={styles.callButton}
                            onPress={() => handleCallDriver(item.driver.phone)}
                        >
                            <Text style={styles.callButtonText}>📞 Ligar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Botão Cancelar (só para pendentes) */}
                {item.status === 'pending' && (
                    <TouchableOpacity
                        style={[styles.cancelButton, isProcessing && styles.cancelButtonDisabled]}
                        onPress={() => handleCancelRequest(item)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancelar Solicitação</Text>
                        )}
                    </TouchableOpacity>
                )}

                {/* Data da solicitação */}
                <Text style={styles.requestedAt}>
                    Solicitado em {formatDate(item.requestedAt)} às {formatTime(item.requestedAt)}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando solicitações...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📋 Minhas Solicitações</Text>
                <Text style={styles.headerSubtitle}>{requests.length} solicitação(ões)</Text>
            </View>

            <FlatList
                data={requests}
                renderItem={renderRequest}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Nenhuma solicitação ainda</Text>
                        <Text style={styles.emptySubtext}>
                            Busque caronas e solicite vagas para vê-las aqui
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 20,
        paddingTop: 50,
        paddingBottom: 25,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    listContent: {
        padding: 15,
    },
    requestCard: {
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
    routeSection: {
        marginBottom: 15,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    routeText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    routeDivider: {
        width: 2,
        height: 15,
        backgroundColor: '#ddd',
        marginLeft: 8,
        marginVertical: 5,
    },
    detailsSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    driverSection: {
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    driverLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    callButton: {
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    callButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#F44336',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelButtonDisabled: {
        backgroundColor: '#ccc',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    requestedAt: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default PassengerRequestsScreen;
