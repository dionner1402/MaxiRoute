import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';

export default function RegisterScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);

  const [registerOption, setRegisterOption] = useState<'phone' | 'email'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState(''); // Campo opcional para el código de referido
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: isDarkMode ? '#141414' : '#F5F5F5' },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333',
    });
  }, [navigation, isDarkMode]);

  const handleRegister = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Por favor completa tu nombre y apellido.');
      return;
    }

    if (registerOption === 'email' && !email) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico.');
      return;
    } else if (registerOption === 'phone' && !phoneNumber) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono.');
      return;
    }

    if (registerOption === 'phone' && !/^\d{8}$/.test(phoneNumber)) {
      Alert.alert('Error', 'El número de teléfono debe tener exactamente 8 dígitos.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones.');
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    const userData: any = {
      name: fullName,
      password,
      email: registerOption === 'email' ? email : undefined,
      phone: registerOption === 'phone' ? `+507${phoneNumber}` : undefined,
    };

    // Si se ingresó un código de referido, lo enviamos al backend
    if (referralCode.trim() !== '') {
      userData.referrerId = referralCode.trim();
    }

    console.log('Datos a enviar:', userData);

    try {
      const response = await axios.post('http://192.168.40.5:5000/api/users/register', userData);
      if (response.status === 201) {
        Alert.alert('Éxito', `Usuario registrado con éxito.\nNombre: ${fullName}`);
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Hubo un problema con el registro.');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={
              isDarkMode
                ? require('C:/Users/dionn/Desktop/Proyectos/miappULT/assets/logo_am.png')
                : require('C:/Users/dionn/Desktop/Proyectos/miappULT/assets/logo_az.png')
            }
            style={styles.logo}
          />
        </View>

        {/* Selector de método de registro */}
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.optionButton, registerOption === 'email' && styles.optionButtonSelected]}
            onPress={() => setRegisterOption('email')}
          >
            <Text style={[styles.optionText, registerOption === 'email' && { color: '#F5F5F5' }]}>Correo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, registerOption === 'phone' && styles.optionButtonSelected]}
            onPress={() => setRegisterOption('phone')}
          >
            <Text style={[styles.optionText, registerOption === 'phone' && { color: '#F5F5F5' }]}>Teléfono</Text>
          </TouchableOpacity>
        </View>

        {/* Nombre y Apellido */}
        <View style={styles.nameContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="badge" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person-outline" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        {/* Campos según la opción de registro */}
        {registerOption === 'phone' ? (
          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
            <Text style={styles.phonePrefix}>+507</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Número de teléfono"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={8}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Contraseña */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{isPasswordVisible ? '🙉️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {/* Confirmar Contraseña */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmar Contraseña"
            placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
            secureTextEntry={!isConfirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{isConfirmPasswordVisible ? '🙉️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {/* Campo para código de referido (opcional) */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person-add" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Código de Referido (Opcional)"
            placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
            value={referralCode}
            onChangeText={setReferralCode}
          />
        </View>

        {/* Términos y Condiciones */}
        <View style={styles.termsContainer}>
          <Checkbox
            value={termsAccepted}
            onValueChange={setTermsAccepted}
            color={termsAccepted ? '#FFA41F' : undefined}
            style={styles.checkbox}
          />
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://example.com/terms')}>
              términos y condiciones
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.fixedFooter}>
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
    },
    scrollContainer: {
      padding: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    logo: {
      width: 290,
      height: 145,
    },
    optionContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 15,
    },
    optionButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFA41F',
      backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5',
      width: 120,
      alignItems: 'center',
    },
    optionButtonSelected: {
      backgroundColor: '#FFA41F',
      borderColor: '#FFA41F',
    },
    optionText: {
      color: isDarkMode ? '#F5F5F5' : '#333',
      fontSize: 14,
      fontWeight: 'bold',
    },
    nameContainer: {
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      borderColor: isDarkMode ? '#555' : '#ccc',
      borderWidth: 1,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5',
    },
    icon: {
      marginLeft: 10,
    },
    phonePrefix: {
      color: isDarkMode ? '#F5F5F5' : '#333',
      fontSize: 16,
      marginLeft: 5,
    },
    input: {
      flex: 1,
      height: 50,
      paddingLeft: 15,
      color: isDarkMode ? '#F5F5F5' : '#333',
    },
    phoneInput: {
      flex: 1,
      paddingLeft: 5,
      height: '100%',
      color: isDarkMode ? '#F5F5F5' : '#333',
    },
    eyeButton: {
      padding: 10,
    },
    eyeText: {
      fontSize: 18,
      color: isDarkMode ? '#FFA41F' : '#333',
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    checkbox: {
      marginRight: 10,
    },
    termsText: {
      color: isDarkMode ? '#F5F5F5' : '#333',
      fontSize: 14,
    },
    termsLink: {
      color: '#FFA41F',
      textDecorationLine: 'underline',
    },
    fixedFooter: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    registerButton: {
      backgroundColor: '#FFA41F',
      borderRadius: 20,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    registerButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#F5F5F5',
    },
    loginButton: {
      marginTop: 15,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFA41F',
      backgroundColor: 'transparent',
    },
    loginText: {
      fontSize: 16,
      color: '#FFA41F',
      fontWeight: 'bold',
    },
  });
