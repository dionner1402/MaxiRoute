import 'react-native-get-random-values'; // Importa esto primero
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers'; // Ahora ethers puede usar crypto.getRandomValues
import axios from 'axios';



const StoreScreen = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [balance, setBalance] = useState('0.0000'); // Saldo de balance en la wallet
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // Configuración inicial del proveedor y contrato blockchain
  useEffect(() => {
    const setupBlockchain = async () => {
      try {
        // Conectar a Polygon Amoy con QuickNode
        const provider = new ethers.providers.JsonRpcProvider(
          'https://solemn-green-leaf.matic-amoy.quiknode.pro/9119cb55e0d53f780e3ebdb9afe68d917e315e84/'
        );
        setProvider(provider);

        // Dirección del contrato (sustituye cuando lo despliegues)
        const contractAddress = 'YOUR_CONTRACT_ADDRESS';
        const contractABI = [
          'function getBalance(address user) view returns (uint256)',
          'event BalanceUpdated(address indexed user, uint256 newBalance)'
        ];
        const contractInstance = contractAddress
          ? new ethers.Contract(contractAddress, contractABI, provider)
          : null;
        setContract(contractInstance);

        // Cargar saldo inicial
        await loadBalance(contractInstance);
      } catch (error) {
        console.error('Error al conectar con blockchain:', error);
        Alert.alert('Error', 'No se pudo conectar con la blockchain');
      }
    };

    const loadProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('http://192.168.40.8:5000/api/store/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setProducts([
          { id: '1', name: 'Producto 1', price: '10.00', description: 'Descripción del producto 1' },
          { id: '2', name: 'Producto 2', price: '25.00', description: 'Descripción del producto 2' },
        ]); // Datos de prueba
      }
    };

    setupBlockchain();
    loadProducts();
  }, []);

  // Cargar y actualizar saldo del usuario
  const loadBalance = async (contractInstance) => {
    try {
      const walletAddress = await getWalletAddress();
      if (!contractInstance) {
        // Simula saldo si no hay contrato desplegado
        setBalance('100.0000'); // Saldo ficticio para pruebas
        console.log('Usando saldo ficticio. Dirección:', walletAddress);
      } else {
        const balanceWei = await contractInstance.getBalance(walletAddress);
        const balanceEth = ethers.utils.formatEther(balanceWei); // Ajusta la unidad según tu token
        setBalance(balanceEth);

        // Escuchar eventos de actualización de saldo
        contractInstance.on('BalanceUpdated', (user, newBalance) => {
          if (user.toLowerCase() === walletAddress.toLowerCase()) {
            setBalance(ethers.utils.formatEther(newBalance));
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar saldo:', error);
    }
  };

  // Obtener dirección de la wallet del usuario
  const getWalletAddress = async () => {
    const mnemonic = await AsyncStorage.getItem('walletMnemonic');
    if (!mnemonic) {
      const wallet = ethers.Wallet.createRandom();
      await AsyncStorage.setItem('walletMnemonic', wallet.mnemonic.phrase);
      console.log('Nueva wallet generada. Dirección:', wallet.address); // Para copiar
      return wallet.address;
    }
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    console.log('Wallet existente. Dirección:', wallet.address); // Para copiar
    return wallet.address;
  };

  // Manejar compra de producto
  const handlePurchase = async (product) => {
    const productPrice = parseFloat(product.price);
    const currentBalance = parseFloat(balance);

    if (currentBalance < productPrice) {
      Alert.alert('Saldo Insuficiente', 'Por favor, recarga tu saldo para completar la compra.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const walletAddress = await getWalletAddress();

      // Simular transacción en backend (reemplazar con contrato más tarde)
      const response = await axios.post(
        'http://192.168.40.8:5000/api/store/purchase',
        { productId: product.id, walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Éxito', `Has comprado ${product.name} por ${product.price} C-MXC`);
      setBalance((currentBalance - productPrice).toFixed(4));
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      Alert.alert('Error', 'No se pudo completar la compra');
    }
  };

  // Renderizar cada producto
  const renderProduct = ({ item }) => (
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
        style={styles.buyButton}
        onPress={() => handlePurchase(item)}
      >
        <Text style={styles.buyButtonText}>Comprar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
          Tienda Interna
        </Text>
        <Text style={[styles.balance, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
          Saldo: {balance} C-MXC
        </Text>
        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={() => navigation.navigate('WalletScreen')}
        >
          <Text style={styles.rechargeButtonText}>Recargar Saldo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
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
  buyButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
});

export default StoreScreen;