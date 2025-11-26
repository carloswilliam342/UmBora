import styled from 'styled-components/native';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Cores do tema
export const colors = {
  primary: '#4CAF50',
  secondary: '#81C784',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#F5F5F5',
  darkGray: '#424242',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  error: '#F44336'
};

// Container principal
export const Container = styled.View`
  flex: 1;
  background-color: ${props => props.bgColor || colors.white};
`;

// Container com gradiente verde
export const GradientContainer = styled.View`
  flex: 1;
  background-color: ${colors.primary};
  justify-content: center;
  align-items: center;
`;

// Container de conteúdo
export const ContentContainer = styled.View`
  flex: 1;
  padding: 20px;
  justify-content: ${props => props.justify || 'center'};
  align-items: ${props => props.align || 'center'};
`;

// Título principal
export const MainTitle = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: ${props => props.color || colors.white};
  text-align: center;
  margin-bottom: 20px;
`;

// Título secundário
export const SubTitle = styled.Text`
  font-size: 18px;
  color: ${props => props.color || colors.textSecondary};
  text-align: center;
  margin-bottom: 30px;
`;

// Texto comum
export const Text = styled.Text`
  font-size: 16px;
  color: ${props => props.color || colors.text};
  text-align: ${props => props.align || 'left'};
  margin-bottom: ${props => props.mb || '0px'};
`;

// Logo
export const Logo = styled.View`
  width: 80px;
  height: 80px;
  background-color: ${colors.white};
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
`;

// Card branco
export const Card = styled.View`
  background-color: ${colors.white};
  border-radius: 20px;
  padding: 30px;
  margin: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
  elevation: 5;
`;

// Input de texto
export const TextInput = styled.TextInput`
  height: 50px;
  background-color: ${colors.lightGray};
  border-radius: 10px;
  padding: 0 15px;
  margin-bottom: 15px;
  font-size: 16px;
  color: ${colors.text};
`;

// Botão principal
export const PrimaryButton = styled.TouchableOpacity`
  background-color: ${props => props.bgColor || colors.primary};
  height: 50px;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  margin-vertical: 10px;
`;

// Texto do botão
export const ButtonText = styled.Text`
  color: ${props => props.color || colors.white};
  font-size: 16px;
  font-weight: bold;
`;

// Botão secundário (outline)
export const SecondaryButton = styled.TouchableOpacity`
  background-color: transparent;
  height: 50px;
  border: 2px solid ${colors.primary};
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  margin-vertical: 10px;
`;

// Container de abas (Cadastre-se / Entrar)
export const TabContainer = styled.View`
  flex-direction: row;
  background-color: ${colors.white};
  border-radius: 10px;
  margin-bottom: 30px;
  overflow: hidden;
`;

// Aba individual
export const Tab = styled.TouchableOpacity`
  flex: 1;
  height: 50px;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.active ? colors.white : 'transparent'};
  border-bottom-width: ${props => props.active ? '3px' : '0px'};
  border-bottom-color: ${colors.primary};
`;

// Texto da aba
export const TabText = styled.Text`
  font-size: 16px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? colors.text : colors.textSecondary};
`;

// Container do teclado numérico
export const KeyboardContainer = styled.View`
  background-color: ${colors.lightGray};
  padding: 20px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
`;

// Linha do teclado
export const KeyboardRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 15px;
`;

// Tecla do teclado
export const KeyboardKey = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  background-color: ${colors.white};
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 2;
`;

// Texto da tecla
export const KeyText = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${colors.text};
`;

// Texto pequeno da tecla
export const KeySubText = styled.Text`
  font-size: 10px;
  color: ${colors.textSecondary};
  margin-top: 2px;
`;

// Container dos indicadores de código
export const CodeContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-vertical: 30px;
`;

// Indicador de dígito do código
export const CodeDigit = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background-color: ${props => props.filled ? colors.primary : colors.lightGray};
  justify-content: center;
  align-items: center;
  margin-horizontal: 8px;
`;

// Texto do dígito
export const CodeDigitText = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.white};
`;