import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Container,
  GradientContainer,
  Card,
  MainTitle,
  Text,
  CodeContainer,
  CodeDigit,
  CodeDigitText,
  KeyboardContainer,
  KeyboardRow,
  KeyboardKey,
  KeyText,
  KeySubText,
  PrimaryButton,
  ButtonText,
  colors
} from '../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const PhoneVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phone, userData } = route.params || {};

  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleNumberPress = (number) => {
    const newCode = [...code];
    const emptyIndex = newCode.findIndex(digit => digit === '');

    if (emptyIndex !== -1) {
      newCode[emptyIndex] = number;
      setCode(newCode);

      // Auto verificar quando todos os dígitos forem preenchidos
      if (emptyIndex === 3) {
        handleVerify(newCode);
      }
    }
  };

  const handleBackspace = () => {
    const newCode = [...code];
    for (let i = 3; i >= 0; i--) {
      if (newCode[i] !== '') {
        newCode[i] = '';
        break;
      }
    }
    setCode(newCode);
  };

  const handleVerify = (codeToVerify = code) => {
    const verificationCode = codeToVerify.join('');

    if (verificationCode.length !== 4) {
      Alert.alert('Erro', 'Por favor, digite o código completo');
      return;
    }

    // Simular verificação (substitua pela lógica real)
    if (verificationCode === '1234') {
      Alert.alert('Sucesso', 'Telefone verificado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            // Navegar para tela principal ou completar cadastro
            console.log('Cadastro completo:', userData);
          }
        }
      ]);
    } else {
      Alert.alert('Erro', 'Código inválido. Tente novamente.');
      setCode(['', '', '', '']);
    }
  };

  const handleResendCode = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      setCode(['', '', '', '']);
      Alert.alert('Código Reenviado', 'Um novo código foi enviado para seu telefone');
    }
  };

  const renderKeyboard = () => {
    const keys = [
      [{ number: '1', letters: '' }, { number: '2', letters: 'ABC' }, { number: '3', letters: 'DEF' }],
      [{ number: '4', letters: 'GHI' }, { number: '5', letters: 'JKL' }, { number: '6', letters: 'MNO' }],
      [{ number: '7', letters: 'PQRS' }, { number: '8', letters: 'TUV' }, { number: '9', letters: 'WXYZ' }],
      [{ number: '', letters: '' }, { number: '0', letters: '' }, { number: 'delete', letters: '' }]
    ];

    return (
      <KeyboardContainer>
        {keys.map((row, rowIndex) => (
          <KeyboardRow key={rowIndex}>
            {row.map((key, keyIndex) => (
              <KeyboardKey
                key={keyIndex}
                onPress={() => {
                  if (key.number === 'delete') {
                    handleBackspace();
                  } else if (key.number) {
                    handleNumberPress(key.number);
                  }
                }}
                style={{
                  backgroundColor: key.number === '' ? 'transparent' : colors.white
                }}
              >
                {key.number === 'delete' ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.text} />
                ) : key.number ? (
                  <>
                    <KeyText>{key.number}</KeyText>
                    {key.letters ? <KeySubText>{key.letters}</KeySubText> : null}
                  </>
                ) : null}
              </KeyboardKey>
            ))}
          </KeyboardRow>
        ))}
      </KeyboardContainer>
    );
  };

  return (
    <Container>
      <GradientContainer>
        <MainTitle>Verificação de Telefone</MainTitle>

        <Card>
          <Text mb="20px" color={colors.textSecondary} align="center">
            Digite o código enviado
          </Text>

          <CodeContainer>
            {code.map((digit, index) => (
              <CodeDigit key={index} filled={digit !== ''}>
                <CodeDigitText>{digit}</CodeDigitText>
              </CodeDigit>
            ))}
          </CodeContainer>

          <PrimaryButton onPress={() => handleVerify()}>
            <ButtonText>Verificar Agora</ButtonText>
          </PrimaryButton>

          <Text align="center" color={colors.textSecondary}>
            {canResend ? (
              <Text color={colors.primary} onPress={handleResendCode}>
                Reenviar código
              </Text>
            ) : (
              `Reenviar em ${timer}s`
            )}
          </Text>
        </Card>
      </GradientContainer>

      {renderKeyboard()}
    </Container>
  );
};

export default PhoneVerificationScreen;