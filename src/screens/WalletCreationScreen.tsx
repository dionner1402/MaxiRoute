import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  BackHandler, // Importamos BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Importamos useFocusEffect
import { LinearGradient } from 'expo-linear-gradient';

const WalletCreationScreen = () => {
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [inputSeedPhrase, setInputSeedPhrase] = useState('');
  const [restoreMode, setRestoreMode] = useState(false);
  const [copying, setCopying] = useState(false);
  const navigation = useNavigation();

  // Personalizamos el comportamiento del botón de retroceso
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home'); // Navega a Home
        return true; // Indica que el evento fue manejado
      };

      // Añadimos el listener para el botón de retroceso
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Limpiamos el listener al salir de la pantalla
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  // Función para crear una nueva wallet con confirmación
  const createNewWallet = async () => {
    Alert.alert(
      'Confirmar Creación',
      '¿Estás seguro de que deseas crear una nueva wallet? Esto sobrescribirá cualquier wallet existente asociada a tu cuenta.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, crear',
          onPress: async () => {
            setLoading(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 100)); // Retraso simulado
              const wallet = ethers.Wallet.createRandom();
              const mnemonic = wallet.mnemonic.phrase;
              setSeedPhrase(mnemonic);
              setShowSeedPhrase(true);
              setLoading(false);
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'No se pudo crear la wallet. Inténtalo de nuevo.');
              console.error('Error al crear wallet:', error);
            }
          },
        },
      ]
    );
  };

  // Confirmar el respaldo de la frase semilla
  const confirmBackup = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Debes iniciar sesión primero');
        navigation.navigate('Login');
        return;
      }

      const mnemonicKey = `walletMnemonic_${userId}`;
      await AsyncStorage.setItem(mnemonicKey, seedPhrase);
      await AsyncStorage.setItem(`hasWallet_${userId}`, 'true');
      await AsyncStorage.setItem('walletAuthenticated', 'true');
      setShowSeedPhrase(false);

      Alert.alert(
        'Respaldo Confirmado',
        'Has confirmado el respaldo de tu semilla. Ahora puedes acceder a tu wallet.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.replace('WalletScreen'),
          },
        ]
      );
    } catch (error) {
      console.error('Error al confirmar backup:', error);
      Alert.alert('Error', 'No se pudo guardar la información de la wallet');
    }
  };

  // Copiar la frase semilla al portapapeles
  const copySeedToClipboard = async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(seedPhrase);
      Alert.alert('Copiado', 'Frase semilla copiada al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      Alert.alert('Error', 'No se pudo copiar la frase semilla');
    } finally {
      setCopying(false);
    }
  };

  // Restaurar wallet desde una frase semilla
  const restoreWallet = async () => {
    try {
      setLoading(true);
      let wallet;
      try {
        wallet = ethers.Wallet.fromPhrase(inputSeedPhrase.trim());
      } catch (e) {
        setLoading(false);
        Alert.alert('Error', 'La frase semilla no es válida. Verifica que sea correcta.');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        Alert.alert('Error', 'Debes iniciar sesión primero');
        navigation.navigate('Login');
        return;
      }

      const mnemonicKey = `walletMnemonic_${userId}`;
      await AsyncStorage.setItem(mnemonicKey, inputSeedPhrase.trim());
      await AsyncStorage.setItem(`hasWallet_${userId}`, 'true');
      await AsyncStorage.setItem('walletAuthenticated', 'true');
      setLoading(false);

      Alert.alert(
        'Wallet Restaurada',
        'Tu wallet ha sido restaurada exitosamente.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.replace('WalletScreen'),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo restaurar la wallet');
      console.error('Error al restaurar wallet:', error);
    }
  };

  // Renderizar los botones principales
  const renderMainButtons = () => (
    <View style={styles.buttonsContainer}>
      <LinearGradient colors={['#FFA41F', '#e88f0c']} style={styles.gradientButton}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('WalletLoginScreen')}
        >
          <Icon name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Abrir Mi Wallet</Text>
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity style={styles.outlineButton} onPress={createNewWallet}>
        <Icon name="add-circle-outline" size={24} color="#FFA41F" />
        <Text style={styles.outlineButtonText}>Crear Nueva Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar el modo de restauración
  const renderRestoreMode = () => (
    <View style={styles.restoreContainer}>
      <Text style={styles.restoreTitle}>Restaurar con Frase Semilla</Text>
      <Text style={styles.restoreDescription}>
        Ingresa las 12 palabras de tu frase semilla, separadas por espacios.
      </Text>
      <TextInput
        style={styles.seedInput}
        multiline
        numberOfLines={4}
        value={inputSeedPhrase}
        onChangeText={setInputSeedPhrase}
        placeholder="Ingresa tu frase semilla de 12 palabras..."
        placeholderTextColor="#a0aec0"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.restoreButtonsRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setRestoreMode(false);
            setInputSeedPhrase('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <LinearGradient colors={['#FFA41F', '#e88f0c']} style={styles.gradientRestoreButton}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={restoreWallet}
            disabled={!inputSeedPhrase.trim()}
          >
            <Text style={styles.restoreButtonText}>Restaurar</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );

  // Renderizar el modal de la frase semilla
  const renderSeedPhraseModal = () => (
    <Modal visible={showSeedPhrase} transparent={true} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tu Frase Semilla</Text>
          <View style={styles.warningContainer}>
            <Icon name="warning-outline" size={24} color="#f5a623" />
            <Text style={styles.warningText}>
              IMPORTANTE: Guarda esta frase en un lugar seguro. Es la única forma de recuperar tu wallet.
              Nunca compartas esta frase con nadie.
            </Text>
          </View>
          <View style={styles.seedPhraseContainer}>
            <Text style={styles.seedPhrase}>{seedPhrase}</Text>
          </View>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity style={styles.copyButton} onPress={copySeedToClipboard} disabled={copying}>
              <Icon name="copy-outline" size={20} color="#FFA41F" />
              <Text style={styles.copyButtonText}>{copying ? 'Copiando...' : 'Copiar'}</Text>
            </TouchableOpacity>
            <LinearGradient colors={['#FFA41F', '#e88f0c']} style={styles.gradientConfirmButton}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmBackup}>
                <Text style={styles.confirmButtonText}>He guardado mi frase</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Maxi Wallet</Text>
          <Text style={styles.subtitle}>Segura, rápida y fácil de usar</Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA41F" />
            <Text style={styles.loadingText}>Creando wallet...</Text>
          </View>
        ) : restoreMode ? (
          renderRestoreMode()
        ) : (
          renderMainButtons()
        )}
        {renderSeedPhraseModal()}
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
  buttonsContainer: {
    marginTop: 30,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FFA41F',
    borderRadius: 12,
  },
  outlineButtonText: {
    color: '#FFA41F',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff9db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5a623',
  },
  warningText: {
    color: '#744210',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  seedPhraseContainer: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
  },
  seedPhrase: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2d3748',
    fontFamily: 'Courier',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  copyButtonText: {
    marginLeft: 8,
    color: '#FFA41F',
    fontWeight: '600',
  },
  gradientConfirmButton: {
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
  },
  confirmButton: {
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  restoreContainer: {
    marginTop: 20,
  },
  restoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  restoreDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  seedInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#EDF2F7',
    height: 120,
    textAlignVertical: 'top',
  },
  restoreButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#718096',
    fontWeight: '600',
  },
  gradientRestoreButton: {
    borderRadius: 8,
    flex: 2,
    overflow: 'hidden',
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WalletCreationScreen;