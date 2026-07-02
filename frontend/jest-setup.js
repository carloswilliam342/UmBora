// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      replace: jest.fn(),
      addListener: jest.fn(() => () => {}),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});
global.mockNavigate = mockNavigate;

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, style, ...props }) => {
      const { View } = require('react-native');
      return <View style={style} {...props}>{children}</View>;
    },
    useSafeAreaInsets: () => inset,
  };
});

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props) => <Text {...props} />,
  };
});

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MockMapView extends React.Component {
    render() {
      return <View {...this.props}>{this.props.children}</View>;
    }
  }
  class MockMarker extends React.Component {
    render() {
      return <View {...this.props}>{this.props.children}</View>;
    }
  }
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: () => null,
    Circle: () => null,
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: -23.55052,
        longitude: -46.633308,
        accuracy: 5,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: 0,
    })
  ),
}));

// Mock NetInfo ou outros se necessário.
// Silenciar logs de erro irritantes em testes que são esperados
console.error = (message, ...args) => {
  if (
    typeof message === 'string' &&
    (message.includes('React Native warning') || message.includes('styled-components'))
  ) {
    return;
  }
  process.stderr.write(message + '\n');
};
