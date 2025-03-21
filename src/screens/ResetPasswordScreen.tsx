import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params; // Obtener el token de los parámetros
  const { isDarkMode } = useTheme();

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Por favor, completa todos los campos.');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }

    try {
      const response = await fetch('http://192.168.40.8:5000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Contraseña restablecida con éxito');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'No se pudo restablecer la contraseña');
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al conectarse con el servidor');
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f7f7f7' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        Restablecer Contraseña
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
        placeholder="Nueva contraseña"
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={[styles.input, { backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
        placeholder="Confirmar nueva contraseña"
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        secureTextEntry={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Restablecer Contraseña</Text>
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
    borderWidth: 1,
    borderColor: '#FFA41F',
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FFA41F',
    borderRadius: 8,
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ResetPasswordScreen;