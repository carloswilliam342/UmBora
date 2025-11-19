import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Container, MainTitle, Text, Card, TextInput, PrimaryButton, ButtonText, colors } from '../components/StyledComponents';

const PassengerHomeScreen = () => {
  return (
    <Container>
        {/* Aqui futuramente entrará o MAPA de fundo (Google Maps) */}
        <View style={styles.mapPlaceholder}>
            <Text align="center" color="#888">Mapa será carregado aqui</Text>
        </View>

        <Card style={styles.floatingCard}>
            <MainTitle style={{fontSize: 20, marginBottom: 10}}>Para onde vamos?</MainTitle>
            
            <TextInput 
                placeholder="Digite o destino..."
                placeholderTextColor="#999"
            />
            
            <PrimaryButton style={{marginTop: 10}}>
                <ButtonText>Buscar Motorista</ButtonText>
            </PrimaryButton>
        </Card>
    </Container>
  );
};

const styles = StyleSheet.create({
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#e0e0e0', // Cinza simulando mapa
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5, // Sombra no Android
        shadowColor: '#000', // Sombra no iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});

export default PassengerHomeScreen;