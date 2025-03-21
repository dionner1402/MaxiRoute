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
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';

export default function LoginScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);

  const [loginOption, setLoginOption] = useState('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar credenciales guardadas
  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('rememberMe');
        if (savedCredentials) {
          const { email, phone, password } = JSON.parse(savedCredentials);
          setEmail(email || '');
          setPhoneNumber(phone || '');
          setPassword(password || '');
          setRememberMe(true);
          setLoginOption(email ? 'email' : 'phone');
        }
      } catch (error) {
        console.error('Error al cargar credenciales guardadas:', error);
      }
    };
    loadRememberedCredentials();
  }, []);

  // Verificar si el usuario ya está logueado
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.navigate('Home');
      }
    };
    checkUserLoggedIn();
  }, [navigation]);

  const handleLogin = async () => {
    if (loginOption === 'email' && !email.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu correo electrónico.');
      return;
    } else if (loginOption === 'phone' && !phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu número de teléfono.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      // Construir el objeto de datos a enviar
      const payload = {
        password: password.trim(),
      };
      
      if (loginOption === 'email') {
        payload.email = email.toLowerCase().trim();
      } else {
        payload.phone = `+507${phoneNumber.trim()}`;
      }

      console.log('Datos enviados al backend:', payload);

      // Hacer la solicitud al servidor
      const response = await fetch('http://192.168.40.5:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Procesar la respuesta
      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        // Guardar token y datos del usuario
        await AsyncStorage.setItem('token', data.token);
        if (data.name) {
          await AsyncStorage.setItem('userName', data.name);
        }
        
        // Manejar "Recuérdame"
        if (rememberMe) {
          await AsyncStorage.setItem(
            'rememberMe',
            JSON.stringify({
              email: loginOption === 'email' ? email.trim() : '',
              phone: loginOption === 'phone' ? phoneNumber.trim() : '',
              password: password.trim(),
            })
          );
        } else {
          await AsyncStorage.removeItem('rememberMe');
        }
        
        Alert.alert('Bienvenido', 'Inicio de sesión exitoso');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', data.message || 'Inicio de sesión fallido');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      Alert.alert('Error', 'Hubo un problema al conectarse con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPasswordScreen');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.optionButton, loginOption === 'email' && styles.optionButtonSelected]}
            onPress={() => setLoginOption('email')}
          >
            <Text style={[styles.optionText, loginOption === 'email' && { color: '#F5F5F5' }]}>
              Correo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, loginOption === 'phone' && styles.optionButtonSelected]}
            onPress={() => setLoginOption('phone')}
          >
            <Text style={[styles.optionText, loginOption === 'phone' && { color: '#F5F5F5' }]}>
              Teléfono
            </Text>
          </TouchableOpacity>
        </View>
        {loginOption === 'email' ? (
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ) : (
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
        )}
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
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>{isPasswordVisible ? '🙉️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rememberMeContainer}>
          <Checkbox
            value={rememberMe}
            onValueChange={setRememberMe}
            color={rememberMe ? '#FFA41F' : undefined}
            style={styles.checkbox}
          />
          <Text style={[styles.rememberMeText, { color: isDarkMode ? '#F5F5F5' : '#555' }]}>
            Recuérdame
          </Text>
        </View>
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: '#FFA41F' }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Al iniciar sesión, aceptas nuestros{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://example.com/terms')}
            >
              términos y condiciones
            </Text>
          </Text>
        </View>
      </ScrollView>
      <View style={styles.fixedFooter}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#F5F5F5" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
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
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    checkbox: {
      marginRight: 10,
    },
    rememberMeText: {
      fontSize: 16,
    },
    forgotPassword: {
      alignItems: 'center',
      marginBottom: 20,
    },
    forgotPasswordText: {
      fontSize: 16,
    },
    termsContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    termsText: {
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
    loginButton: {
      backgroundColor: '#FFA41F',
      borderRadius: 20,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#F5F5F5',
    },
    registerButton: {
      marginTop: 15,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFA41F',
      backgroundColor: 'transparent',
    },
    registerText: {
      fontSize: 16,
      color: '#FFA41F',
      fontWeight: 'bold',
    },
  });