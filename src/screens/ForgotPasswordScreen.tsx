import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const handleSubmit = async () => {
    if (!email) {
      return Alert.alert('Error', 'Por favor, ingresa tu correo electrónico.');
    }

    try {
      const response = await fetch('http://192.168.40.8:5000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Recuperación de Contraseña', 'Revisa tu correo para instrucciones.');
        navigation.navigate('VerifyCodeScreen', { email }); // Cambiar a VerifyCodeScreen
      } else {
        Alert.alert('Error', data.message || 'No se pudo procesar la solicitud.');
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al conectarse con el servidor.');
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        Recuperar Contraseña
      </Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#2b3a47' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
        placeholder="Correo electrónico"
        placeholderTextColor={isDarkMode ? '#ccc' : '#888'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FFA41F' }]}
        onPress={handleSubmit}
      >
        <Text style={[styles.buttonText, { color: isDarkMode ? '#EDF2F7' : '#F5F5F5' }]}>
          Enviar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.backButton, { borderColor: '#FFA41F' }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFA41F" />
        <Text style={[styles.backButtonText, { color: '#FFA41F' }]}>
          Volver
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;