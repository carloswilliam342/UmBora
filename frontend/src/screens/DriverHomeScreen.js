import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors } from '../components/StyledComponents';
import { getDriverPendingRequests, acceptRideRequest, rejectRideRequest } from '../services/rideService';
import { getDriverProfile } from '../services/driverService';

const DriverHomeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params || {};

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [driverId, setDriverId] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);

    // Polling para atualizar automaticamente
    useEffect(() => {
        if (!driverId) return;

        const interval = setInterval(() => {
            loadPendingRequests(driverId, false);
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [driverId]);

    // Recarregar quando a tela ficar em foco
    useFocusEffect(
        useCallback(() => {
            if (driverId) {
                loadPendingRequests(driverId, false);
            }
        }, [driverId])
    );

    useEffect(() => {
        checkDriverAndLoadRequests();
    }, []);

    const checkDriverAndLoadRequests = async () => {
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
            await loadPendingRequests(profile.driver.id);
        } catch (error) {
            console.error('Erro ao verificar motorista:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async (dId, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await getDriverPendingRequests(dId || driverId);
            setRequests(response.requests || []);
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
            if (showLoading) {
                Alert.alert('Erro', 'Não foi possível carregar as solicitações.');
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingRequests(driverId, false);
        setRefreshing(false);
    };

    const handleAcceptRequest = (request) => {
        Alert.alert(
            'Aceitar Solicitação',
            `Aceitar ${request.numberOfPassengers} passageiro(s) de ${request.passengerName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aceitar',
                    onPress: async () => {
                        try {
                            setProcessingRequest(request.id);
                            await acceptRideRequest(request.rideId, request.passengerId);
                            Alert.alert('Sucesso', 'Solicitação aceita com sucesso!');
                            await loadPendingRequests(driverId, false);
                        } catch (error) {
                            console.error('Erro ao aceitar solicitação:', error);
                            Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
                        } finally {
                            setProcessingRequest(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRejectRequest = (request) => {
        Alert.alert(
            'Recusar Solicitação',
            `Recusar solicitação de ${request.passengerName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Recusar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingRequest(request.id);
                            await rejectRideRequest(request.rideId, request.passengerId);
                            Alert.alert('Concluído', 'Solicitação recusada.');
                            await loadPendingRequests(driverId, false);
                        } catch (error) {
                            console.error('Erro ao recusar solicitação:', error);
                            Alert.alert('Erro', 'Não foi possível recusar a solicitação.');
                        } finally {
                            setProcessingRequest(null);
                        }
                    },
                },
            ]
        );
    };

    const handleCallPassenger = (phone) => {
        if (!phone) {
            Alert.alert('Erro', 'Telefone não disponível.');
            return;
        }
        const phoneNumber = phone.replace(/\D/g, '');
        Linking.openURL(`tel:${phoneNumber}`);
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

    const getPaymentMethodLabel = (method) => {
        const methods = {
            cash: 'Dinheiro',
            pix: 'PIX',
            card: 'Cartão',
        };
        return methods[method] || method;
    };

    const renderRequestItem = ({ item }) => {
        const isProcessing = processingRequest === item.id;

        return (
            <View style={styles.requestCard}>
                {/* Badge de nova solicitação */}
                <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NOVA SOLICITAÇÃO</Text>
                </View>

                {/* Informações do passageiro */}
                <View style={styles.passengerInfo}>
                    <Text style={styles.passengerIcon}>👤</Text>
                    <View style={styles.passengerDetails}>
                        <Text style={styles.passengerName}>{item.passengerName}</Text>
                        <TouchableOpacity onPress={() => handleCallPassenger(item.passengerPhone)}>
                            <Text style={styles.passengerPhone}>📞 {item.passengerPhone}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Informações da carona */}
                <View style={styles.rideInfo}>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationLabel}>Origem</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {item.ride.origin.address}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.locationRow}>
                        <Text style={styles.locationIcon}>🎯</Text>
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationLabel}>Destino</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {item.ride.destination.address}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Detalhes da solicitação */}
                <View style={styles.detailsContainer}>
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
                        <Text style={styles.detailValue}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
                    </View>
                </View>

                {/* Botões de ação */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(item)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#F44336" />
                        ) : (
                            <Text style={styles.rejectButtonText}>Recusar</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(item)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.acceptButtonText}>Aceitar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando notificações...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Solicitações Pendentes</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{requests.length}</Text>
                </View>
            </View>

            {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyText}>Nenhuma solicitação pendente</Text>
                    <Text style={styles.emptySubtext}>
                        Você será notificado quando passageiros solicitarem suas caronas
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestItem}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        backgroundColor: '#FF5722',
        borderRadius: 20,
        minWidth: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContainer: {
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
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    newBadge: {
        backgroundColor: '#FF5722',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    passengerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    passengerIcon: {
        fontSize: 40,
        marginRight: 15,
    },
    passengerDetails: {
        flex: 1,
    },
    passengerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    passengerPhone: {
        fontSize: 14,
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    rideInfo: {
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
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
    },
    detailsContainer: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
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
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 45,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rejectButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#F44336',
    },
    rejectButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default DriverHomeScreen;
