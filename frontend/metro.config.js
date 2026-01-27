const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Adicionar resolver para web
config.resolver = {
    ...config.resolver,
    resolveRequest: (context, moduleName, platform) => {
        // Redirecionar react-native-maps para o mock quando estiver na web
        if (platform === 'web' && moduleName === 'react-native-maps') {
            return {
                filePath: path.resolve(__dirname, 'src/mocks/react-native-maps.web.js'),
                type: 'sourceFile',
            };
        }

        // Usar o resolver padrão para outros casos
        return context.resolveRequest(context, moduleName, platform);
    },
};

module.exports = config;
