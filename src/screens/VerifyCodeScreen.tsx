import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Ajusta la ruta según tu proyecto
import axios from 'axios';

export default function VerifyCodeScreen({ route, navigation }) {
  const { isDarkMode } = useTheme();
  const { email } = route.params;
  const [code, setCode] = useState('');

  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert('Error', 'Por favor ingresa el código de recuperación.');
      return;
    }

    try {
      const response = await axios.post('http://192.168.40.8:5000/api/users/verify-code', { email, code });
      if (response.status === 200) {
        Alert.alert('Éxito', 'Código verificado correctamente.');
        navigation.navigate('ResetPasswordScreen', { token: response.data.token });
      } else {
        Alert.alert('Error', 'El código ingresado es incorrecto.');
      }
    } catch (error) {
      console.error('Error en la verificación del código:', error);
      Alert.alert('Error', 'Hubo un problema al verificar el código.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f7f7f7' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        Ingresa el Código de Recuperación
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5' }]}
        placeholder="Código"
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
        <Text style={styles.buttonText}>Verificar Código</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#FFA41F',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    paddingLeft: 15,
  },
  button: {
    backgroundColor: '#FFA41F',
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});