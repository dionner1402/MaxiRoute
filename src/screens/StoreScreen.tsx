import 'react-native-get-random-values';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import axios from 'axios';
import OfflineService from '../services/OfflineService';
import NetInfo from '@react-native-community/netinfo';

// URL base para API desde el .env (usando el puerto proporcionado)
const API_BASE_URL = "http://192.168.40.5:5000"; // PORT=5000 en .env

const StoreScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [serverStatus, setServerStatus] = useState({ online: false, message: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState<string>('0.0000');
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  interface Product {
    id: string;
    name: string;
    price: string;
    description: string;
  }

  useFocusEffect(
    useCallback(() => {
      loadWalletAndProducts();
      return () => {
        if (contract) {
          contract.removeAllListeners('Withdrawal');
        }
      };
    }, [])
  );

  const loadWalletAndProducts = async () => {
    setIsLoading(true);
    try {
      const status = await OfflineService.checkServerStatus();
      setServerStatus(status);
      setIsOfflineMode(!status.online);
      await loadCachedProducts();
      if (status.online) {
        await setupBlockchain();
        await loadFreshProducts();
      } else {
        const storedBalance = await AsyncStorage.getItem('walletBalance');
        if (storedBalance) {
          setBalance(storedBalance);
        } else {
          setBalance('100.0000');
          await AsyncStorage.setItem('walletBalance', '100.0000');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedProducts = async () => {
    try {
      const cachedProducts = await OfflineService.getCachedData('cachedProducts');
      if (cachedProducts && Array.isArray(cachedProducts)) {
        setProducts(cachedProducts);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error al cargar productos cacheados:', e);
      return false;
    }
  };

  const loadFreshProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/store/products`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (response.data && Array.isArray(response.data)) {
        const freshProducts = response.data as Product[];
        setProducts(freshProducts);
        await OfflineService.cacheData('cachedProducts', freshProducts, 30); // Cache por 30 minutos
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cargar productos frescos:', error);
      if (products.length === 0) {
        const fallbackProducts = [
          { id: '1', name: 'Producto 1', price: '10.00', description: 'Descripción del producto 1' },
          { id: '2', name: 'Producto 2', price: '25.00', description: 'Descripción del producto 2' },
          { id: '3', name: 'Producto 3', price: '15.00', description: 'Descripción del producto 3' },
          { id: '4', name: 'Producto 4', price: '20.00', description: 'Descripción del producto 4' },
        ];
        setProducts(fallbackProducts);
        await OfflineService.cacheData('cachedProducts', fallbackProducts, 60); // Cache por 60 minutos
      }
      setIsOfflineMode(true);
      return false;
    }
  };

  const setupBlockchain = async () => {
    setIsConnecting(true);
    try {
      const lastFailTime = await AsyncStorage.getItem('lastBlockchainConnectFail');
      if (lastFailTime && (Date.now() - parseInt(lastFailTime)) < 60000) {
        console.log('Modo offline forzado: última conexión blockchain falló recientemente');
        throw new Error('Conexión reciente falló, usando modo offline');
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000,
          });
          if (response.data && response.data.balance) {
            setBalance(response.data.balance.toFixed(4));
            setIsOfflineMode(false);
            return;
          }
        } catch (serverError) {
          console.error('Error al obtener saldo del servidor:', serverError);
        }
      }

      // Configuración desde el .env
      const POLYGON_AMOY_URL = 'https://solemn-green-leaf.matic-amoy.quiknode.pro/9119cb55e0d53f780e3ebdb9afe68d917e315e84/';
      const CONTRACT_ADDRESS = '0x8e9f41E617ebd9e235A0683F3A7E5a705Ddb32A0';

      const providerOptions = {
        chainId: 80002,
        name: 'matic-amoy',
        ensAddress: null,
      };
      const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_URL, providerOptions);
      setProvider(provider);

      await AsyncStorage.setItem('contractAddress', CONTRACT_ADDRESS);
      const contractABI = [
        'function unlockTime() view returns (uint256)',
        'function owner() view returns (address payable)',
        'function withdraw() public',
        'event Withdrawal(uint amount, uint when)',
      ];
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      setContract(contractInstance);
      await loadBalance(contractInstance);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Error al conectar con blockchain:', error);
      await AsyncStorage.setItem('lastBlockchainConnectFail', Date.now().toString());
      const storedBalance = await AsyncStorage.getItem('walletBalance');
      if (storedBalance) {
        setBalance(storedBalance);
      } else {
        setBalance('100.0000');
        await AsyncStorage.setItem('walletBalance', '100.0000');
      }
      setIsOfflineMode(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadBalance = async (contractInstance: ethers.Contract | null) => {
    try {
      const walletAddress = await getWalletAddress();
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Dirección de wallet inválida');
      }
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000,
          });
          if (response.data && response.data.balance) {
            setBalance(response.data.balance.toFixed(4));
            await AsyncStorage.setItem('walletBalance', response.data.balance.toFixed(4));
            return;
          }
        } catch (serverError) {
          console.error('Error al cargar saldo desde el servidor:', serverError);
        }
      }
      if (!contractInstance) {
        const storedBalance = await AsyncStorage.getItem('walletBalance');
        setBalance(storedBalance || '100.0000');
        return;
      }
      const unlockTime = await contractInstance.unlockTime();
      console.log('Unlock Time:', unlockTime.toString());
      const storedBalance = await AsyncStorage.getItem('walletBalance');
      setBalance(storedBalance || '100.0000');
      contractInstance.removeAllListeners('Withdrawal');
      contractInstance.on('Withdrawal', (amount: bigint, when: bigint) => {
        console.log('Evento Withdrawal:', amount.toString(), when.toString());
      });
    } catch (error) {
      console.error('Error al cargar saldo:', error);
      const storedBalance = await AsyncStorage.getItem('walletBalance');
      setBalance(storedBalance || '100.0000');
    }
  };

  const getWalletAddress = async (): Promise<string> => {
    try {
      const mnemonic = await AsyncStorage.getItem('walletMnemonic');
      if (!mnemonic) {
        const wallet = ethers.Wallet.createRandom();
        await AsyncStorage.setItem('walletMnemonic', wallet.mnemonic.phrase);
        console.log('Nueva wallet generada. Dirección:', wallet.address);
        return wallet.address;
      }
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      console.log('Wallet existente. Dirección:', wallet.address);
      return wallet.address;
    } catch (error) {
      console.error('Error al obtener dirección de wallet:', error);
      const emergencyWallet = ethers.Wallet.createRandom();
      return emergencyWallet.address;
    }
  };

  const handlePurchase = async (product: Product) => {
    if (isPurchasing) return;
    const productPrice = parseFloat(product.price);
    const currentBalance = parseFloat(balance);
    if (currentBalance < productPrice) {
      Alert.alert('Saldo Insuficiente', 'Por favor, recarga tu saldo para completar la compra.');
      return;
    }
    setIsPurchasing(true);
    try {
      if (isOfflineMode) {
        const result = await OfflineService.performOfflineTransaction(
          'Compra',
          productPrice,
          `Compra de ${product.name}`
        );
        if (result.success) {
          setBalance(result.newBalance);
          Alert.alert('Éxito', `Has comprado ${product.name} por ${product.price} C-MXC (Modo Offline)`);
        } else {
          Alert.alert('Error', result.message || 'No se pudo completar la compra');
        }
      } else {
        const token = await AsyncStorage.getItem('token');
        const walletAddress = await getWalletAddress();
        const response = await axios.post(
          `${API_BASE_URL}/api/store/purchase`,
          { productId: product.id, walletAddress },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );
        if (response.data && response.data.success) {
          if (response.data.newBalance) {
            setBalance(response.data.newBalance.toFixed(4));
          } else {
            setBalance((currentBalance - productPrice).toFixed(4));
          }
          Alert.alert('Éxito', `Has comprado ${product.name} por ${product.price} C-MXC`);
        } else {
          throw new Error(response.data?.message || 'Error desconocido');
        }
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      if (!isOfflineMode) {
        Alert.alert(
          'Error de Conexión',
          '¿Deseas realizar esta compra en modo offline?',
          [
            {
              text: 'Sí',
              onPress: async () => {
                setIsOfflineMode(true);
                const result = await OfflineService.performOfflineTransaction(
                  'Compra',
                  productPrice,
                  `Compra de ${product.name}`
                );
                if (result.success) {
                  setBalance(result.newBalance);
                  Alert.alert('Éxito', `Has comprado ${product.name} por ${product.price} C-MXC (Modo Offline)`);
                } else {
                  Alert.alert('Error', result.message || 'No se pudo completar la compra');
                }
              }
            },
            { text: 'No', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo completar la compra');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
      <Text style={[styles.productName, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
        {item.name}
      </Text>
      <Text style={[styles.productDescription, { color: isDarkMode ? '#AAAAAA' : '#666' }]}>
        {item.description}
      </Text>
      <Text style={[styles.productPrice, { color: '#FFA41F' }]}>
        {item.price} C-MXC
      </Text>
      <TouchableOpacity
        style={[styles.buyButton, isPurchasing && styles.disabledButton]}
        onPress={() => handlePurchase(item)}
        disabled={isPurchasing}
      >
        <Text style={styles.buyButtonText}>
          {isPurchasing ? 'Procesando...' : 'Comprar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color="#FFA41F" />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
          Cargando productos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
          Tienda Interna
        </Text>
        <Text style={[styles.balance, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
          Saldo: {balance} C-MXC
          {isOfflineMode && ' (Modo Offline)'}
        </Text>
        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={() => navigation.navigate('WalletScreen')}
        >
          <Text style={styles.rechargeButtonText}>Recargar Saldo</Text>
        </TouchableOpacity>
      </View>
      {isOfflineMode && (
        <View style={[styles.offlineNotice, { backgroundColor: isDarkMode ? '#2D2D2D' : '#FFF9E6' }]}>
          <Text style={[styles.offlineText, { color: isDarkMode ? '#FFA41F' : '#CC8400' }]}>
            Modo sin conexión activado. Las compras se sincronizarán cuando vuelva la conexión.
          </Text>
        </View>
      )}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  balance: { fontSize: 18, marginBottom: 10 },
  rechargeButton: {
    backgroundColor: '#FFA41F',
    padding: 10,
    borderRadius: 5,
  },
  rechargeButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  productList: { paddingBottom: 20 },
  productCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  productDescription: { fontSize: 14, marginBottom: 10 },
  productPrice: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  buyButton: {
    backgroundColor: '#FFA41F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  buyButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  offlineNotice: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFA41F',
  },
  offlineText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

export default StoreScreen;