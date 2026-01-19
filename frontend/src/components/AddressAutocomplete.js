import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { searchAddress } from '../services/geocodingService';
import { colors } from './StyledComponents';

/**
 * Componente de autocomplete de endereços
 * Busca endereços enquanto o usuário digita usando OpenStreetMap
 */
const AddressAutocomplete = ({
    placeholder = "Digite o endereço",
    onSelectAddress,
    initialValue = "",
}) => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (query.length >= 3) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 500); // Espera 500ms após o usuário parar de digitar

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const fetchSuggestions = async (searchQuery) => {
        setLoading(true);
        try {
            const results = await searchAddress(searchQuery);
            setSuggestions(results);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAddress = (address) => {
        setQuery(address.displayName);
        setSuggestions([]);
        setShowSuggestions(false);
        onSelectAddress(address);
    };

    const renderSuggestion = (item, index) => (
        <TouchableOpacity
            key={`${item.latitude}-${item.longitude}-${index}`}
            style={styles.suggestionItem}
            onPress={() => handleSelectAddress(item)}
            activeOpacity={0.7}
        >
            <Text style={styles.suggestionText} numberOfLines={2}>
                {item.displayName}
            </Text>
            {item.city && (
                <Text style={styles.suggestionSubtext}>
                    {item.city}, {item.state}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={() => setShowSuggestions(true)}
                    placeholderTextColor="#888"
                />
                {loading && (
                    <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.loader}
                    />
                )}
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <ScrollView
                    style={styles.suggestionsContainer}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                >
                    {suggestions.map((item, index) => renderSuggestion(item, index))}
                </ScrollView>
            )}

            {showSuggestions && query.length >= 3 && suggestions.length === 0 && !loading && (
                <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>Nenhum endereço encontrado</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        zIndex: 1000,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    loader: {
        position: 'absolute',
        right: 15,
        top: 12,
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 5,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    suggestionSubtext: {
        fontSize: 12,
        color: '#666',
    },
    noResultsContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    noResultsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default AddressAutocomplete;
