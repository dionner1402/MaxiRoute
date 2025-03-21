import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Constantes para mejorar la mantenibilidad
const STORAGE_KEYS = {
  WALLET_AUTHENTICATED: 'walletAuthenticated',
  USER_ID: 'userId',
  WALLET_MNEMONIC_PREFIX: 'walletMnemonic_',
};

const WalletLoginScreen = () => {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation();

  // Restablecer el estado cuando el componente obtiene foco
  useFocusEffect(
    useCallback(() => {
      setSeedPhrase('');
      setLoading(false);
      setLoadingStep('');
      return () => {};
    }, [])
  );

  // Función optimizada para validar la wallet
  const validateWallet = async () => {
    if (!seedPhrase.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu frase semilla');
      return;
    }

    Keyboard.dismiss(); // Ocultar teclado durante la validación
    setLoading(true);
    
    try {
      // Paso 1: Verificar si el usuario está logueado
      setLoadingStep('Verificando sesión...');
      const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) {
        throw new Error('Debes iniciar sesión primero');
      }

      // Paso 2: Obtener la frase semilla almacenada
      setLoadingStep('Recuperando datos de wallet...');
      const storedMnemonicKey = `${STORAGE_KEYS.WALLET_MNEMONIC_PREFIX}${userId}`;
      const storedMnemonic = await AsyncStorage.getItem(storedMnemonicKey);
      if (!storedMnemonic) {
        navigation.replace('WalletCreationScreen');
        throw new Error('No se encontró una wallet asociada a tu cuenta');
      }

      // Paso 3: Validar la frase semilla - Ahora optimizado
      setLoadingStep('Validando credenciales...');
      
      // En lugar de crear dos wallets completas, solo obtenemos las direcciones
      let userAddress;
      try {
        // Optimización: usar computeAddress es más rápido que crear una wallet completa
        const userHDNode = ethers.HDNodeWallet.fromPhrase(seedPhrase.trim());
        userAddress = userHDNode.address;
      } catch (e) {
        throw new Error('La frase semilla no es válida. Verifica que sea correcta.');
      }
      
      // Obtenemos la dirección de la wallet almacenada
      const storedHDNode = ethers.HDNodeWallet.fromPhrase(storedMnemonic);
      const storedAddress = storedHDNode.address;
      
      // Comparar las direcciones
      if (userAddress !== storedAddress) {
        throw new Error('La frase semilla no corresponde a la wallet registrada');
      }

      // Paso 4: Autenticación exitosa
      setLoadingStep('Accediendo a tu wallet...');
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_AUTHENTICATED, 'true');
      
      // Pequeña pausa para mostrar el mensaje de éxito
      setTimeout(() => {
        setLoading(false);
        navigation.replace('WalletScreen');
      }, 300);
      
    } catch (error) {
      setLoading(false);
      
      // Manejo mejorado de errores para diferentes casos
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'No se pudo verificar la wallet');
        console.error('Error al verificar wallet:', error);
      }
    }
  };

  // Toggle para mostrar/ocultar la frase semilla
  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Icon name="wallet-outline" size={50} color="#FFA41F" />
          <Text style={styles.title}>Acceso a tu Wallet</Text>
          <Text style={styles.subtitle}>Ingresa tu frase semilla para continuar</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA41F" />
            <Text style={styles.loadingText}>{loadingStep || 'Verificando...'}</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Frase Semilla</Text>
              <View style={styles.seedInputWrapper}>
                <TextInput
                  style={styles.seedInput}
                  multiline
                  numberOfLines={4}
                  value={seedPhrase}
                  onChangeText={setSeedPhrase}
                  placeholder="Ingresa tu frase semilla de 12 palabras..."
                  placeholderTextColor="#a0aec0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={secureTextEntry}
                  spellCheck={false}
                  autoComplete="off"
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle} 
                  onPress={toggleSecureTextEntry}
                >
                  <Icon 
                    name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                    size={24} 
                    color="#718096" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.securityNote}>
                <Icon name="shield-checkmark-outline" size={14} color="#718096" />
                <Text> Tu frase semilla nunca se almacena en línea</Text>
              </Text>
            </View>

            <LinearGradient 
              colors={['#FFA41F', '#e88f0c']} 
              style={styles.gradientButton}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <TouchableOpacity
                style={styles.loginButton}
                onPress={validateWallet}
                disabled={!seedPhrase.trim() || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Acceder a mi Wallet</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('WalletCreationScreen', { fromLogin: true })}
              disabled={loading}
            >
              <Icon name="arrow-back-outline" size={20} color="#FFA41F" />
              <Text style={styles.backButtonText}>Volver a Opciones</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDF2F7',
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 20,
  },
  header: { 
    alignItems: 'center', 
    marginVertical: 30,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2d3748', 
    marginTop: 10,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#718096', 
    marginTop: 5, 
    textAlign: 'center',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 40,
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#718096',
  },
  formContainer: { 
    marginTop: 20,
  },
  inputContainer: { 
    marginBottom: 20,
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#4a5568', 
    marginBottom: 8,
  },
  seedInputWrapper: {
    position: 'relative',
  },
  seedInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Espacio para el botón de visibilidad
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#f8fafc',
    height: 120,
    textAlignVertical: 'top',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  visibilityToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 5,
  },
  securityNote: { 
    fontSize: 14, 
    color: '#718096', 
    marginTop: 8, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  gradientButton: { 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#FFA41F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16,
  },
  loginButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12,
  },
  backButtonText: { 
    color: '#FFA41F', 
    fontSize: 16, 
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default WalletLoginScreen;