import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';


const WalletEntryScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkWallet = async () => {
      try {
        // Verificar autenticación
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Error', 'Debes iniciar sesión primero');
          navigation.navigate('Login');
          return;
        }

        // Obtener userId
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          // Si no hay userId en AsyncStorage, intentar obtenerlo del servidor
          try {
            const response = await fetch('http://192.168.40.5:5000/api/users/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data && data._id) {
              await AsyncStorage.setItem('userId', data._id);
              checkWalletExists(data._id);
            } else {
              throw new Error('No se pudo obtener el ID de usuario');
            }
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            Alert.alert('Error', 'No se pudo verificar la identidad del usuario');
            navigation.navigate('Home');
          }
        } else {
          // Si ya tenemos userId, comprobar si existe wallet
          checkWalletExists(userId);
        }
      } catch (error) {
        console.error('Error al verificar wallet:', error);
        Alert.alert('Error', 'No se pudo verificar la wallet');
        navigation.navigate('Home');
      }
    };

    // Función para verificar si existe una wallet para el userId
    const checkWalletExists = async (userId) => {
      const mnemonicKey = `walletMnemonic_${userId}`;
      const storedMnemonic = await AsyncStorage.getItem(mnemonicKey);
      
      if (storedMnemonic) {
        // Ya existe una wallet, redirigir a la pantalla de login de wallet
        navigation.replace('WalletCreationScreen');
      } else {
        // No existe wallet, redirigir a la pantalla de creación
        navigation.replace('WalletCreationScreen');
      }
    };

    checkWallet();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFA41F" />
      <Text style={styles.loadingText}>Verificando wallet...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#718096',
  },
});

export default WalletEntryScreen;