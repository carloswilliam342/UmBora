// Mock de react-native-maps para Web
import React from 'react';
import { View, Text } from 'react-native';

// Mock do MapView
const MapView = ({ children, style }) => (
    <View style={[style, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#666' }}>
            🗺️ Mapa não disponível na web
        </Text>
        {children}
    </View>
);

// Mock do Marker
const Marker = () => null;

MapView.Marker = Marker;

export default MapView;
export { Marker };
