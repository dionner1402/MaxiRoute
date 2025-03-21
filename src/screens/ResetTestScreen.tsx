import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ResetPasswordScreen = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirmPassword) {
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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restablecer Contraseña</Text>

      <TextInput
        style={styles.input}
        placeholder="Token de recuperación"
        value={token}
        onChangeText={setToken}
      />
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar nueva contraseña"
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 20 },
  button: { width: '100%', padding: 14, backgroundColor: '#FFA41F', borderRadius: 8 },
  buttonText: { color: '#FFF', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
});

export default ResetPasswordScreen;